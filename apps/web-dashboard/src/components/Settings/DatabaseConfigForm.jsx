import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Database, CheckCircle, Server, Copy } from "lucide-react";
import ConfirmationModal from "../../pages/ConfirmationModal";
import { SettingsCard } from "./formPrimitives";
import { inputStyle } from "../../utils/styles";

export default function DatabaseConfigForm({ project, projectId, onProjectUpdate, role }) {
    const isViewer = role === 'viewer';
    const [dbUri, setDbUri] = useState("");
    const [loading, setLoading] = useState(false);
    const isConfigured = project?.resources?.db?.isExternal || false;
    const [showForm, setShowForm] = useState(!isConfigured);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [serverIp, setServerIp] = useState(null);

    useEffect(() => {
        let isMounted = true;
        Promise.resolve().then(() => setShowForm(!(project?.resources?.db?.isExternal || false)));
        const fetchIp = async () => {
            try { 
                const { PUBLIC_API_URL } = await import('../../config');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const [res1, res2] = await Promise.allSettled([
                    api.get(`/api/server-ip`),
                    fetch(`${PUBLIC_API_URL}/api/server-ip`, { signal: controller.signal })
                        .then(r => {
                            if (!r.ok) throw new Error("Public API unresponsive");
                            return r.json();
                        })
                        .finally(() => clearTimeout(timeoutId))
                ]);
                
                const ips = [];
                if (res1.status === 'fulfilled' && res1.value.data.ip) ips.push(res1.value.data.ip);
                if (res2.status === 'fulfilled' && res2.value.ip) ips.push(res2.value.ip);
                
                if (isMounted) setServerIp(ips.join(', '));
            }
            catch (e) { console.error("Failed to fetch server IP", e); }
        };
        fetchIp();
        return () => { isMounted = false; };
    }, [project]);

    const copyIp = async () => {
        if (serverIp && navigator?.clipboard) {
            try {
                await navigator.clipboard.writeText(serverIp);
                toast.success("Server IP copied!");
            } catch {
                toast.error("Failed to copy server IP");
            }
        }
    };

    const handleUpdate = async () => {
        if (!dbUri) return toast.error("Database URI is required");
        setLoading(true);
        try {
            await api.patch(`/api/projects/${projectId}/byod-config`, { dbUri });
            toast.success("Database configuration updated!");
            setShowForm(false);
            setDbUri("");
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to update DB config";
            if (errorMsg.includes("whitelist Server IP")) {
                toast.error(<div><b>Access Denied!</b><br />{errorMsg}</div>, { duration: 6000 });
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const executeRemove = async () => {
        try {
            await api.delete(`/api/projects/${projectId}/byod-config/db`, { data: { projectId } });
            toast.success("External database configuration removed!");
            onProjectUpdate(prev => ({ ...prev, resources: { ...prev.resources, db: { ...prev.resources.db, isExternal: false } } }));
            setShowForm(true);
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to remove DB config");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SettingsCard
            title="Database (MongoDB)"
            icon={Database}
            iconColor="var(--color-primary)"
            accentColor="var(--color-primary)"
            info={{
                title: 'Database — Bring Your Own Database (BYOD)',
                description: "Connect your own MongoDB Atlas cluster (or any MongoDB-compatible URI) as the data store for this project. Both the Dashboard API and Public API server IPs must be whitelisted in Atlas. Once connected, all collection data is stored in your own cluster — urBackend becomes a headless layer. The connection URI is encrypted at rest.",
                docsUrl: 'https://docs.ub.bitbros.in/guides/database#connect-your-own-mongodb-byod'
            }}
        >
            {showRemoveModal && (
                <ConfirmationModal
                    open={showRemoveModal}
                    title="Remove Database Config"
                    message="Remove the external database configuration? This will switch back to the internal database."
                    onConfirm={() => { executeRemove(); setShowRemoveModal(false); }}
                    onCancel={() => setShowRemoveModal(false)}
                />
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Connect your own MongoDB cluster for full data ownership.</p>

            {isConfigured && !showForm ? (
                <div style={{ background: 'rgba(16,185,129,0.08)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#10B981', fontWeight: 600, fontSize: '0.78rem' }}>
                        <CheckCircle size={13} /> Connected to external MongoDB
                    </div>
                    {!isViewer && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowForm(true)} style={{ height: '26px', fontSize: '0.7rem', padding: '0 10px' }}>Update URI</button>
                            <button className="btn btn-danger" onClick={() => setShowRemoveModal(true)} disabled={loading} style={{ height: '26px', fontSize: '0.7rem', padding: '0 10px' }}>
                                {loading ? "Removing..." : "Remove"}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>MongoDB Connection URI</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="mongodb+srv://user:pass@cluster.mongodb.net/..."
                            value={dbUri}
                            onChange={(e) => setDbUri(e.target.value)}
                            style={{ ...inputStyle, fontFamily: 'monospace' }}
                            disabled={isViewer}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            <Server size={11} />
                            <span>Public IP: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.68rem' }}>{serverIp || "..."}</code></span>
                            {serverIp && (
                                <button onClick={copyIp} aria-label="Copy server IP" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)', padding: 0 }}>
                                    <Copy size={11} />
                                </button>
                            )}
                        </div>
                        {!isViewer && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {isConfigured && <button className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ height: '28px', fontSize: '0.72rem', padding: '0 10px' }}>Cancel</button>}
                                <button onClick={handleUpdate} className="btn btn-primary" disabled={loading} style={{ height: '28px', fontSize: '0.72rem', padding: '0 12px' }}>
                                    {loading ? "Connecting..." : "Connect Database"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </SettingsCard>
    );
}
