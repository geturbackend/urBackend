import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { HardDrive, CheckCircle } from "lucide-react";
import ConfirmationModal from "../../pages/ConfirmationModal";
import { SettingsCard } from "./formPrimitives";
import { inputStyle } from "../../utils/styles";

const INITIAL_STORAGE_CONFIG = {
    storageProvider: "supabase",
    storageUrl: "", storageKey: "",
    s3AccessKeyId: "", s3SecretAccessKey: "", s3Region: "", s3Endpoint: "", s3Bucket: "", publicUrlHost: "",
};

export default function StorageConfigForm({ project, projectId, onProjectUpdate, role }) {
    const isViewer = role === 'viewer';
    const [config, setConfig] = useState(INITIAL_STORAGE_CONFIG);
    const [loading, setLoading] = useState(false);
    const isConfigured = project?.resources?.storage?.isExternal || false;
    const [showForm, setShowForm] = useState(!isConfigured);
    const [showRemoveModal, setShowRemoveModal] = useState(false);

    useEffect(() => { 
        Promise.resolve().then(() => setShowForm(!(project?.resources?.storage?.isExternal || false))); 
    }, [project?.resources?.storage?.isExternal]);

    useEffect(() => {
        Promise.resolve().then(() => {
            if (config.storageProvider === "supabase") {
                setConfig(prev => ({ ...prev, s3AccessKeyId: "", s3SecretAccessKey: "", s3Region: "", s3Endpoint: "", s3Bucket: "", publicUrlHost: "" }));
            } else if (["s3", "cloudflare_r2", "gcs"].includes(config.storageProvider)) {
                setConfig(prev => ({ 
                    ...prev, 
                    storageUrl: "", 
                    storageKey: "",
                    ...(config.storageProvider === "gcs" ? { s3Endpoint: "", publicUrlHost: "" } : {})
                }));
            }
        });
    }, [config.storageProvider]);

    const handleChange = (e) => setConfig({ ...config, [e.target.name]: e.target.value });

    const handleUpdate = async () => {
        if (config.storageProvider === "supabase" && (!config.storageUrl || !config.storageKey)) return toast.error("URL and Key are required");
        if (config.storageProvider === "s3" && (!config.s3AccessKeyId || !config.s3SecretAccessKey || !config.s3Region || !config.s3Bucket)) return toast.error("S3 keys, region, and bucket are required");
        if (config.storageProvider === "cloudflare_r2" && (!config.s3AccessKeyId || !config.s3SecretAccessKey || !config.s3Endpoint || !config.s3Bucket || !config.publicUrlHost)) return toast.error("R2 keys, endpoint, bucket, and publicUrlHost are required");
        if (config.storageProvider === "gcs" && (!config.s3AccessKeyId || !config.s3SecretAccessKey || !config.s3Bucket)) return toast.error("GCS HMAC keys and bucket are required");

        setLoading(true);
        try {
            await api.patch(`/api/projects/${projectId}/byod-config`, config);
            toast.success("Storage configuration updated!");
            setShowForm(false);
            setConfig(INITIAL_STORAGE_CONFIG);
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update Storage config");
        } finally {
            setLoading(false);
        }
    };

    const executeRemove = async () => {
        setLoading(true);
        try {
            await api.delete(`/api/projects/${projectId}/byod-config/storage`, { data: { projectId } });
            toast.success("External storage configuration removed!");
            onProjectUpdate(prev => ({ ...prev, resources: { ...prev.resources, storage: { ...prev.resources.storage, isExternal: false } } }));
            setConfig(INITIAL_STORAGE_CONFIG);
            setShowForm(true);
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to remove Storage config");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SettingsCard
            title="Storage (BYOS)"
            icon={HardDrive}
            iconColor="#34d399"
            accentColor="#34d399"
            info={{
                title: 'Storage — Bring Your Own Storage (BYOS)',
                description: "Connect your own cloud storage bucket for file uploads. Supported providers: Supabase Storage, AWS S3, Cloudflare R2, and Google Cloud Storage. urBackend proxies file operations through the Public API (/api/storage) using signed URLs. Your bucket credentials are encrypted at rest.",
                docsUrl: 'https://docs.ub.bitbros.in/guides/storage'
            }}
        >
            {showRemoveModal && (
                <ConfirmationModal
                    open={showRemoveModal}
                    title="Remove Storage Config"
                    message="Remove the external storage configuration? This will switch back to internal storage."
                    onConfirm={() => { executeRemove(); setShowRemoveModal(false); }}
                    onCancel={() => setShowRemoveModal(false)}
                />
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Connect your own Supabase, AWS S3, Cloudflare R2, or Google Cloud Storage (GCS) bucket.</p>

            {isConfigured && !showForm ? (
                <div style={{ background: 'rgba(16,185,129,0.08)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#10B981', fontWeight: 600, fontSize: '0.78rem' }}>
                        <CheckCircle size={13} /> External storage connected
                    </div>
                    {!isViewer && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowForm(true)} style={{ height: '26px', fontSize: '0.7rem', padding: '0 10px' }}>Update Config</button>
                            <button className="btn btn-danger" onClick={() => setShowRemoveModal(true)} disabled={loading} style={{ height: '26px', fontSize: '0.7rem', padding: '0 10px' }}>
                                {loading ? "Removing..." : "Remove"}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Storage Provider</label>
                        <select
                            name="storageProvider"
                            className="input-field"
                            value={config.storageProvider}
                            onChange={handleChange}
                            style={{ ...inputStyle, maxWidth: '220px' }}
                            disabled={isViewer}
                        >
                            <option value="supabase">Supabase</option>
                            <option value="s3">AWS S3</option>
                            <option value="cloudflare_r2">Cloudflare R2</option>
                            <option value="gcs">Google Cloud Storage (GCS)</option>
                        </select>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--color-border)', display: 'grid', gap: '10px' }}>
                        {config.storageProvider === "supabase" && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Supabase Project URL</label>
                                    <input type="text" name="storageUrl" className="input-field" value={config.storageUrl} onChange={handleChange} placeholder="https://abc.supabase.co" style={inputStyle} disabled={isViewer} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Service Role Key</label>
                                    <input type="password" name="storageKey" className="input-field" value={config.storageKey} onChange={handleChange} placeholder="eyJhb..." style={{ ...inputStyle, fontFamily: 'monospace' }} disabled={isViewer} />
                                </div>
                            </div>
                        )}

                        {["s3", "cloudflare_r2", "gcs"].includes(config.storageProvider) && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Bucket Name</label>
                                        <input type="text" name="s3Bucket" className="input-field" value={config.s3Bucket} onChange={handleChange} placeholder="my-assets" style={inputStyle} disabled={isViewer} />
                                    </div>
                                    {config.storageProvider === "s3" ? (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Region</label>
                                            <input type="text" name="s3Region" className="input-field" value={config.s3Region} onChange={handleChange} placeholder="ap-south-1" style={inputStyle} disabled={isViewer} />
                                        </div>
                                    ) : config.storageProvider === "gcs" ? (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>GCS XML API Endpoint</label>
                                            <input type="text" name="s3Endpoint" className="input-field" value={config.s3Endpoint || "https://storage.googleapis.com"} onChange={handleChange} placeholder="https://storage.googleapis.com" style={inputStyle} disabled={isViewer} />
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>S3 API Endpoint</label>
                                            <input type="text" name="s3Endpoint" className="input-field" value={config.s3Endpoint} onChange={handleChange} placeholder="https://<account>.r2.cloudflarestorage.com" style={inputStyle} disabled={isViewer} />
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {config.storageProvider === "gcs" ? "HMAC Access Key ID" : "Access Key ID"}
                                        </label>
                                        <input type="text" name="s3AccessKeyId" className="input-field" value={config.s3AccessKeyId} onChange={handleChange} placeholder={config.storageProvider === "gcs" ? "GOOG..." : "AKIA..."} style={{ ...inputStyle, fontFamily: 'monospace' }} disabled={isViewer} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {config.storageProvider === "gcs" ? "HMAC Secret Access Key" : "Secret Access Key"}
                                        </label>
                                        <input type="password" name="s3SecretAccessKey" className="input-field" value={config.s3SecretAccessKey} onChange={handleChange} placeholder="wJalr..." style={{ ...inputStyle, fontFamily: 'monospace' }} disabled={isViewer} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Public URL Host / CDN Domain{' '}
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem', opacity: 0.8 }}>{config.storageProvider === "cloudflare_r2" ? "(Required)" : "(Optional)"}</span>
                                    </label>
                                    <input type="text" name="publicUrlHost" className="input-field" value={config.publicUrlHost} onChange={handleChange} placeholder={config.storageProvider === "gcs" ? "https://storage.googleapis.com/my-bucket" : "https://cdn.my-company.com"} style={inputStyle} disabled={isViewer} />
                                    <small style={{ display: 'block', marginTop: '4px', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                                        {config.storageProvider === "gcs" ? "Custom domain or default GCS public host" : "Custom domain or CDN (e.g. CloudFront, R2 Dev Domain)"}
                                    </small>
                                </div>
                            </>
                        )}
                    </div>

                    {!isViewer && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {isConfigured && <button className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ height: '28px', fontSize: '0.72rem', padding: '0 10px' }}>Cancel</button>}
                            <button onClick={handleUpdate} className="btn btn-primary" disabled={loading} style={{ height: '28px', fontSize: '0.72rem', padding: '0 12px' }}>
                                {loading ? "Saving..." : "Connect Storage"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </SettingsCard>
    );
}
