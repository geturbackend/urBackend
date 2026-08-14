import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Key, Trash2, Plus, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import ConfirmationModal from '../pages/ConfirmationModal';
import SettingInfoTooltip from './Settings/SettingInfoTooltip';

const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    const diffMs = new Date(dateString) - new Date();
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'in 1 day';
    if (diffDays > 300) return 'in 1 year'; 
    return `in ${diffDays} days`;
};

const DEFAULT_FORM = { label: '', ttlDays: 30 };

export default function PATManager() {
    const [pats, setPats] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newPatForm, setNewPatForm] = useState(DEFAULT_FORM);
    
    // Token Reveal State
    const [newRawToken, setNewRawToken] = useState(null);
    const [copied, setCopied] = useState(false);

    // Revoke Modal State
    const [revokeId, setRevokeId] = useState(null);
    const [revoking, setRevoking] = useState(false);

    // Ref for clipboard timeout cleanup
    const copyTimerRef = useRef(null);

    const fetchPats = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/user/pats');
            setPats(res.data.data?.pats || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load Personal Access Tokens");
        } finally {
            setLoading(false);
        }
    }, []);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        fetchPats();
    }, [fetchPats]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Cleanup copy timer on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        };
    }, []);

    const handleCreate = useCallback(async (e) => {
        e.preventDefault();
        if (!newPatForm.label.trim()) return toast.error("Label is required");
        
        setCreating(true);
        try {
            const res = await api.post('/api/user/pats', {
                label: newPatForm.label,
                ttlDays: Number(newPatForm.ttlDays),
                scopes: ['api:all']
            });
            
            const created = res.data.data;

            // Show the PAT only once
            setNewRawToken(created.rawToken);
            setShowCreateModal(false);
            setNewPatForm(DEFAULT_FORM);
            
            // Optimistic local append — avoids a redundant GET /api/user/pats round-trip
            if (created.id || created._id) {
                setPats(prev => [...prev, {
                    id: created.id || created._id,
                    label: created.label,
                    suffix: created.suffix,
                    expiresAt: created.expiresAt,
                    createdAt: created.createdAt,
                    lastUsedAt: null,
                    lastUsedIp: null
                }]);
            } else {
                // Fallback: if backend doesn't return the full object, refetch
                fetchPats();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to generate token");
        } finally {
            setCreating(false);
        }
    }, [newPatForm, fetchPats]);

    const handleRevoke = useCallback(async () => {
        if (!revokeId || revoking) return; 
        setRevoking(true);
        const currentRevokeId = revokeId;
        
        try {
            await api.delete(`/api/user/pats/${currentRevokeId}`);
            toast.success("Token revoked successfully");
            // Optimistic local filter — no server round-trip needed
            setPats(prev => prev.filter(p => (p._id || p.id) !== currentRevokeId));
        } catch (err) {
            if (err.response?.status !== 404) {
                toast.error(err.response?.data?.message || "Failed to revoke token");
            } else {
                // Already deleted on server, just clean up local state
                setPats(prev => prev.filter(p => (p._id || p.id) !== currentRevokeId));
            }
        } finally {
            setRevokeId(null);
            setRevoking(false);
        }
    }, [revokeId, revoking]);

    const copyToClipboard = useCallback(async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch {
            toast.error("Failed to copy token");
            return;
        }
        // Clear any existing timer before setting a new one
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }, []);

    return (
        <div className="card" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ padding: '10px', background: 'rgba(62, 207, 142, 0.1)', borderRadius: '10px', color: 'var(--color-primary)' }}>
                        <Key size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center' }}>
                            Personal Access Tokens
                            <SettingInfoTooltip
                                title="Personal Access Tokens (PAT)"
                                description="Long-lived authentication tokens for the urBackend CLI (@urbackend/cli). Each token is prefixed with ubpat_ and is shown only once on creation — store it securely. You can set a TTL of 7, 30, 90, or 365 days. Use 'ub login' in your terminal with a PAT to authenticate the CLI."
                                docsUrl="https://docs.ub.bitbros.in/cli/overview"
                            />
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Generate tokens to securely authenticate with the urBackend CLI.</p>
                    </div>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => setShowCreateModal(true)}
                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <Plus size={16} /> Generate Token
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading tokens...</div>
            ) : pats.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-bg-input)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>You don't have any Active Personal Access Tokens.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead style={{ background: 'var(--color-bg-input)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Label</th>
                                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Token</th>
                                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Expires</th>
                                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Last Used</th>
                                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-muted)', width: '60px' }} aria-label="Actions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pats.map((pat) => (
                                <tr key={pat.id || pat._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{pat.label}</td>
                                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>ubpat_***{pat.suffix}</td>
                                    <td style={{ padding: '12px 16px' }}>{formatRelativeTime(pat.expiresAt)}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span>{formatDate(pat.lastUsedAt)}</span>
                                            {pat.lastUsedIp && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{pat.lastUsedIp}</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => setRevokeId(pat.id || pat._id)}
                                            style={{ background: 'none', border: 'none', color: '#ea5455', cursor: 'pointer', padding: '6px' }}
                                            title="Revoke Token"
                                            aria-label={`Revoke token ${pat.label}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create PAT Modal */}
            {showCreateModal && (
                <div 
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-pat-modal-title"
                >
                    <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px', padding: '2rem' }}>
                        <h3 id="create-pat-modal-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Generate New Token</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                            This token will give full access to your developer account from the CLI.
                        </p>
                        
                        <form onSubmit={handleCreate}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Token Label</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="e.g. GitHub Actions CI"
                                    value={newPatForm.label}
                                    onChange={(e) => setNewPatForm({...newPatForm, label: e.target.value})}
                                    required
                                    autoFocus
                                    maxLength={100}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">Expiration</label>
                                <select 
                                    className="input-field"
                                    value={newPatForm.ttlDays}
                                    onChange={(e) => setNewPatForm({...newPatForm, ttlDays: e.target.value})}
                                    style={{ width: '100%' }}
                                >
                                    <option value="7">7 Days</option>
                                    <option value="30">30 Days</option>
                                    <option value="90">90 Days</option>
                                    <option value="365">1 Year</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={creating}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Generating...' : 'Generate Token'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* One Time Reveal Modal */}
            {newRawToken && (
                <div 
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reveal-pat-modal-title"
                >
                    <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px', border: '1px solid var(--color-primary)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                            <CheckCircle size={24} />
                            <h3 id="reveal-pat-modal-title" style={{ fontSize: '1.25rem' }}>Token Generated Successfully</h3>
                        </div>
                        
                        <div style={{ background: 'rgba(234, 84, 85, 0.1)', border: '1px solid rgba(234, 84, 85, 0.3)', padding: '12px', borderRadius: '8px', color: '#ea5455', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                                <strong>Save this token.</strong> This is one time view token, cannot be seen again. 
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
                            <input 
                                type="text" 
                                readOnly 
                                value={newRawToken} 
                                className="input-field"
                                style={{ flex: 1, fontFamily: 'monospace', fontSize: '1rem', background: '#000' }}
                            />
                            <button 
                                onClick={() => copyToClipboard(newRawToken)}
                                className="btn btn-secondary"
                                style={{ width: '100px', display: 'flex', justifyContent: 'center' }}
                            >
                                {copied ? <span style={{ color: 'var(--color-primary)' }}>Copied!</span> : <><Copy size={16} /> Copy</>}
                            </button>
                        </div>

                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '12px' }}
                            onClick={() => setNewRawToken(null)}
                        >
                            I have saved my token safely
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                open={!!revokeId}
                title="Revoke Token?"
                message="Are you sure you want to revoke this Personal Access Token? Any CLI sessions or scripts using this token will instantly lose access. This action cannot be undone."
                onConfirm={handleRevoke}
                onCancel={() => setRevokeId(null)}
            />
        </div>
    );
}
