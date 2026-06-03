const https = require("https");

// Fail fast if GROQ_API_KEY is not set
if (!process.env.GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY environment variable is not set.");
  process.exit(1);
}

const prSummary = process.argv[2] || "No PRs merged this week.";
const prCount = process.argv[3] || "0";

const TODAY = new Date().toISOString().slice(0, 10);
const WEEK_START = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

const prompt = `You are a technical writer for urBackend, an open-source Backend-as-a-Service platform (auth, database, storage, mail, webhooks, RLS).

Based on the following merged pull requests from the last 7 days, write a Mintlify changelog <Update> entry.

Merged PRs (${prCount} total):
${prSummary}

Output ONLY the raw <Update> MDX block — no explanation, no markdown fences.
Use this exact format (matching the existing changelog style):

<Update label="${TODAY}" description="Week of ${WEEK_START}–${TODAY}" tags={["Feature", "Improvement", "Fix"]}>
## New features

**Feature name** — User-facing description.

## Improvements

**Improvement name** — Description.

## Bug fixes

- Fix description (#PR_NUMBER)
</Update>

Rules:
- Only include sections (## New features / ## Improvements / ## Bug fixes) that have actual content.
- Adjust the tags array to only include applicable tags from: "Feature", "Improvement", "Fix", "Security".
- Write for developers using the platform, not the internal team.
- Be concise and factual. Do not invent features not evidenced by the PRs.
- If no PRs were merged, output: <Update label="${TODAY}" description="Week of ${WEEK_START}–${TODAY}" tags={[]}>No significant changes this week.</Update>`;

const payload = JSON.stringify({
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 10000,
  temperature: 0.3,
});

const options = {
  hostname: "api.groq.com",
  path: "/openai/v1/chat/completions",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Length": Buffer.byteLength(payload),
  },
};

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const response = JSON.parse(data);

      if (response.error) {
        console.error("Groq API error:", response.error.message);
        process.exit(1);
      }

      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        console.error("No content in response:", JSON.stringify(response));
        process.exit(1);
      }

      process.stdout.write(content.trim());
    } catch (err) {
      console.error("Failed to parse response:", err.message);
      console.error("Raw response:", data);
      process.exit(1);
    }
  });
});

// Prevent workflow from hanging indefinitely
req.setTimeout(30000, () => {
  console.error("Error: Groq API request timed out after 30 seconds.");
  req.destroy();
  process.exit(1);
});

req.on("error", (err) => {
  console.error("Request failed:", err.message);
  process.exit(1);
});

req.write(payload);
req.end();
