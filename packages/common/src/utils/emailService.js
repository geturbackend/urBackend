const { Resend } = require('resend');
const { marked } = require('marked');

const dotenv = require('dotenv');

dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY_2 || process.env.RESEND_API_KEY || 're_dummy_key_for_testing');

const FALLBACK_FROM_ADDRESS = 'urBackend <urbackend@apps.bitbros.in>';

const formatFromAddress = (email_address) => {
    const trimmed = email_address?.trim();
    if (!trimmed) {
        return FALLBACK_FROM_ADDRESS;
    }

    // If the address already includes a custom name format (e.g., "Name <email@domain.com>")
    if (trimmed.includes('<') && trimmed.endsWith('>')) {
        return trimmed;
    }

    return `urBackend <${trimmed}>`;
};
 
const defaultFromAddress = formatFromAddress(process.env.EMAIL_FROM);
const replyToAddress = process.env.EMAIL_REPLY_TO?.trim() || "urbackend@apps.bitbros.in";

async function sendOtp(email, otp, { subject = "Verify your urBackend account", customContent = null } = {}) {
    try {
        const htmlContent = customContent || `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #111111; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                    .logo { margin-bottom: 32px; font-weight: 800; font-size: 24px; letter-spacing: -0.03em; color: #111; }
                    h1 { font-size: 24px; font-weight: 700; line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.02em; }
                    .content { font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 32px; }
                    .otp-box { display: inline-block; padding: 12px 24px; background: #f4f4f5; border: 1px solid #e4e4e7; color: #111; border-radius: 8px; font-size: 28px; font-weight: 700; letter-spacing: 4px; margin-bottom: 32px; font-family: monospace; }
                    .footer { margin-top: 64px; padding-top: 32px; border-top: 1px solid #eeeeee; font-size: 13px; color: #888888; }
                    .footer p { margin: 4px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">urBackend</div>
                    <h1>Verify your account</h1>
                    <div class="content">
                        Use the following code to complete your verification process. This code will expire in 5 minutes.
                    </div>
                    <div class="otp-box">${otp}</div>
                    <div class="content">
                        If you didn't request this code, you can safely ignore this email.
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} urBackend Inc. • Developer platform.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const { data, error } = await resend.emails.send({
            from: defaultFromAddress,
            to: email,
            subject: subject,
            html: htmlContent,
            replyTo: replyToAddress,
        });

        if (error) {
            console.error("[Resend Error]", error);
            throw new Error(error.message || "Failed to send email");
        }
        return { data };
    } catch (error) {
        console.error("[Email Service Error]", error);
        throw error;
    }
}

const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

async function sendReleaseEmail(email, { version, title, content, changelogUrl }) {
    const sVersion = escapeHtml(version);
    const sTitle = escapeHtml(title);
    const fallbackUrl = 'https://urbackend.bitbros.in/releases';
    const ctaUrl = typeof changelogUrl === 'string' && /^https?:\/\//i.test(changelogUrl)
        ? changelogUrl
        : fallbackUrl;
    const safeCtaUrl = escapeHtml(ctaUrl);
    
    // Convert markdown content to HTML using marked
    const sContentHtml = marked.parse(content);

    try {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #111111; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                    .logo { margin-bottom: 32px; font-weight: 800; font-size: 24px; letter-spacing: -0.03em; color: #111; }
                    .badge { display: inline-block; padding: 4px 10px; background: #6366f1; color: white; border-radius: 6px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
                    h1 { font-size: 32px; font-weight: 700; line-height: 1.2; margin-bottom: 24px; letter-spacing: -0.02em; }
                    .content { font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 32px; }
                    .content h1, .content h2, .content h3 { color: #111; margin-top: 24px; margin-bottom: 12px; }
                    .content p { margin-top: 0; margin-bottom: 16px; }
                    .content ul { padding-left: 20px; margin-bottom: 16px; }
                    .content li { margin-bottom: 8px; }
                    .cta { display: inline-block; background-color: #111111; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px; transition: background 0.2s; }
                    .footer { margin-top: 64px; padding-top: 32px; border-top: 1px solid #eeeeee; font-size: 13px; color: #888888; }
                    .footer p { margin: 4px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">urBackend</div>
                    <div class="badge">New Release ${sVersion}</div>
                    <h1>${sTitle}</h1>
                    <div class="content">${sContentHtml}</div>
                    <a href="${safeCtaUrl}" class="cta">Read the full changelog</a>
                    <div class="footer">
                        <p>You're receiving this because you're a registered developer on urBackend.</p>
                        <p>© ${new Date().getFullYear()} urBackend Inc. • Built with passion for developers.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const { data, error } = await resend.emails.send({
            from: defaultFromAddress,
            to: email,
            subject: `Release: ${version} - ${title}`,
            html: htmlContent,
            replyTo: replyToAddress,
        });

        if (error) {
            console.error("[Resend Error]", error);
            throw new Error(error.message || "Failed to send release email");
        }
        return { data };
    } catch (error) {
        console.error("[Release Email Error]", error);
        throw error;
    }
}

    // FUNCTION - SEND AUTH OTP EMAIL
async function sendAuthOtpEmail(email, { otp, type, pname, byokKey, byokFrom }) {
    const rawPname = pname || "urBackend";

    let safeEmailHandle = rawPname.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (safeEmailHandle.length < 3) {
        safeEmailHandle = "urbackend";
    }
    safeEmailHandle = safeEmailHandle.substring(0, 30);

    const safeProjectNameHtml = escapeHtml(rawPname);

    const safeDisplayName = rawPname.replace(/[\r\n]/g, '').trim();
    const finalDisplayName = /^[a-zA-Z0-9 ]+$/.test(safeDisplayName) 
        ? safeDisplayName 
        : `"${safeDisplayName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    
    const isVerify = type === 'verification';
    const subject = isVerify ? "Verify your account" : "Reset your password";
    const header = isVerify ? "Verify your email address" : "Reset your password";
    const desc = isVerify 
        ? "Use the following code to complete your verification process." 
        : "Use the following code to reset your password.";

    try {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #111111; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                    .logo { margin-bottom: 32px; font-weight: 800; font-size: 24px; letter-spacing: -0.03em; color: #111; }
                    h1 { font-size: 24px; font-weight: 700; line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.02em; }
                    .content { font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 32px; }
                    .otp-box { display: inline-block; padding: 12px 24px; background: #f4f4f5; border: 1px solid #e4e4e7; color: #111; border-radius: 8px; font-size: 28px; font-weight: 700; letter-spacing: 4px; margin-bottom: 32px; font-family: monospace; }
                    .footer { margin-top: 64px; padding-top: 32px; border-top: 1px solid #eeeeee; font-size: 13px; color: #888888; }
                    .footer p { margin: 4px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">${safeProjectNameHtml}</div>
                    <h1>${header}</h1>
                    <div class="content">
                        ${desc} This code will expire in 5 minutes.
                    </div>
                    <div class="otp-box">${otp}</div>
                    <div class="content">
                        If you didn't request this code, you can safely ignore this email.
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} urBackend Inc. • Developer platform.</p>
                    </div>
                </div>
            </body>
            </html>
        `;



        let mailClient = resend;
        let fromAddress = process.env.EMAIL_FROM
            ? formatFromAddress(process.env.EMAIL_FROM)
            : `${finalDisplayName} <${safeEmailHandle}.urbackend@apps.bitbros.in>`;

        if (byokKey) {
            mailClient = new Resend(byokKey);
            fromAddress = byokFrom
                ? formatFromAddress(byokFrom)
                : process.env.EMAIL_FROM
                    ? formatFromAddress(process.env.EMAIL_FROM)
                    : "onboarding@resend.dev";
        }

        const { data, error } = await mailClient.emails.send({
            from: fromAddress,
            to: email,
            subject: subject,
            html: htmlContent,
            replyTo: replyToAddress,
        });

        if (error) {
            console.error("[Resend Error]", error);
            throw new Error(error.message || "Failed to send email");
        }
        return { data };
    } catch (error) {
        console.error("[Auth Queue Email Service Error]", error);
        throw error;
    }
}

async function sendProRequestConfirmationEmail(email) {
    try {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #111111; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                    .logo { margin-bottom: 32px; font-weight: 800; font-size: 24px; letter-spacing: -0.03em; color: #111; }
                    h1 { font-size: 24px; font-weight: 700; line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.02em; }
                    .content { font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 32px; }
                    .footer { margin-top: 64px; padding-top: 32px; border-top: 1px solid #eeeeee; font-size: 13px; color: #888888; }
                    .footer p { margin: 4px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">urBackend</div>
                    <h1>Pro Access Requested! ⚡</h1>
                    <div class="content">
                        Thanks for your interest in urBackend Pro. We've received your request and our team will review it shortly. 
                        Once approved, you'll receive an email and your account will be upgraded automatically.
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} urBackend Inc. • Developer platform.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const { data, error } = await resend.emails.send({
            from: defaultFromAddress,
            to: email,
            subject: "Pro Access Requested - urBackend ⚡",
            html: htmlContent,
            replyTo: replyToAddress,
        });

        if (error) {
            console.error("[Resend Error - Pro Request]", error);
            throw new Error(error.message || "Failed to send email");
        }
        return { data };
    } catch (error) {
        console.error("[Email Service Error - Pro Request]", error);
        throw error;
    }
}

async function sendExportReadyEmail({ to, downloadUrl, projectName }) {
    try {
        const safeProjectName = escapeHtml(projectName || 'your project');
        const safeDownloadUrl = escapeHtml(downloadUrl);
        const subject = `Export Ready: ${projectName}`;
        const textBody = `Hello,

Your requested database export for the project "${projectName}" is ready.

You can download your JSON export using the following secure link (valid for 24 hours):
${downloadUrl}

Thanks,
urBackend Team`;
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #111111; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                    .logo { margin-bottom: 32px; font-weight: 800; font-size: 24px; letter-spacing: -0.03em; color: #111; }
                    .badge { display: inline-block; padding: 4px 10px; background: #111111; color: #ffffff; border-radius: 6px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
                    h1 { font-size: 28px; font-weight: 700; line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.02em; }
                    .content { font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 24px; }
                    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
                    .label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 8px; }
                    .link { display: block; word-break: break-all; color: #111111; font-size: 14px; line-height: 1.6; }
                    .cta { display: inline-block; background-color: #111111; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px; margin-bottom: 24px; }
                    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #eeeeee; font-size: 13px; color: #888888; }
                    .footer p { margin: 4px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">urBackend</div>
                    <div class="badge">Export Ready</div>
                    <h1>Your export is ready</h1>
                    <div class="content">
                        The database export for <strong>${safeProjectName}</strong> has finished successfully.
                    </div>
                    <div class="card">
                        <div class="label">Download link</div>
                        <a class="link" href="${safeDownloadUrl}">${safeDownloadUrl}</a>
                    </div>
                    <a href="${safeDownloadUrl}" class="cta">Download export</a>
                    <div class="content">
                        This link will expire in 24 hours. If you did not request this export, you can safely ignore this email.
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} urBackend Inc. • Developer platform.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const { data, error } = await resend.emails.send({
            from: '"urBackend" <onboarding@resend.dev>',
            to: to,
            subject: subject,
            text: textBody,
            html: htmlContent,
            replyTo: 'urbackend@apps.bitbros.in',
        });

        if (error) {
            console.error("[Resend Error - Export Ready]", error);
            throw new Error(error.message || "Failed to send export ready email");
        }
        return { data };
    } catch (error) {
        console.error("[Email Service Error - Export Ready]", error);
        throw error;
    }
}

module.exports = { sendOtp, sendReleaseEmail, sendAuthOtpEmail, sendProRequestConfirmationEmail, sendExportReadyEmail };
