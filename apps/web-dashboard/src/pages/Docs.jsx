import { useState, useEffect } from 'react';
import { Copy, Terminal, Database, Shield, HardDrive, Check, Server, Menu, ChevronDown, AlertCircle, Zap, AlertTriangle, Key, FileJson, BookOpen, Lock } from 'lucide-react';
import { API_URL, PUBLIC_API_URL } from '../config';
import TryItPanel from "../components/TryItPanel.jsx";
import { useOnboarding } from '../context/OnboardingContext';
import Footer from '../components/Layout/Footer';

export default function Docs() {
    const [activeTab, setActiveTab] = useState('intro');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { completeStep } = useOnboarding();

    useEffect(() => {
        completeStep('make_api_call');
    }, [completeStep]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    // Helper Component for Code Blocks
    const CodeBlock = ({ method, url, body, comment }) => {
        const [copied, setCopied] = useState(false);
        const fullUrl = `${PUBLIC_API_URL}${url}`;

        const codeString = `
// ${comment || 'Example Request'}
const response = await fetch('${fullUrl}', {
    method: '${method}',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY'${method !== 'GET' && method !== 'POST' && url === '/api/userAuth/me' ? ',\n        "Authorization": "Bearer USER_TOKEN" ' : ''}
    }${body ? `,
    body: JSON.stringify(${JSON.stringify(body, null, 4).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'")})` : ''}
});

const data = await response.json();
console.log(data);
        `.trim();

        const handleCopy = () => {
            navigator.clipboard.writeText(codeString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        return (
            <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#111', border: '1px solid #333', margin: '1.5rem 0' }}>
                <div style={{ padding: '8px 16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge"
                            style={{
                                backgroundColor: method === 'GET' ? 'rgba(59, 130, 246, 0.2)' : method === 'POST' ? 'rgba(34, 197, 94, 0.2)' : (method === 'DELETE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'),
                                color: method === 'GET' ? '#60a5fa' : method === 'POST' ? '#4ade80' : (method === 'DELETE' ? '#f87171' : '#fbbf24'),
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                            {method}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#ccc', wordBreak: 'break-all' }}>{url}</span>
                    </div>
                    <button onClick={handleCopy} className="btn btn-ghost" style={{ padding: '4px', color: '#888' }}>
                        {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                    </button>
                </div>
                <div style={{ padding: '16px', overflowX: 'auto' }}>
                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#e5e5e5', lineHeight: 1.6 }}>
                        {codeString}
                    </pre>
                </div>
            </div>
        );
    };

    // Helper for Parameters Table
    const ParamTable = ({ params }) => (
        <div style={{ margin: '1rem 0', overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                        <th style={{ padding: '8px', color: '#888' }}>Parameter</th>
                        <th style={{ padding: '8px', color: '#888' }}>Type</th>
                        <th style={{ padding: '8px', color: '#888' }}>Required</th>
                        <th style={{ padding: '8px', color: '#888' }}>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {params.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '8px', fontFamily: 'monospace', color: 'var(--color-primary)' }}>{p.name}</td>
                            <td style={{ padding: '8px', color: '#aaa' }}>{p.type}</td>
                            <td style={{ padding: '8px', color: p.required ? '#ef4444' : '#aaa' }}>{p.required ? 'Yes' : 'No'}</td>
                            <td style={{ padding: '8px', color: '#ddd' }}>{p.desc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Helper for Reference Tables
    const RefTable = ({ headers, rows }) => (
        <div style={{ margin: '1rem 0', overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                        {headers.map((h, i) => <th key={i} style={{ padding: '8px', color: '#888' }}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                            {row.map((cell, j) => (
                                <td key={j} style={{ padding: '8px', color: j === 0 ? 'var(--color-primary)' : '#ddd', fontFamily: j === 0 || j === 2 ? 'monospace' : 'inherit' }}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'intro':
                return (
                    <div className="fade-in">
                        <h2 className="page-title" style={{ marginBottom: '1rem' }}>Introduction</h2>
                        <p style={{ fontSize: '1.1rem', color: '#ddd', marginBottom: '2rem' }}>
                            Bring your own MongoDB. Get a production-ready backend in 60 seconds.
                        </p>
                        
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#409EFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Server size={20} /> Base API URL
                            </h3>
                            <code className="input-field" style={{ fontFamily: 'monospace', color: 'var(--color-primary)', display: 'block', width: '100%', overflowX: 'auto', backgroundColor: '#111', border: '1px solid #333' }}>
                                {PUBLIC_API_URL}
                            </code>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Key size={20} color="#f59e0b" /> API Keys & Security
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            urBackend uses a Dual-Key system to protect your data. You can find these in your Dashboard.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                                <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <BookOpen size={16} /> Publishable Key
                                </h4>
                                <code style={{ color: '#fff', fontSize: '0.85rem' }}>pk_live_...</code>
                                <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '10px' }}>
                                    Safe to use in frontend environments (React, mobile apps). Grants <strong>Read-Only</strong> access to your Database and Storage.
                                </p>
                            </div>
                            <div className="card" style={{ borderLeft: '4px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                                <h4 style={{ color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Shield size={16} /> Secret Key
                                </h4>
                                <code style={{ color: '#fff', fontSize: '0.85rem' }}>sk_live_...</code>
                                <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '10px' }}>
                                    <strong>Full Read/Write Access.</strong> Use this ONLY in server-side code (Node.js, Next.js API Routes). NEVER expose this to clients.
                                </p>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Common Headers</h3>
                        <ParamTable params={[
                            { name: 'x-api-key', type: 'String', required: true, desc: 'Your Project API Key (Publishable or Secret depending on endpoint)' },
                            { name: 'Content-Type', type: 'String', required: true, desc: 'application/json (except for file uploads)' },
                            { name: 'Authorization', type: 'String', required: false, desc: 'Bearer <USER_TOKEN> (Required for protected user routes)' },
                        ]} />
                    </div>
                );

            case 'quick-ref':
                return (
                    <div className="fade-in">
                        <h2 className="page-title" style={{ marginBottom: '1rem' }}>API Quick Reference</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            A high-level overview of all available endpoints in urBackend.
                        </p>

                        <RefTable 
                            headers={['Method', 'Endpoint', 'Description']}
                            rows={[
                                ['POST', '/api/userAuth/signup', 'Register a new user'],
                                ['POST', '/api/userAuth/login', 'Log in and get JWT token'],
                                ['GET', '/api/userAuth/me', 'Get current authenticated user profile'],
                                ['GET', '/api/data/:collectionName', 'Get all documents in a collection'],
                                ['GET', '/api/data/:collectionName/:id', 'Get a single document by ID'],
                                ['POST', '/api/data/:collectionName', 'Insert a new document'],
                                ['PUT', '/api/data/:collectionName/:id', 'Update document by ID ($set logic)'],
                                ['DELETE', '/api/data/:collectionName/:id', 'Delete a document by ID'],
                                ['POST', '/api/storage/upload', 'Upload a file via multipart form'],
                                ['DELETE', '/api/storage/file', 'Delete a file using its storage path']
                            ]}
                        />
                    </div>
                );

            case 'schemas':
                return (
                    <div className="fade-in">
                        <h2 className="page-title">Schema Creation & Types</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            urBackend is powered by a dynamic schema engine. Define data visually, and the API enforces validation automatically.
                        </p>

                        <div className="card" style={{
                            borderLeft: '4px solid var(--color-warning)',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            marginBottom: '2rem',
                            padding: '1rem'
                        }}>
                            <h3 style={{ color: 'var(--color-warning)', fontSize: '1.1rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={18} /> Crucial Auth Schema Requirement
                            </h3>
                            <p style={{ fontSize: '0.9rem', marginBottom: 0, color: 'var(--color-text-main)' }}>
                                Always define your <strong>"users"</strong> collection schema manually <strong>before</strong> enabling Authentication. This ensures any custom user fields (like 'avatar' or 'role') are properly validated during signup.
                            </p>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Supported Data Types</h3>
                        <RefTable 
                            headers={['Type', 'Description', 'Example JSON']}
                            rows={[
                                ['String', 'Alphanumeric text data', '"title": "Hello World"'],
                                ['Number', 'Integers or decimals', '"price": 19.99'],
                                ['Boolean', 'true or false values', '"isActive": true'],
                                ['Date', 'Any valid date or ISO string', '"createdAt": "2024-03-07"'],
                                ['Object', 'Nested JSON structure', '"meta": { "views": 10 }'],
                                ['Array', 'A list of values', '"tags": ["tech", "ai"]'],
                                ['Ref', 'Reference to another document ID', '"author": "642f9..."']
                            ]}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>1. Required Fields</h3>
                                <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                    When a field is toggled as <strong>Required</strong> in the dashboard, any <code>POST</code> or <code>PUT</code> request missing that field is instantly rejected with a <code>400 Bad Request</code>.
                                </p>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>2. References (Ref)</h3>
                                <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                    Link documents between collections (like a Foreign Key). Set type to <code>Ref</code> and specify the target collection. Store the <code>_id</code> in your requests.
                                </p>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>3. Nested Objects</h3>
                                <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                    Create deep JSON hierarchies. Add a field, set type to <code>Object</code>, and define "Sub-fields" inside the dashboard.
                                </p>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem' }}>4. Arrays</h3>
                                <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                    Store lists. Set type to <code>Array</code>, and send a standard JSON array <code>[]</code> in your HTTP body.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'auth':
                return (
                    <div className="fade-in">
                        <h2 className="page-title">Authentication</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            urBackend includes a built-in JWT authentication system for user registration, login, and profile retrieval.
                        </p>

                        <div className="card" style={{
                            borderLeft: '4px solid var(--color-danger)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            marginBottom: '2rem',
                            padding: '1rem'
                        }}>
                            <h3 style={{ color: 'var(--color-danger)', fontSize: '1.1rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={18} /> The 'users' Collection Contract
                            </h3>
                            <p style={{ fontSize: '0.9rem', marginBottom: 0, color: '#e5e5e5' }}>
                                To enable Auth, your project must have a collection named <code>users</code>. It <strong>MUST</strong> contain at least:
                                <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '20px' }}>
                                    <li><code>email</code> (String, Required, Unique)</li>
                                    <li><code>password</code> (String, Required)</li>
                                </ul>
                                You can add custom fields (e.g., <code>username</code>, <code>avatar</code>), and validation will handle them automatically.
                            </p>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>1. Sign Up User</h3>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>Creates a new user, hashes password via BCrypt, and returns a 7-day JWT token.</p>
                        <CodeBlock
                            method="POST"
                            url="/api/userAuth/signup"
                            body={{ email: "dev@example.com", password: "securePassword123", username: "dev_pulse", preferences: { theme: 'dark' } }}
                            comment="Register a new user"
                        />

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>2. Login User</h3>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>Authenticates credentials and returns a JWT token.</p>
                        <CodeBlock
                            method="POST"
                            url="/api/userAuth/login"
                            body={{ email: "dev@example.com", password: "securePassword123" }}
                            comment="Login and receive a JWT Token"
                        />

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>3. Get Profile (Me)</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            Fetches the currently authenticated user details. Requires <code>Authorization: Bearer &lt;TOKEN&gt;</code> header.
                        </p>
                        <CodeBlock
                            method="GET"
                            url="/api/userAuth/me"
                            comment="Get current logged in user details"
                        />

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>4. Social Auth Setup</h3>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>
                            Social Auth follows a Supabase-style setup flow. You do not type callback URLs manually into urBackend.
                        </p>
                        <div className="card" style={{ backgroundColor: '#1a1a1a', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#e5e5e5', marginBottom: '0.75rem' }}>
                                <strong>Step 1:</strong> Set your project <code>Site URL</code> in <strong>Project Settings</strong>.
                            </p>
                            <p style={{ fontSize: '0.9rem', color: '#e5e5e5', marginBottom: '0.75rem' }}>
                                <strong>Step 2:</strong> Open <strong>Auth → Social Auth</strong> in the dashboard and copy the read-only callback URL shown for GitHub or Google.
                            </p>
                            <p style={{ fontSize: '0.9rem', color: '#e5e5e5', marginBottom: '0.75rem' }}>
                                <strong>Step 3:</strong> Paste that callback URL into the provider console, create your OAuth app, then copy the <code>Client ID</code> and <code>Client Secret</code> back into urBackend.
                            </p>
                            <p style={{ fontSize: '0.9rem', color: '#e5e5e5', marginBottom: 0 }}>
                                <strong>Step 4:</strong> Enable the provider and save. After login, urBackend redirects users to <code>&lt;Site URL&gt;/auth/callback</code> with <code>token</code> in the URL fragment and <code>rtCode</code> in the query string. Your frontend should read both values, call <code>POST /api/userAuth/social/exchange</code>, receive the refresh token, store the session, and then continue to your app.
                            </p>
                        </div>

                        <div className="card" style={{ backgroundColor: '#111', border: '1px solid #333', marginBottom: '1rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', color: '#60a5fa' }}>Frontend callback contract</h4>
                            <p style={{ fontSize: '0.9rem', color: '#ddd', marginBottom: '0.75rem' }}>
                                Handle the redirect on your frontend route <code>/auth/callback</code>. urBackend sends the access token in the hash and the refresh-token exchange code in the query string.
                            </p>
                            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #60a5fa', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                <strong>💡 Security Tip:</strong> Access tokens are sent via the URL hash fragment (<code>#token=...</code>). Hash fragments are never sent to the server by browsers, which prevents your tokens from leaking into server access logs.
                            </div>
                            <RefTable
                                headers={['Location', 'Field', 'Meaning']}
                                rows={[
                                    ['URL fragment', 'token', 'Short-lived access token to store for authenticated API calls'],
                                    ['Query string', 'rtCode', 'One-time code used to exchange for the refresh token'],
                                    ['Query string', 'provider', 'Provider used for login, such as github or google'],
                                    ['Query string', 'projectId', 'Current project identifier'],
                                    ['Query string', 'userId', 'Authenticated user identifier'],
                                    ['Query string', 'isNewUser', 'String flag indicating whether the user was created during this login'],
                                    ['Query string', 'linkedByEmail', 'String flag indicating whether an existing user was linked by verified email'],
                                ]}
                            />
                        </div>

                        <h4 style={{ fontSize: '1rem', marginTop: '1.5rem' }}>POST /api/userAuth/social/exchange</h4>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.75rem' }}>
                            Call this from the callback page after extracting <code>token</code> and <code>rtCode</code>. This endpoint returns the refresh token and invalidates the one-time exchange code.
                        </p>
                        <ParamTable
                            params={[
                                { name: 'Content-Type', type: 'header', required: true, desc: 'Set to application/json.' },
                                { name: 'token', type: 'string', required: true, desc: 'Access token read from window.location.hash.' },
                                { name: 'rtCode', type: 'string', required: true, desc: 'One-time exchange code read from window.location.search.' },
                            ]}
                        />

                        <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#111', border: '1px solid #333', margin: '1.5rem 0' }}>
                            <div style={{ padding: '8px 16px', borderBottom: '1px solid #333', backgroundColor: '#1a1a1a' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#ccc' }}>Example callback handler</span>
                            </div>
                            <div style={{ padding: '16px', overflowX: 'auto' }}>
                                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#e5e5e5', lineHeight: 1.6 }}>{`const hashParams = new URLSearchParams(window.location.hash.slice(1));
const queryParams = new URLSearchParams(window.location.search);

const token = hashParams.get('token');
const rtCode = queryParams.get('rtCode');

if (!token || !rtCode) {
    throw new Error('Missing auth callback tokens');
}

const response = await fetch('${PUBLIC_API_URL}/api/userAuth/social/exchange', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, rtCode }),
});

const payload = await response.json();`}</pre>
                            </div>
                        </div>

                        <div className="card" style={{ backgroundColor: '#111', border: '1px solid #333', marginBottom: '1rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', color: '#4ade80' }}>Expected response</h4>
                            <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
                                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#e5e5e5', lineHeight: 1.6 }}>{`{
  "success": true,
  "data": {
    "refreshToken": "REFRESH_TOKEN_VALUE"
  },
  "message": "Refresh token exchanged successfully"
}`}</pre>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#ddd', marginBottom: '0.5rem' }}>
                                After success, keep using <code>token</code> as the access token, store <code>data.refreshToken</code>, optionally store <code>provider</code>, <code>projectId</code>, and <code>userId</code>, then redirect into the authenticated area of your app.
                            </p>
                            <RefTable
                                headers={['Status', 'Example message', 'When it happens']}
                                rows={[
                                    ['400', 'rtCode and token are required', 'Your callback page did not read one of the required values'],
                                    ['400', 'Invalid or expired refresh token exchange code', 'The one-time code expired or was already used'],
                                    ['403', 'Invalid refresh token exchange payload', 'The submitted token does not match the stored exchange payload'],
                                ]}
                            />
                        </div>
                    </div>
                );

            case 'data':
                return (
                    <div className="fade-in">
                        <h2 className="page-title">Database Operations</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            urBackend provides a simplified RESTful interface for MongoDB. Interact with collections via simple JSON.
                        </p>

                        <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#1a1a1a' }}>
                            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                <strong>Path Structure:</strong> All database endpoints follow the pattern <code>/api/data/:collectionName</code>.
                                Replace <code>:collectionName</code> with your target table (e.g., 'posts', 'inventory').
                            </p>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>1. Create a Document</h3>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>Enforces your schema rules. Requires your Secret Key.</p>
                        <CodeBlock
                            method="POST"
                            url="/api/data/posts"
                            body={{ title: "Why BaaS is the future", tags: ["tech", "development"], meta: { views: 0 } }}
                            comment="Add a new document"
                        />
                        <TryItPanel endpoint="/api/data/:collectionName" method="POST" />

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>2. Read Documents</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <CodeBlock
                                method="GET"
                                url="/api/data/posts"
                                comment="Fetch all documents in the collection"
                            />
                            <CodeBlock
                                method="GET"
                                url="/api/data/posts/642f9a1b..."
                                comment="Fetch a single document by its _id"
                            />
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>3. Update a Document</h3>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>
                            Uses MongoDB <code>$set</code> logic. You only need to send the fields you want to change. Nested updates are supported natively.
                        </p>
                        <CodeBlock
                            method="PUT"
                            url="/api/data/posts/642f9a1b..."
                            body={{ "meta.views": 105, tags: ["tech", "web"] }}
                            comment="Update document fields"
                        />

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>4. Delete a Document</h3>
                        <CodeBlock
                            method="DELETE"
                            url="/api/data/posts/642f9a1b..."
                            comment="Permanently remove a document"
                        />
                    </div>
                );
            case 'cursor-pagination':
                return (
                    <div className="fade-in">
                        <h2 className="page-title">Cursor-Based Pagination</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            For large collections, use cursor-based pagination for efficient deep paging with O(1) performance. Unlike offset-based pagination which becomes slow with large skip values, cursors maintain performance regardless of dataset size.
                        </p>

                        <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#1a1a1a', borderLeft: '3px solid var(--color-primary)' }}>
                            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                <strong>When to Use:</strong> Use cursor pagination when you need to paginate through large datasets, sort by indexed fields, or provide stable pagination results across concurrent requests.
                            </p>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>How Cursor Pagination Works</h3>
                        <ul style={{ color: '#aaa', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                            <li>Each page returns a <code>nextCursor</code> token</li>
                            <li>Pass the <code>nextCursor</code> as the <code>?cursor</code> query parameter to fetch the next page</li>
                            <li>Results are always sorted consistently by a field (default: <code>-createdAt</code>)</li>
                            <li>No limit offset jumping – always efficient</li>
                        </ul>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>1. Fetch First Page</h3>
                        <CodeBlock
                            method="GET"
                            url="/api/data/posts?limit=25&sort=createdAt:-1"
                            comment="Fetch first page without cursor"
                        />

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>2. Response Structure</h3>
                        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#111', margin: '1rem 0' }}>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#e5e5e5', lineHeight: 1.6 }}>
{`{
  "success": true,
  "data": {
    "items": [...documents...],
    "total": 500,
    "cursor": null,
    "nextCursor": "eyJzb3J0VmFsdWUiOiIyMDI0LTA0LTA1IiwiX2lkIjoiNjVmYzJhMDAwMDAwMDAwMDAwMDAwMDAwIn0=",
    "limit": 25
  },
  "message": "Data fetched successfully"
}`}
                            </pre>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>3. Fetch Next Page Using Cursor</h3>
                        <CodeBlock
                            method="GET"
                            url="/api/data/posts?limit=25&sort=createdAt:-1&cursor=eyJzb3J0VmFsdWUiOiIyMDI0LTA0LTA1IiwiX2lkIjoiNjVmYzJhMDAwMDAwMDAwMDAwMDAwMDAwIn0="
                            comment="Fetch next page using cursor"
                        />

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>4. Complete Example</h3>
                        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#111', margin: '1rem 0' }}>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#e5e5e5', lineHeight: 1.6 }}>
{`// Pagination loop
let cursor = null;
let allItems = [];

do {
  const url = new URL('${PUBLIC_API_URL}/api/data/posts');
  url.searchParams.append('limit', '50');
  url.searchParams.append('sort', 'createdAt:-1');
  if (cursor) {
    url.searchParams.append('cursor', cursor);
  }

  const response = await fetch(url.toString(), {
    headers: { 'x-api-key': 'YOUR_API_KEY' }
  });

  const data = await response.json();
  allItems = allItems.concat(data.data.items);

  cursor = data.data.nextCursor;
} while (cursor); // Continue until no nextCursor

console.log(\`Total fetched: \${allItems.length}\`);`}
                            </pre>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>Parameters</h3>
                        <ParamTable params={[
                            { name: 'cursor', type: 'string', required: false, desc: 'Base64-encoded cursor from previous response. Omit for first page.' },
                            { name: 'limit', type: 'number', required: false, desc: 'Documents per page (default: 50, max: 100).' },
                            { name: 'sort', type: 'string', required: false, desc: 'Sort field and direction (e.g., "createdAt:-1" for newest first).' },
                        ]} />

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>Comparison: Offset vs Cursor Pagination</h3>
                        <div style={{ margin: '1rem 0', overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                        <th style={{ padding: '8px', color: '#888' }}>Aspect</th>
                                        <th style={{ padding: '8px', color: '#888' }}>Offset Pagination</th>
                                        <th style={{ padding: '8px', color: '#888' }}>Cursor Pagination</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--color-primary)' }}>Performance</td>
                                        <td style={{ padding: '8px', color: '#aaa' }}>O(N) – slow for deep pages</td>
                                        <td style={{ padding: '8px', color: '#aaa' }}>O(1) – constant time</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--color-primary)' }}>Stability</td>
                                        <td style={{ padding: '8px', color: '#aaa' }}>Data shifts if items added/removed</td>
                                        <td style={{ padding: '8px', color: '#aaa' }}>Stable across concurrent changes</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--color-primary)' }}>URL</td>
                                        <td style={{ padding: '8px', color: '#aaa' }}>?page=5&limit=50</td>
                                        <td style={{ padding: '8px', color: '#aaa' }}>?cursor=TOKEN&limit=50</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--color-primary)' }}>Use Case</td>
                                        <td style={{ padding: '8px', color: '#aaa' }}>Small collections</td>
                                        <td style={{ padding: '8px', color: '#aaa' }}>Large collections, APIs</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'storage':
                return (
                    <div className="fade-in">
                        <h2 className="page-title">Cloud Storage</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            Manage file and image uploads to global CDNs automatically.
                        </p>

                        <div className="card" style={{ borderLeft: '4px solid var(--color-warning)', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.9rem' }}>
                                <strong>Note:</strong> Upload operations must use <code>multipart/form-data</code>. Do NOT send JSON, and let your browser/client set the Content-Type automatically.
                            </p>
                        </div>

                        <h3 style={{ fontSize: '1.1rem' }}>1. Upload a File</h3>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>Uploads file and returns a public CDN URL.</p>

                        <div className="card" style={{ padding: '0', overflow: 'hidden', backgroundColor: '#111', border: '1px solid #333', marginTop: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '16px', overflowX: 'auto' }}>
                                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#e5e5e5', lineHeight: 1.6 }}>{`// Upload via FormData
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('${PUBLIC_API_URL}/api/storage/upload', {
    method: 'POST',
    headers: {
        'x-api-key': 'YOUR_SECRET_KEY'
    },
    body: formData
});

const result = await response.json();
// Returns: { url: "https://...", path: "project_id/image.jpg", provider: "internal" }
console.log("File URL:", result.url);
`}</pre>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginTop: '2rem' }}>2. Delete a File</h3>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>Provide the exact <code>path</code> returned during the original upload.</p>
                        <CodeBlock
                            method="DELETE"
                            url="/api/storage/file"
                            body={{ path: "642f9a1b.../my_image.png" }}
                            comment="Permanently delete a file from storage"
                        />
                    </div>
                );

            case 'errors':
                return (
                    <div className="fade-in">
                        <h2 className="page-title" style={{ marginBottom: '1rem' }}>Error Reference</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            Standard HTTP status codes and what they mean in urBackend.
                        </p>
                        
                        <RefTable 
                            headers={['Status Code', 'Description']}
                            rows={[
                                ['200 OK', 'Request succeeded.'],
                                ['201 Created', 'Document, User, or File created successfully.'],
                                ['400 Bad Request', 'Validation failure or malformed JSON (Schema violation).'],
                                ['401 Unauthorized', 'Missing/Invalid API Key or expired JWT.'],
                                ['403 Forbidden', 'Resource limit exceeded (e.g. Storage Quota reached).'],
                                ['404 Not Found', 'Collection, document, or file does not exist.'],
                                ['413 Payload Too Large', 'File size exceeds limit (10MB max).'],
                                ['422 Unprocessable', 'Logic error, e.g. Trying to enable Auth without a users collection.'],
                                ['500 Server Error', 'Unexpected problem on our side.']
                            ]}
                        />
                    </div>
                );
            
            case 'limits':
                return (
                    <div className="fade-in">
                        <h2 className="page-title">Limits & Quotas</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                            Constraints applied to ensure high availability for all developers.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: 'var(--color-primary)' }}>
                                    <Zap size={20} />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Rate Limits</h3>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '5px' }}>100</div>
                                <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Requests per 15 mins (Global)</div>
                            </div>

                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#c084fc' }}>
                                    <Lock size={20} />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Auth Rate Limits</h3>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '5px' }}>~10/hr</div>
                                <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Login/Signup attempts per IP</div>
                            </div>

                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#f59e0b' }}>
                                    <HardDrive size={20} />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Upload Limits</h3>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '5px' }}>10 MB</div>
                                <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Maximum size per uploaded file</div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Storage & Database Quotas</h3>
                        <p style={{ color: '#aaa', lineHeight: '1.6', marginBottom: '1rem' }}>
                            Total allowed usage is determined by your current plan. By default on the Free tier, projects have caps on total Database Documents and File Storage. Exceeding these returns a <code>403 Forbidden</code> response on POST/PUT requests.
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <div className="docs-container container">

                {/* --- MOBILE TOGGLE --- */}
                <div className="docs-mobile-header">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Menu size={16} />
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
                        </span>
                        <ChevronDown size={16} style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
                    </button>
                </div>

                {/* --- LEFT SIDEBAR (Navigation) --- */}
                <div className={`docs-sidebar ${isMenuOpen ? 'open' : ''}`}>
                    <h3 className="docs-nav-title">
                        Getting Started
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                        {[
                            { id: 'intro', label: 'Introduction', icon: Terminal },
                            { id: 'quick-ref', label: 'API Quick Reference', icon: BookOpen },
                        ].map(item => (
                            <li key={item.id} style={{ marginBottom: '4px' }}>
                                <button
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsMenuOpen(false);
                                    }}
                                    className={`btn ${activeTab === item.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        backgroundColor: activeTab === item.id ? 'rgba(62, 207, 142, 0.1)' : 'transparent',
                                        color: activeTab === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        fontWeight: activeTab === item.id ? 600 : 400
                                    }}
                                >
                                    <item.icon size={16} /> {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <h3 className="docs-nav-title">
                        Core Concepts
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                        {[
                            { id: 'schemas', label: 'Schemas & Types', icon: FileJson },
                            { id: 'data', label: 'Database Operations', icon: Database },
                            { id: 'cursor-pagination', label: 'Cursor Pagination', icon: Zap },
                            { id: 'auth', label: 'Authentication', icon: Shield },
                            { id: 'storage', label: 'Cloud Storage', icon: HardDrive },
                        ].map(item => (
                            <li key={item.id} style={{ marginBottom: '4px' }}>
                                <button
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsMenuOpen(false);
                                    }}
                                    className={`btn ${activeTab === item.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        backgroundColor: activeTab === item.id ? 'rgba(62, 207, 142, 0.1)' : 'transparent',
                                        color: activeTab === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        fontWeight: activeTab === item.id ? 600 : 400
                                    }}
                                >
                                    <item.icon size={16} /> {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <h3 className="docs-nav-title">
                        Reference
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {[
                            { id: 'errors', label: 'Status Codes', icon: AlertTriangle },
                            { id: 'limits', label: 'Limits & Quotas', icon: AlertCircle },
                        ].map(item => (
                            <li key={item.id} style={{ marginBottom: '4px' }}>
                                <button
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsMenuOpen(false);
                                    }}
                                    className={`btn ${activeTab === item.id ? 'btn-primary' : 'btn-ghost'}`}
                                    style={{
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        backgroundColor: activeTab === item.id ? 'rgba(62, 207, 142, 0.1)' : 'transparent',
                                        color: activeTab === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        fontWeight: activeTab === item.id ? 600 : 400
                                    }}
                                >
                                    <item.icon size={16} /> {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* --- RIGHT CONTENT --- */}
                <div className="docs-content">
                    {renderContent()}
                </div>

                {/* --- RESPONSIVE STYLES --- */}
                <style>{`
                .docs-container {
                    display: flex;
                    gap: 3rem;
                    align-items: flex-start;
                    padding-top: 2rem;
                    padding-bottom: 6rem;
                }
                .docs-sidebar {
                    width: 240px;
                    position: sticky;
                    top: 100px;
                    flex-shrink: 0;
                }
                .docs-content {
                    flex: 1;
                    min-width: 0;
                }
                .docs-mobile-header {
                    display: none;
                    margin-bottom: 1rem;
                }
                .docs-nav-title {
                    font-size: 0.8rem;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 1rem;
                    font-weight: 700;
                }
                
                .fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

                /* --- MOBILE MEDIA QUERY --- */
                @media (max-width: 768px) {
                    .docs-container {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    .docs-mobile-header {
                        display: block;
                        width: 100%;
                    }
                    .docs-sidebar {
                        width: 100%;
                        position: relative;
                        top: 0;
                        display: none;
                        background: var(--color-bg-card);
                        padding: 1rem;
                        border-radius: 8px;
                        border: 1px solid var(--color-border);
                    }
                    .docs-sidebar.open {
                        display: block;
                    }
                    .page-title {
                        font-size: 1.5rem;
                    }
                }
            `}</style>

            </div>
            <Footer />
        </>
    );
}
