const { Resend } = require('resend');

const dotenv = require('dotenv');

dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_testing');

async function sendOtp(email, otp, { subject = "Verify your urBackend account" } = {}) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'urBackend <urbackend@bitbros.in>',
            to: email,
            subject: subject,
            html: `
            <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
                <div style="max-width:500px; margin:auto; background:white; border-radius:10px; padding:30px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                    
                    <h2 style="margin-bottom:10px; color:#222;">
                        Verify your account
                    </h2>

                    <p style="color:#555; font-size:14px;">
                        Welcome to <strong>urBackend</strong>. Use the OTP below to complete your verification.
                    </p>

                    <div style="margin:25px 0;">
                        <span style="
                            display:inline-block;
                            font-size:28px;
                            letter-spacing:6px;
                            font-weight:bold;
                            background:#f1f3f5;
                            padding:12px 20px;
                            border-radius:8px;
                            color:#111;
                        ">
                            ${otp}
                        </span>
                    </div>

                    <p style="font-size:13px; color:#777;">
                        This OTP is valid for 5 minutes. Do not share it with anyone.
                    </p>

                    <hr style="margin:25px 0; border:none; border-top:1px solid #eee;" />

                    <p style="font-size:12px; color:#999;">
                        If you didn’t request this, you can safely ignore this email.
                    </p>

                    <p style="font-size:12px; color:#bbb; margin-top:20px;">
                        © ${new Date().getFullYear()} urBackend
                    </p>
                </div>
            </div>
            `,
            replyTo: 'urbackend@bitbros.in',
        });

        console.log(data);
        console.log(error);
    } catch (error) {
        console.log(error);
    }
}

module.exports = sendOtp;