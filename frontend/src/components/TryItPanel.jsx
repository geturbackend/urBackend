import { useState } from "react";

export default function TryItPanel({ endpoint, method = "POST" }) {
  const [apiKey, setApiKey] = useState("");
  const [jsonBody, setJsonBody] = useState(`{}`);
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [params, setParams] = useState({});

  function buildEndpoint() {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
}


  async function sendRequest() {
    //  Stop if API key is missing
    if (!apiKey || apiKey.trim() === "") {
      setError("You need an API key. Go to Dashboard → Create Project → Copy API key.");
      return;
    }

    // Clear previous error
    setError("");

    try {
      const res = await fetch(`https://api.urbackend.bitbros.in${buildEndpoint()}`, {



        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: method !== "GET" ? jsonBody : null,
      });

      const data = await res.text();
      setStatus(res.status);
      setResponse(data);
    } catch (err) {
      setResponse(err.message);
    }
  }

  return (
  <div className="card" style={{ marginTop: "1.5rem" }}>
    <h4 style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "var(--color-text-muted)" }}>
      Try It Out
    </h4>

    <div style={{ marginBottom: "1rem" }}>
      <label className="form-label">x-api-key</label>
      <input
        className="input-field"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="YOUR API KEY"
      />
    </div>
{endpoint.includes(":") && (
  <div style={{ marginBottom: "1rem" }}>
    <label className="form-label">Path Parameters</label>

    {endpoint
      .match(/:([a-zA-Z0-9_]+)/g)
      ?.map(p => {
        const key = p.replace(":", "");
        return (
          <input
            key={key}
            className="input-field"
            placeholder={key}
            value={params[key] || ""}
            onChange={e => setParams({ ...params, [key]: e.target.value })}
            style={{ marginBottom: "0.5rem" }}
          />
        );
      })}
  </div>
)}

    {method !== "GET" && (
      <div style={{ marginBottom: "1rem" }}>
        <label className="form-label">Request Body</label>
        <textarea
          className="input-field"
          style={{ minHeight: "120px", fontFamily: "monospace" }}
          value={jsonBody}
          onChange={(e) => setJsonBody(e.target.value)}
        />
      </div>
    )}

    {error && (
      <div style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.4)",
        padding: "0.75rem",
        borderRadius: "6px",
        color: "#f87171",
        marginBottom: "1rem",
        fontSize: "0.85rem"
      }}>
        {error}
      </div>
    )}

    <button onClick={sendRequest} className="btn btn-primary">
      Send Request
    </button>

    {response && (
      <div style={{ marginTop: "1rem" }}>
        <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
          Status: {status}
        </div>
        <pre style={{
          background: "#0b0b0b",
          border: "1px solid #222",
          borderRadius: "6px",
          padding: "1rem",
          color: "var(--color-primary)",
          fontSize: "0.8rem",
          overflowX: "auto"
        }}>
          {response}
        </pre>
      </div>
    )}
  </div>
);

}
