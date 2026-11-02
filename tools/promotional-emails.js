const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(
    process.env.RESEND_API_KEY_2 ||
    process.env.RESEND_API_KEY
);

const BATCH_SIZE = 50;
const DELAY_MS = 1200; // slight buffer over 1s for rate limit safety

async function sendEmail(email) {
    return resend.emails.send({ 
        from: process.env.EMAIL_FROM || 'Yash from urBackend <yash@urbackend.in>',
        to: email,
        replyTo: process.env.EMAIL_REPLY_TO || 'yash@urbackend.in', 
        subject: "your next backend project",
        text: `Hey,

You're a developer — so you've probably wasted a weekend just setting up 
auth, databases, and file storage for a project that should've taken 1 day.

I built urBackend to fix that. Open-source backend platform — bring your 
own MongoDB, get auth, APIs, storage, and more ready in minutes. 
Your data never touches our servers.

Free to self-host:
https://urbackend.bitbros.in

— Yash
Founder, urBackend

(Not relevant? Just ignore this.)`
        });
}

const redactEmail = (value) => {
    const [local, domain] = String(value).split('@');
    if (!domain) return '***';
    return `${local?.slice(0, 2) || '**'}***@${domain}`;
};

async function main() {
    const filePath = path.join(__dirname, 'emails.txt');

    if (!fs.existsSync(filePath)) {
        console.error('emails.txt not found');
        process.exit(1);
    }

    const emails = fs
        .readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .map(e => e.trim())
        .filter(Boolean);

    const parsed = Number(process.argv[2]);
    const batchSize = Number.isInteger(parsed) && parsed > 0 ? parsed : BATCH_SIZE;
    const batch = emails.slice(0, Math.min(batchSize, emails.length));

    console.log(`Sending to ${batch.length} of ${emails.length} emails...`);

    let sent = 0, failed = 0;

    for (const email of batch) {
        try {
            await sendEmail(email);
            sent++;
            console.log(`✓ ${redactEmail(email)}`);
        } catch (err) {
            failed++;
            console.error(`✗ ${redactEmail(email)} — ${err.message}`);
        } finally {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    console.log(`\n--- Done ---`);
    console.log(`✓ Sent: ${sent}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`Total: ${sent + failed}`);
}

main();