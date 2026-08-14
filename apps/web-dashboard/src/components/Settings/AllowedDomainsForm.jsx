import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Globe, Plus, AlertTriangle, X } from "lucide-react";
import { SettingsCard } from "./formPrimitives";
import { inputStyle } from "../../utils/styles";

export default function AllowedDomainsForm({ project, projectId, onProjectUpdate, role }) {
    const isViewer = role === 'viewer';
    const [domains, setDomains] = useState(project?.allowedDomains || []);
    const [newDomain, setNewDomain] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => { 
        if (project?.allowedDomains) {
            Promise.resolve().then(() => setDomains(project.allowedDomains)); 
        }
    }, [project?.allowedDomains]);

    const handleUpdate = async (updatedDomains) => {
        setLoading(true);
        try {
            await api.patch(`/api/projects/${projectId}/allowed-domains`, { domains: updatedDomains });
            toast.success("Allowed domains updated!");
            setDomains(updatedDomains);
            onProjectUpdate((prev) => ({ ...prev, allowedDomains: updatedDomains }));
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update allowed domains");
        } finally {
            setLoading(false);
        }
    };

    const addDomain = () => {
        let domain = newDomain.trim();
        if (!domain) return;
        if (domain !== "*" && domain.endsWith("/")) domain = domain.slice(0, -1);
        if (domains.includes(domain)) return toast.error("Domain already added");
        const updated = domain === "*" ? ["*"] : [...domains.filter(d => d !== "*"), domain];
        handleUpdate(updated);
        setNewDomain("");
    };

    const removeDomain = (d) => handleUpdate(domains.filter(x => x !== d));

    return (
        <SettingsCard
            title="Allowed Domains (CORS)"
            icon={Globe}
            iconColor="#6366f1"
            accentColor="#6366f1"
            info={{
                title: 'Allowed Domains (CORS)',
                description: "Restricts which browser origins are permitted to make requests using your Publishable API Key (pk_live_...). Add your frontend URL like https://myapp.com. Use * to allow all origins (not recommended for production). If this list is empty, pk_live requests from browsers will be blocked.",
                docsUrl: 'https://docs.ub.bitbros.in/concepts/api-keys'
            }}
        >
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                Restrict which websites can send requests using your <strong>Publishable API Key</strong>.{' '}
                Use <code>*</code> to allow all, or specify like <code>https://example.com</code>.
            </p>

            {!isViewer && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="https://mywebsite.com or *.mywebsite.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDomain(); } }}
                        style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                        onClick={addDomain}
                        className="btn btn-secondary"
                        disabled={loading || !newDomain.trim()}
                        style={{ height: '30px', fontSize: '0.75rem', padding: '0 12px', gap: '4px', flexShrink: 0 }}
                    >
                        <Plus size={12} /> Add
                    </button>
                </div>
            )}

            {domains.length === 0 ? (
                <div style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.72rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px dashed var(--color-border)' }}>
                    No domains configured — your publishable key won't work on the web. Add <code>*</code> to allow all.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {domains.map((domain) => (
                        <div key={domain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.75rem' }}>
                                {domain === "*" ? (
                                    <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem' }}>
                                        <AlertTriangle size={11} color="#10b981" /> ALLOW ALL (*)
                                    </span>
                                ) : (
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{domain}</span>
                                )}
                            </div>
                            {!isViewer && (
                                <button
                                    onClick={() => removeDomain(domain)}
                                    disabled={loading}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '3px' }}
                                    onMouseOver={(e) => e.currentTarget.style.color = '#ea5455'}
                                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </SettingsCard>
    );
}
