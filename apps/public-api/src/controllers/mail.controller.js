const { Resend } = require("resend");
const { z } = require("zod");
const { Project, decrypt, redis, sendMailSchema } = require("@urbackend/common");
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
    .select("+resendApiKey.encrypted +resendApiKey.iv +resendApiKey.tag")
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

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }

  if (count > limit) {
    await redis.decr(key);
    const err = new Error("Monthly mail limit exceeded.");
    err.statusCode = 429;
    err.limit = limit;
    throw err;
  }

  return { count, key };
};

module.exports.sendMail = async (req, res) => {
  try {
    if (req.keyRole !== "secret") {
      return res.status(403).json({
        error: "Forbidden. This action requires a Secret Key (sk_live_...).",
      });
    }

    const { to, subject, html, text } = sendMailSchema.parse(req.body || {});
    const projectId = req.project?._id;

    if (!projectId) {
      return res.status(401).json({ error: "Project context missing." });
    }

    const limit = getMonthlyMailLimit(req.project);
    const { count } = await reserveMonthlyMailSlot(projectId, limit);

    const project = await loadProjectMailConfig(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    const decryptedByokKey = decrypt(project.resendApiKey);
    const usingByok = typeof decryptedByokKey === "string" && decryptedByokKey.trim().length > 0;
    const clientKey = usingByok
      ? decryptedByokKey.trim()
      : process.env.RESEND_API_KEY_2 || process.env.RESEND_API_KEY;

    if (!clientKey) {
      return res.status(500).json({ error: "Resend API key is not configured." });
    }

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
      subject,
    };
    if (typeof html === "string" && html.trim()) payload.html = html;
    if (typeof text === "string" && text.trim()) payload.text = text;

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
      },
      message: "Mail sent successfully.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: err.issues?.[0]?.message || "Invalid mail payload.",
      });
    }

    return res.status(err.statusCode || 500).json({
      error: err.message || "Failed to send mail.",
      ...(typeof err.limit === "number" ? { limit: err.limit } : {}),
    });
  }
};
