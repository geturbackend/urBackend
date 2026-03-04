const { Resend } = require('resend');

const dotenv = require('dotenv');

dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY_2 || process.env.RESEND_API_KEY || 're_dummy_key_for_testing');

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
            from: 'urBackend <urbackend@apps.bitbros.in>',
            to: email,
            subject: subject,
            html: htmlContent,
            replyTo: 'urbackend@apps.bitbros.in',
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

async function sendReleaseEmail(email, { version, title, content }) {
    const sVersion = escapeHtml(version);
    const sTitle = escapeHtml(title);
    const sContent = escapeHtml(content);

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
                    .content { font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 32px; white-space: pre-wrap; }
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
                    <div class="content">${sContent}</div>
                    <a href="https://urbackend.bitbros.in/releases" class="cta">Read the full changelog</a>
                    <div class="footer">
                        <p>You're receiving this because you're a registered developer on urBackend.</p>
                        <p>© ${new Date().getFullYear()} urBackend Inc. • Built with passion for developers.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const { data, error } = await resend.emails.send({
            from: 'urBackend <urbackend@apps.bitbros.in>',
            to: email,
            subject: `Release: ${version} - ${title}`,
            html: htmlContent,
            replyTo: 'urbackend@apps.bitbros.in',
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

module.exports = { sendOtp, sendReleaseEmail };