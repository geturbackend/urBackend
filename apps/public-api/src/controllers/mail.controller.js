const { Resend } = require("resend");
const { z } = require("zod");
const { Project, MailTemplate, decrypt, redis, sendMailSchema } = require("@urbackend/common");
const {
  getMonthKey,
  getEndOfMonthTtlSeconds,
  getMonthlyMailLimit,
} = require("../utils/mailLimit");

const DEFAULT_FROM = process.env.EMAIL_FROM || "urBackend <urbackend@apps.bitbros.in>";

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

module.exports.sendMail = async (req, res) => {
  let consumedQuotaKey = null;
  try {
    if (req.keyRole !== "secret") {
      return res.status(403).json({
        success: false,
        data: {},
        message: "Forbidden. This action requires a Secret Key (sk_live_...).",
      });
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
      return res.status(401).json({ success: false, data: {}, message: "Project context missing." });
    }

    const project = await loadProjectMailConfig(projectId);
    if (!project) {
      return res.status(404).json({ success: false, data: {}, message: "Project not found." });
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
        return res.status(404).json({ success: false, data: {}, message: "Mail template not found." });
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
      return res.status(400).json({ success: false, data: {}, message: "Subject is required." });
    }

    const hasBody =
      (typeof resolvedHtml === "string" && resolvedHtml.trim().length > 0) ||
      (typeof resolvedText === "string" && resolvedText.trim().length > 0);
    if (!hasBody) {
      return res.status(400).json({ success: false, data: {}, message: "Provide at least one of html or text content." });
    }

    resolvedSubject = renderTemplateString(resolvedSubject, vars, { mode: "text" });
    if (typeof resolvedHtml === "string" && resolvedHtml.trim()) {
      resolvedHtml = renderTemplateString(resolvedHtml, vars, { mode: "html" });
    }
    if (typeof resolvedText === "string" && resolvedText.trim()) {
      resolvedText = renderTemplateString(resolvedText, vars, { mode: "text" });
    }

    if (!resolvedSubject || !resolvedSubject.trim()) {
      return res.status(400).json({ success: false, data: {}, message: "Subject is required." });
    }

    const hasRenderedBody =
      (typeof resolvedHtml === "string" && resolvedHtml.trim().length > 0) ||
      (typeof resolvedText === "string" && resolvedText.trim().length > 0);
    if (!hasRenderedBody) {
      return res.status(400).json({ success: false, data: {}, message: "Provide at least one of html or text content." });
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
      return res.status(500).json({ success: false, data: {}, message: "Resend API key is not configured." });
    }

    const limit = getMonthlyMailLimit(req.project);
    const { count, key } = await reserveMonthlyMailSlot(projectId, limit);
    consumedQuotaKey = key;

    const resend = new Resend(clientKey);
    
    let fromAddress = DEFAULT_FROM;
    if (usingByok) {
      fromAddress = project.resendFromEmail && project.resendFromEmail.trim() 
        ? project.resendFromEmail.trim() 
        : "onboarding@resend.dev";
    }

    const payload = {
      from: fromAddress,
      to,
      subject: resolvedSubject,
    };
    if (typeof resolvedHtml === "string" && resolvedHtml.trim()) payload.html = resolvedHtml;
    if (typeof resolvedText === "string" && resolvedText.trim()) payload.text = resolvedText;

    const { data, error } = await resend.emails.send(payload);
    if (error) {
      throw new Error(error.message || "Failed to send mail.");
    }

    return res.status(200).json({
      success: true,
      data: {
        id: data?.id || null,
        provider: usingByok ? "byok" : "default",
        monthlyUsage: count,
        monthlyLimit: limit,
        ...(templateUsed ? { templateUsed } : {}),
      },
      message: "Mail sent successfully.",
    });
  } catch (err) {
    if (consumedQuotaKey) {
      await redis.decr(consumedQuotaKey).catch(() => {});
    }

    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        data: {},
        message: err.issues?.[0]?.message || "Invalid mail payload.",
      });
    }

    return res.status(err.statusCode || 500).json({
      success: false,
      data: {},
      message: err.message || "Failed to send mail.",
      ...(typeof err.limit === "number" ? { limit: err.limit } : {}),
    });
  }
};
