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

Output ONLY the raw <Update> MDX block — no explanation.
Use this exact format (matching the existing changelog style):

<Update label="${TODAY}" description="Week of ${WEEK_START}–${TODAY}" tags={["Feature", "Improvement", "Fix"]}>
## New features

**Feature name** — User-facing description. ([#PR_NUMBER](https://github.com/geturbackend/urBackend/pull/PR_NUMBER) by [@username](https://github.com/username))

## Improvements

**Improvement name** — Description. ([#PR_NUMBER](https://github.com/geturbackend/urBackend/pull/PR_NUMBER) by [@username](https://github.com/username))

## Bug fixes

- Fix description ([#PR_NUMBER](https://github.com/geturbackend/urBackend/pull/PR_NUMBER) by [@username](https://github.com/username))
</Update>

Rules:
1. CRITICAL: Start your response EXACTLY with <Update and end with </Update>. Do NOT wrap your output in markdown code blocks (\`\`\`). Any extra text will break our pipeline.
2. Ignore internal chores, dependency bumps, CI/CD updates, and test-only PRs. Only include changes that directly impact end-users or developers.
3. For every item, include the PR number linked to its URL and the author linked to their GitHub profile.
4. Only include sections (## New features / ## Improvements / ## Bug fixes) that have actual content.
5. Adjust the tags array to only include applicable tags from: "Feature", "Improvement", "Fix", "Security".
6. Write for developers using the platform, not the internal team. Be concise and factual. Do not invent features not evidenced by the PRs.
7. If no PRs were merged (or if all were ignored), output: <Update label="${TODAY}" description="Week of ${WEEK_START}–${TODAY}" tags={[]}>No significant changes this week.</Update>`;

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
