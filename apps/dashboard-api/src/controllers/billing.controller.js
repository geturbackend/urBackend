const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Developer, AppError } = require('@urbackend/common');

const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new AppError(503, 'Billing is not configured yet. Please contact support.');
    }

    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

/**
 * Creates a Razorpay subscription session for the authenticated developer.
 * POST /api/billing/checkout
 * Returns a `subscriptionUrl` that the frontend redirects to.
 */
module.exports.createCheckout = async (req, res, next) => {
    try {
        const planId = process.env.RAZORPAY_PLAN_ID;
        if (!planId) {
            return next(new AppError(503, 'Billing plan is not configured yet. Please contact support.'));
        }

        const developer = await Developer.findById(req.user._id).select('email plan');
        if (!developer) return next(new AppError(404, 'Developer not found'));

        if (developer.plan === 'pro') {
            return next(new AppError(400, 'You are already on the Pro plan.'));
        }

        const razorpay = getRazorpayInstance();

        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            quantity: 1,
            total_count: 120,   // Max 10 years of monthly billing
            notes: {
                developer_id: developer._id.toString(),
                email: developer.email,
            },
        });

        res.json({
            success: true,
            data: { 
                subscriptionId: subscription.id,
                keyId: process.env.RAZORPAY_KEY_ID
            },
            message: ''
        });
    } catch (err) {
        if (err instanceof AppError) return next(err);
        console.error('Razorpay checkout error:', err);
        return next(new AppError(502, 'Failed to create checkout session. Please try again.'));
    }
};

/**
 * Handles Razorpay webhook events.
 * POST /api/billing/webhook
 *
 * Supported events:
 *   - subscription.activated   → upgrade to pro
 *   - subscription.charged     → renew planExpiresAt
 *   - subscription.cancelled   → no action (auto-degrade on expiry)
 *   - subscription.completed   → same as cancelled
 */
module.exports.handleWebhook = async (req, res, next) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Validate Razorpay HMAC signature
        if (webhookSecret) {
            const signature = req.headers['x-razorpay-signature'];
            if (!signature) {
                return res.status(401).json({ success: false, message: 'Missing webhook signature.' });
            }

            const rawBody = req.rawBody || JSON.stringify(req.body);
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');

            if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
                return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
            }
        }

        const event = req.body.event;
        const payload = req.body.payload?.subscription?.entity;

        if (!payload) {
            return res.json({ success: true, message: 'No subscription payload. Skipped.' });
        }

        // Extract developer_id from subscription notes
        const developerId = payload.notes?.developer_id;
        if (!developerId || typeof developerId !== 'string') {
            console.warn('Razorpay webhook: no valid developer_id in notes');
            return res.json({ success: true, message: 'No valid developer_id in notes. Skipped.' });
        }

        const developer = await Developer.findById(developerId);
        if (!developer) {
            console.warn(`Razorpay webhook: developer not found for id ${developerId}`);
            return res.json({ success: true, message: 'Developer not found. Skipped.' });
        }

        const now = new Date();

        if (event === 'subscription.activated' || event === 'subscription.charged') {
            // current_end is unix timestamp of next billing date
            const currentEnd = payload.current_end;
            const planExpiresAt = currentEnd
                ? new Date(currentEnd * 1000)
                : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            developer.plan = 'pro';
            developer.planActivatedAt = now;
            developer.planExpiresAt = planExpiresAt;
            await developer.save();

            console.log(`✅ Developer ${developerId} ${event === 'subscription.activated' ? 'upgraded to pro' : 'plan renewed'}. Expires: ${planExpiresAt}`);
        } else if (event === 'subscription.cancelled' || event === 'subscription.completed') {
            // Do NOT downgrade immediately — resolveEffectivePlan handles auto-degrade on expiry
            console.log(`ℹ️ Subscription ${event} for ${developerId}. Will degrade on ${developer.planExpiresAt}`);
        }

        // Always return 200 to acknowledge
        res.json({ success: true, message: 'Webhook processed.' });
    } catch (err) {
        console.error('Billing webhook error:', err);
        // Return 200 to avoid Razorpay retry storms
        res.json({ success: true, message: 'Internal error. Logged.' });
    }
};
