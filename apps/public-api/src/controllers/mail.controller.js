const { z } = require("zod");
const { Project, MailTemplate, decrypt, redis, sendMailSchema, publicEmailQueue, MailLog, AppError, ApiResponse } = require("@urbackend/common");
const { Resend } = require("resend");
const {
  getMonthKey,
  getEndOfMonthTtlSeconds,
  getMonthlyMailLimit,
} = require("../utils/mailLimit");


const getMailCountKey = (projectId, monthKey) =>
  `project:mail:count:${projectId}:${monthKey}`;

const loadProjectMailConfig = async (projectId) => {
  return Project.findById(projectId)
    .select("+resendApiKey.encrypted +resendApiKey.iv +resendApiKey.tag resendFromEmail +mailTemplates")
    .lean();
};

const reserveMonthlyMailSlot = async (projectId, limit) => {
  if (redis.status !== "ready") {
    const err = new Error("Mail service unavailable. Redis is not ready.");
    err.statusCode = 503;
    throw err;
  }

  const now = new Date();
  const monthKey = getMonthKey(now);
  const ttlSeconds = getEndOfMonthTtlSeconds(now);
  const key = getMailCountKey(projectId, monthKey);

  const luaScript = `
    local current = redis.call("INCR", KEYS[1])
    if current == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[1])
    end
    return current
  `;
  const count = await redis.eval(luaScript, 1, key, ttlSeconds);

  if (count > limit) {
    await redis.decr(key);
    const err = new Error("Monthly mail limit exceeded.");
    err.statusCode = 429;
    err.limit = limit;
    throw err;
  }

  return { count, key };
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const toSafeUrl = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {}
  return "";
};

const sanitizeTemplateVariables = (input, parentKey = "") => {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeTemplateVariables(item, parentKey));
  }
  if (input && typeof input === "object") {
    const out = {};
    for (const [key, value] of Object.entries(input)) {
      out[key] = sanitizeTemplateVariables(value, key);
    }
    return out;
  }

  if (typeof input === "string" && /(url|uri)$/i.test(parentKey)) {
    return toSafeUrl(input);
  }

  return input;
};

const getVarByPath = (vars, path) => {
  if (!vars || typeof vars !== "object") return "";
  const parts = String(path || "")
    .split(".")
    .map((p) => p.trim())
    .filter(Boolean);
  let cur = vars;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) {
      cur = cur[p];
    } else {
      return "";
    }
  }
  return cur ?? "";
};

const renderTemplateString = (template, vars, { mode }) => {
  if (typeof template !== "string" || !template) return template;

  // mode: 'html' | 'text'
  const isHtml = mode === "html";

  // Support raw HTML insertion with triple braces: {{{name}}}
  let out = template.replace(/\{\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}\}/g, (_, key) => {
    const v = getVarByPath(vars, key);
    return String(v ?? "");
  });

  // Default replacement: {{name}} (HTML-escaped when mode==='html')
  out = out.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key) => {
    const v = getVarByPath(vars, key);
    const s = String(v ?? "");
    return isHtml ? escapeHtml(s) : s;
  });

  return out;
};

module.exports.sendMail = async (req, res, next) => {
  let consumedQuotaKey = null;
  try {
    if (req.keyRole !== "secret") {
      return next(new AppError(403, "Forbidden. This action requires a Secret Key (sk_live_...)."));
    }

    const {
      to,
      subject,
      html,
      text,
      templateId,
      templateName,
      variables,
    } = sendMailSchema.parse(req.body || {});
    const projectId = req.project?._id;

    if (!projectId) {
      return next(new AppError(401, "Project context missing."));
    }

    const project = await loadProjectMailConfig(projectId);
    if (!project) {
      return next(new AppError(404, "Project not found."));
    }

    const vars =
      variables && typeof variables === "object"
        ? sanitizeTemplateVariables(variables)
        : {};

    let resolvedSubject = typeof subject === "string" ? subject : "";
    let resolvedHtml = typeof html === "string" ? html : "";
    let resolvedText = typeof text === "string" ? text : "";
    let templateUsed = null;

    const usingTemplate =
      (typeof templateId === "string" && templateId.trim().length > 0) ||
      (typeof templateName === "string" && templateName.trim().length > 0);

    if (usingTemplate) {
      let t = null;

      if (templateId) {
        t = await MailTemplate.findOne({
          _id: templateId,
          $or: [{ projectId }, { projectId: null }],
        }).lean();
      }

      if (!t && templateName) {
        const q = String(templateName || "").trim().toLowerCase();

        // Project override first
        t = await MailTemplate.findOne({
          projectId,
          $or: [{ keyLower: q }, { nameLower: q }],
        }).lean();

        if (!t) {
          t = await MailTemplate.findOne({
            projectId: null,
            isSystem: true,
            $or: [{ keyLower: q }, { nameLower: q }],
          }).lean();
        }
      }

      // Legacy fallback (older projects stored templates inside Project document)
      if (!t) {
        const legacyTemplates = Array.isArray(project.mailTemplates) ? project.mailTemplates : [];
        const legacy = templateId
          ? legacyTemplates.find((x) => String(x._id) === String(templateId))
          : legacyTemplates.find(
              (x) => String(x.name || "").toLowerCase() === String(templateName || "").trim().toLowerCase(),
            );

        if (legacy) {
          t = {
            _id: legacy._id,
            projectId,
            key: "",
            name: legacy.name,
            subject: legacy.subject,
            html: legacy.html,
            text: legacy.text,
          };
        }
      }

      if (!t) {
        return next(new AppError(400, "Template not found."));
      }

      // Enforce Pro feature limit only for custom (project-owned) templates.
      if (t.projectId) {
        if (!req.planLimits || req.planLimits.mailTemplatesEnabled !== true) {
          return next(new AppError(403, "Custom Email Templates are a Pro feature. Please upgrade to use this functionality."));
        }
      }

      templateUsed = {
        id: t._id,
        scope: t.projectId ? "project" : "global",
        key: t.key || "",
        name: t.name,
      };

      if (!resolvedSubject.trim()) resolvedSubject = String(t.subject || "");
      if (!resolvedHtml.trim()) resolvedHtml = String(t.html || "");
      if (!resolvedText.trim()) resolvedText = String(t.text || "");
    }

    if (!resolvedSubject || !resolvedSubject.trim()) {
      return next(new AppError(400, "Subject is required."));
    }

    const hasBody =
      (typeof resolvedHtml === "string" && resolvedHtml.trim().length > 0) ||
      (typeof resolvedText === "string" && resolvedText.trim().length > 0);
    if (!hasBody) {
      return next(new AppError(400, "Provide at least one of html or text content."));
    }

    resolvedSubject = renderTemplateString(resolvedSubject, vars, { mode: "text" });
    if (typeof resolvedHtml === "string" && resolvedHtml.trim()) {
      resolvedHtml = renderTemplateString(resolvedHtml, vars, { mode: "html" });
    }
    if (typeof resolvedText === "string" && resolvedText.trim()) {
      resolvedText = renderTemplateString(resolvedText, vars, { mode: "text" });
    }

    if (!resolvedSubject || !resolvedSubject.trim()) {
      return next(new AppError(400, "Subject is required."));
    }

    const hasRenderedBody =
      (typeof resolvedHtml === "string" && resolvedHtml.trim().length > 0) ||
      (typeof resolvedText === "string" && resolvedText.trim().length > 0);
    if (!hasRenderedBody) {
      return next(new AppError(400, "Provide at least one of html or text content."));
    }

    const encryptedByokKey =
      project.resendApiKey && typeof project.resendApiKey === "object" && Object.keys(project.resendApiKey).length > 0
        ? project.resendApiKey
        : null;
    const decryptedByokKey = encryptedByokKey ? decrypt(encryptedByokKey) : null;

    const usingByok = typeof decryptedByokKey === "string" && decryptedByokKey.trim().length > 0;
    const clientKey = usingByok
      ? decryptedByokKey.trim()
      : process.env.RESEND_API_KEY_2 || process.env.RESEND_API_KEY;

    if (!clientKey) {
      return next(new AppError(500, "Resend API key is not configured."));
    }

    const limit = getMonthlyMailLimit(req.project, req.planLimits);
    const { count, key } = await reserveMonthlyMailSlot(projectId, limit);
    consumedQuotaKey = key;

    const payload = {
      to,
      subject: resolvedSubject,
    };
    if (typeof resolvedHtml === "string" && resolvedHtml.trim()) payload.html = resolvedHtml;
    if (typeof resolvedText === "string" && resolvedText.trim()) payload.text = resolvedText;

    const job = await publicEmailQueue.add("send-public-email", {
      projectId,
      payload,
      usingByok,
      consumedQuotaKey,
      templateUsed
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    return new ApiResponse({
      id: job.id ? String(job.id) : null,
      provider: usingByok ? "byok" : "default",
      monthlyUsage: count,
      monthlyLimit: limit,
      ...(templateUsed ? { templateUsed } : {}),
    }, "Mail queued successfully.").send(res, 200);
  } catch (err) {
    if (consumedQuotaKey) {
      await redis.decr(consumedQuotaKey).catch(() => {});
    }

    if (err instanceof z.ZodError) {
      return next(new AppError(400, err.issues?.[0]?.message || "Invalid mail payload.", "Validation Error"));
    }

    const appErr = new AppError(err.statusCode || 500, err.message || "Failed to send mail.");
    if (typeof err.limit === "number") appErr.limit = err.limit;
    return next(appErr);
  }
};

// --- EXPANDED MAIL PLATFORM IMPLEMENTATION ---

const resolveResendClient = async (req) => {
  const projectId = req.project?._id;
  if (!projectId) {
    const err = new Error("Project context missing.");
    err.statusCode = 401;
    throw err;
  }
  
  const project = await Project.findById(projectId).select("+resendApiKey.encrypted +resendApiKey.iv +resendApiKey.tag resendFromEmail").lean();
  const encryptedByokKey = project?.resendApiKey && Object.keys(project.resendApiKey).length > 0 ? project.resendApiKey : null;
  const decryptedByokKey = encryptedByokKey ? decrypt(encryptedByokKey) : null;
  const usingByok = typeof decryptedByokKey === "string" && decryptedByokKey.trim().length > 0;
  
  const apiKey = usingByok ? decryptedByokKey.trim() : (process.env.RESEND_API_KEY_2 || process.env.RESEND_API_KEY);
  if (!apiKey) {
    const err = new Error("Resend API key is not configured.");
    err.statusCode = 500;
    throw err;
  }
  
  return { 
    resend: new Resend(apiKey), 
    apiKey, 
    usingByok,
    fromAddress: project?.resendFromEmail?.trim() || process.env.EMAIL_FROM || "urBackend <urbackend@apps.bitbros.in>"
  };
};

const requireByokGate = async (req) => {
  const { resend, usingByok } = await resolveResendClient(req);
  if (!usingByok) {
    const err = new Error("This feature requires a BYOK Resend key. Configure it in Project Settings.");
    err.statusCode = 403;
    throw err;
  }
  return resend;
};

// GET /api/mail/logs
module.exports.getMailLogs = async (req, res, next) => {
  try {
    const projectId = req.project?._id;
    if (!projectId) {
      return next(new AppError(401, "Project context missing."));
    }

    const parsedPage = parseInt(req.query.page, 10);
    const parsedLimit = parseInt(req.query.limit, 10);
    const page = Math.max(1, !isNaN(parsedPage) ? parsedPage : 1);
    const limit = Math.max(1, Math.min(!isNaN(parsedLimit) ? parsedLimit : 50, 100));
    const skip = (page - 1) * limit;

    const total = await MailLog.countDocuments({ projectId });
    const logs = await MailLog.find({ projectId })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return new ApiResponse({
      items: logs,
      total,
      page,
      limit,
    }, "Mail logs retrieved successfully.").send(res, 200);
  } catch (err) {
    return next(new AppError(500, err.message || "Failed to retrieve mail logs."));
  }
};

// GET /api/mail/logs/:resendId
module.exports.getMailStatus = async (req, res, next) => {
  try {
    const { resendId } = req.params;
    if (!resendId) return next(new AppError(400, "resendId is required."));
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(resendId)) {
      return next(new AppError(400, "Invalid resendId format."));
    }

    const projectId = req.project?._id;
    const logEntry = await MailLog.findOne({ resendEmailId: resendId, projectId }).lean();
    if (!logEntry) {
      return next(new AppError(404, "Mail log entry not found for this project."));
    }

    const { resend } = await resolveResendClient(req);
    const { data, error } = await resend.emails.get(resendId);
    if (error) {
      return next(new AppError(error.statusCode || 500, error.message || "Failed to fetch email status from Resend."));
    }

    return new ApiResponse({
      dbLog: logEntry,
      last_event: data?.last_event || logEntry.status,
      resendStatus: data
    }, "Mail status retrieved successfully.").send(res, 200);
  } catch (err) {
    return next(new AppError(500, err.message || "Failed to fetch mail status."));
  }
};

// POST /api/mail/webhook (No auth required)
const { Webhook } = require("svix");

module.exports.handleResendWebhook = async (req, res, next) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return new ApiResponse(null, "Webhook ignored: secret not configured.").send(res, 200);
  }

  const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  const headers = req.headers;
  const wh = new Webhook(secret);

  let evt;
  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    return next(new AppError(400, "Webhook signature verification failed."));
  }

  const { type, data } = evt;
  if (data && data.email_id) {
    let statusUpdate;
    if (type === 'email.sent') statusUpdate = 'sent';
    else if (type === 'email.delivered') statusUpdate = 'delivered';
    else if (type === 'email.bounced') statusUpdate = 'bounced';
    else if (type === 'email.complained') statusUpdate = 'complained';
    else if (type === 'email.delivery_delayed') statusUpdate = 'queued';

    if (statusUpdate) {
      await MailLog.updateOne(
        { resendEmailId: data.email_id },
        { $set: { status: statusUpdate, updatedAt: new Date() } }
      );
    }
  }

  return new ApiResponse(null).send(res, 200);
};

// POST /api/mail/send-batch
const sendBatchSchema = z.array(
  z.object({
    to: z.union([z.string(), z.array(z.string())]),
    subject: z.string().min(1, "Subject is required"),
    html: z.string().optional(),
    text: z.string().optional()
  })
).min(1).max(100);

module.exports.sendBatchMail = async (req, res, next) => {
  const reservedKeys = [];
  try {
    if (req.keyRole !== "secret") {
      return next(new AppError(403, "Forbidden. This action requires a Secret Key (sk_live_...)."));
    }

    const batch = sendBatchSchema.parse(req.body);
    const projectId = req.project?._id;
    if (!projectId) {
      return next(new AppError(401, "Project context missing."));
    }

    const { resend, usingByok, fromAddress } = await resolveResendClient(req);
    const limit = getMonthlyMailLimit(req.project, req.planLimits);

    for (let i = 0; i < batch.length; i++) {
      const { key } = await reserveMonthlyMailSlot(projectId, limit);
      reservedKeys.push(key);
    }

    const resendPayloads = batch.map(item => ({
      from: fromAddress,
      to: Array.isArray(item.to) ? item.to : [item.to],
      subject: item.subject,
      ...(item.html ? { html: item.html } : {}),
      ...(item.text ? { text: item.text } : {})
    }));

    const { data, error } = await resend.batch.send(resendPayloads);
    if (error) {
      for (const k of reservedKeys) {
        await redis.decr(k).catch(() => {});
      }
      return next(new AppError(error.statusCode || 500, error.message || "Batch send failed."));
    }

    const results = data?.data || data || [];
    const logDocs = results.map((resObj, idx) => {
      const original = resendPayloads[idx] || {};
      return {
        projectId,
        resendEmailId: resObj?.id || null,
        to: original.to || [],
        subject: original.subject || '',
        status: 'sent',
        usingByok,
        sentAt: new Date()
      };
    });

    if (logDocs.length > 0) {
      await MailLog.insertMany(logDocs).catch(e => console.error("Batch log insertion error:", e));
    }

    return new ApiResponse(results, `Successfully dispatched batch of ${results.length} emails.`).send(res, 200);
  } catch (err) {
    for (const k of reservedKeys) {
      await redis.decr(k).catch(() => {});
    }

    if (err instanceof z.ZodError) {
      return next(new AppError(400, err.issues?.[0]?.message || "Invalid batch mail payload.", "Validation Error"));
    }

    const appErr = new AppError(err.statusCode || 500, err.message || "Failed to send batch mail.");
    if (typeof err.limit === "number") appErr.limit = err.limit;
    return next(appErr);
  }
};

// --- AUDIENCES (BYOK Gate) ---

module.exports.createAudience = async (req, res, next) => {
  try {
    const resend = await requireByokGate(req);
    const { name } = req.body;
    if (!name) return next(new AppError(400, "Audience name is required."));

    const { data, error } = await resend.audiences.create({ name });
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.getAudiences = async (req, res, next) => {
  try {
    const resend = await requireByokGate(req);
    const { data, error } = await resend.audiences.list();
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.getAudienceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      return next(new AppError(400, "Invalid audience ID format."));
    }
    const resend = await requireByokGate(req);
    const { data, error } = await resend.audiences.get(id);
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.deleteAudience = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      return next(new AppError(400, "Invalid audience ID format."));
    }
    const resend = await requireByokGate(req);
    const { data, error } = await resend.audiences.remove(id);
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

// --- CONTACTS (BYOK Gate) ---

module.exports.addContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      return next(new AppError(400, "Invalid audience ID format."));
    }
    const resend = await requireByokGate(req);
    const { email, firstName, lastName, unsubscribed } = req.body;
    if (!email) return next(new AppError(400, "Contact email is required."));

    const payload = { audienceId: id, email };
    if (firstName) payload.firstName = firstName;
    if (lastName) payload.lastName = lastName;
    if (unsubscribed !== undefined) payload.unsubscribed = unsubscribed;

    const { data, error } = await resend.contacts.create(payload);
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.getContacts = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      return next(new AppError(400, "Invalid audience ID format."));
    }
    const resend = await requireByokGate(req);
    const { data, error } = await resend.contacts.list({ audienceId: id });
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.getContactById = async (req, res, next) => {
  try {
    const { id, contactId } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id) || !/^[A-Za-z0-9_-]+$/.test(contactId)) {
      return next(new AppError(400, "Invalid audience or contact ID format."));
    }
    const resend = await requireByokGate(req);
    const { data, error } = await resend.contacts.get({ audienceId: id, id: contactId });
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.updateContact = async (req, res, next) => {
  try {
    const { id, contactId } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id) || !/^[A-Za-z0-9_-]+$/.test(contactId)) {
      return next(new AppError(400, "Invalid audience or contact ID format."));
    }
    const resend = await requireByokGate(req);
    const { firstName, lastName, unsubscribed } = req.body;

    const payload = { audienceId: id, id: contactId };
    if (firstName !== undefined) payload.firstName = firstName;
    if (lastName !== undefined) payload.lastName = lastName;
    if (unsubscribed !== undefined) payload.unsubscribed = unsubscribed;

    const { data, error } = await resend.contacts.update(payload);
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.deleteContact = async (req, res, next) => {
  try {
    const { id, contactId } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id) || !/^[A-Za-z0-9_-]+$/.test(contactId)) {
      return next(new AppError(400, "Invalid audience or contact ID format."));
    }
    const resend = await requireByokGate(req);
    const { data, error } = await resend.contacts.remove({ audienceId: id, id: contactId });
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

// --- BROADCASTS (BYOK + Pro Gate) ---

const requireBroadcastGate = async (req) => {
  const { resend, usingByok } = await resolveResendClient(req);
  if (!usingByok || !req.planLimits?.byokEnabled) {
    const err = new Error("Broadcasts require both a BYOK Resend key and a Pro plan.");
    err.statusCode = 403;
    throw err;
  }
  return resend;
};

module.exports.createBroadcast = async (req, res, next) => {
  try {
    const resend = await requireBroadcastGate(req);
    const { audienceId, segmentId, from, subject, html, scheduledAt } = req.body;
    const resolvedAudienceId = audienceId || segmentId;
    if (!resolvedAudienceId || !subject || !html) {
      return next(new AppError(400, "audienceId, subject, and html are required."));
    }

    const payload = {
      audienceId: resolvedAudienceId,
      from: from || process.env.EMAIL_FROM || "urBackend <urbackend@apps.bitbros.in>",
      subject,
      html
    };
    if (scheduledAt) payload.scheduledAt = scheduledAt;

    const { data, error } = await resend.broadcasts.create(payload);
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.sendBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      return next(new AppError(400, "Invalid broadcast ID format."));
    }
    const resend = await requireBroadcastGate(req);
    const { data, error } = await resend.broadcasts.send(id);
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.getBroadcasts = async (req, res, next) => {
  try {
    const resend = await requireBroadcastGate(req);
    const { data, error } = await resend.broadcasts.list();
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.getBroadcastById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      return next(new AppError(400, "Invalid broadcast ID format."));
    }
    const resend = await requireBroadcastGate(req);
    const { data, error } = await resend.broadcasts.get(id);
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};

module.exports.deleteBroadcast = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      return next(new AppError(400, "Invalid broadcast ID format."));
    }
    const resend = await requireBroadcastGate(req);
    const { data, error } = await resend.broadcasts.remove(id);
    if (error) return next(new AppError(error.statusCode || 500, error.message));

    return new ApiResponse(data).send(res, 200);
  } catch (err) {
    return next(new AppError(err.statusCode || 500, err.message));
  }
};
