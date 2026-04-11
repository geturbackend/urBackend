# urBackend Webhooks Guide

Webhooks allow you to build event-driven applications by letting urBackend notify your custom external servers (like Next.js API routes, AWS Lambda, or Discord via Zapier) the absolute second data is added, updated, or removed from your database. 

## Securing Your Webhooks (HMAC Verification)

Webhooks are sent as raw HTTP `POST` requests to a URL you configure. Because your webhook URL is public, anyone could theoretically send data to it. 

To prove that the data came **only from urBackend**, every payload is signed using your project's unique "Signing Secret" (which you can generate or copy from the Webhooks Dashboard).

### How it Works

1. You create a Webhook in the urBackend Dashboard and either copy the auto-generated **Signing Secret** (e.g. `whsec_xyz123...`) or enter your own.
2. When a data event occurs (like a new User signing up), urBackend packages the JSON data and computes an `HMAC-SHA256` signature using your secret.
3. This signature is attached to the outgoing request in the `X-urBackend-Signature` header.
4. Your server receives the request, performs the exact same HMAC math, and accepts the webhook only if the signatures match.

### Code Example (Node.js/Express)

Here is a copy-paste code snippet on how to safely verify an incoming urBackend webhook event.

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// The secret provided by your urBackend Dashboard
const URBACKEND_WEBHOOK_SECRET = process.env.URBACKEND_WEBHOOK_SECRET;

app.post('/urbackend-webhook', express.json(), (req, res) => {
    // 1. Extract the signature header sent by urBackend
    const signature = req.headers['x-urbackend-signature'];
    
    // 2. Convert the raw request body payload to string
    const payload = JSON.stringify(req.body);

    // 3. Compute the expected digest using HMAC-SHA256
    const expectedSignature = crypto
        .createHmac('sha256', URBACKEND_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    // 4. Safely compare the signatures
    if (!signature || signature !== expectedSignature) {
        console.error("⚠️ Webhook verification failed! Potential spoofing attempt.");
        return res.status(401).send("Invalid signature");
    }

    // 5. Success! The event is authentic.
    const { event, collection, payload: data } = req.body;
    
    console.log(`✅ Received authentic ${event} event on ${collection}`);
    console.log("Record ID:", data._id);

    // Always return a 200/20x as fast as possible to prevent timeouts
    res.status(200).send("Webhook received");
});

app.listen(3000, () => console.log('Webhook server running on port 3000'));
```

## Retry Logic

If your server takes too long to respond (timeout exceeding 10 seconds) or returns a `4xx / 5xx` HTTP status code, urBackend will mark the delivery as `failed`. The Webhook Dashboard provides a full "Delivery History" panel so you can inspect the exact payload, replay failed attempts, and debug your endpoint.
