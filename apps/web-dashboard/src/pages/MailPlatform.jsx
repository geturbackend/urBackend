import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    Mail, Send, Eye, RefreshCw, Plus, Trash2, Users, UserPlus,
    Radio, ShieldAlert, AlertCircle
} from 'lucide-react';
import SectionHeader from '../components/Dashboard/SectionHeader';

const STATUS_COLORS = {
    queued: '#3b82f6',
    sent: '#10b981',
    delivered: '#10b981',
    bounced: '#ef4444',
    complained: '#f59e0b',
};

export default function MailPlatform() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('logs');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Project context
    const [project, setProject] = useState(null);

    // Logs state
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [liveStatusData, setLiveStatusData] = useState(null);
    const [liveStatusLoading, setLiveStatusLoading] = useState(false);

    // Audiences state
    const [audiences, setAudiences] = useState([]);
    const [selectedAudienceId, setSelectedAudienceId] = useState('');
    const [contacts, setContacts] = useState([]);
    const [newAudienceName, setNewAudienceName] = useState('');
    const [creatingAudience, setCreatingAudience] = useState(false);

    // Contacts state
    const [newContactEmail, setNewContactEmail] = useState('');
    const [newContactFirstName, setNewContactFirstName] = useState('');
    const [newContactLastName, setNewContactLastName] = useState('');
    const [creatingContact, setCreatingContact] = useState(false);

    // Broadcasts state
    const [broadcastSubject, setBroadcastSubject] = useState('');
    const [broadcastHtml, setBroadcastHtml] = useState('');
    const [broadcastAudienceId, setBroadcastAudienceId] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);

    const fetchProjectAndLogs = useCallback(async () => {
        try {
            setRefreshing(true);
            const [projRes, logsRes] = await Promise.all([
                api.get(`/api/projects/${projectId}`),
                api.get(`/api/projects/${projectId}/mail/logs`)
            ]);
            setProject(projRes.data);
            if (logsRes.data?.success) {
                setLogs(logsRes.data.data.logs || []);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch mail data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [projectId]);

    const fetchAudiences = useCallback(async () => {
        try {
            const res = await api.get(`/api/projects/${projectId}/mail/audiences`);
            if (res.data?.success) {
                const audList = res.data.data?.data || [];
                setAudiences(audList);
                if (audList.length > 0 && !selectedAudienceId) {
                    setSelectedAudienceId(audList[0].id);
                }
            }
        } catch (err) {
            // Might be 403 if BYOK not enabled
            console.warn("Audiences fetch blocked/failed:", err.response?.data?.message);
        }
    }, [projectId, selectedAudienceId]);

    const fetchContacts = useCallback(async (audId) => {
        if (!audId) return;
        try {
            const res = await api.get(`/api/projects/${projectId}/mail/audiences/${audId}/contacts`);
            if (res.data?.success) {
                setContacts(res.data.data?.data || []);
            }
        } catch (err) {
            console.error("Contacts load error", err);
        }
    }, [projectId]);

    useEffect(() => {
        queueMicrotask(() => fetchProjectAndLogs());
    }, [fetchProjectAndLogs]);

    useEffect(() => {
        if (project?.hasResendApiKey) {
            queueMicrotask(() => fetchAudiences());
        }
    }, [project?.hasResendApiKey, fetchAudiences]);

    useEffect(() => {
        if (selectedAudienceId) {
            queueMicrotask(() => fetchContacts(selectedAudienceId));
        }
    }, [selectedAudienceId, fetchContacts]);

    const handleCreateAudience = async (e) => {
        e.preventDefault();
        if (!newAudienceName.trim()) return;
        setCreatingAudience(true);
        try {
            const res = await api.post(`/api/projects/${projectId}/mail/audiences`, { name: newAudienceName });
            if (res.data?.success) {
                toast.success("Audience created successfully!");
                setNewAudienceName('');
                await fetchAudiences();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create audience");
        } finally {
            setCreatingAudience(false);
        }
    };

    const handleDeleteAudience = async (id) => {
        if (!window.confirm("Delete this audience? All contacts inside will be removed.")) return;
        try {
            const res = await api.delete(`/api/projects/${projectId}/mail/audiences/${id}`);
            if (res.data?.success) {
                toast.success("Audience deleted");
                if (selectedAudienceId === id) setSelectedAudienceId('');
                await fetchAudiences();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete audience");
        }
    };

    const handleCreateContact = async (e) => {
        e.preventDefault();
        if (!newContactEmail.trim() || !selectedAudienceId) return;
        setCreatingContact(true);
        try {
            const res = await api.post(`/api/projects/${projectId}/mail/audiences/${selectedAudienceId}/contacts`, {
                email: newContactEmail.trim(),
                firstName: newContactFirstName.trim(),
                lastName: newContactLastName.trim(),
                unsubscribed: false
            });
            if (res.data?.success) {
                toast.success("Contact added successfully!");
                setNewContactEmail('');
                setNewContactFirstName('');
                setNewContactLastName('');
                await fetchContacts(selectedAudienceId);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add contact");
        } finally {
            setCreatingContact(false);
        }
    };

    const handleDeleteContact = async (contactId) => {
        if (!window.confirm("Remove this contact from the audience?")) return;
        try {
            const res = await api.delete(`/api/projects/${projectId}/mail/audiences/${selectedAudienceId}/contacts/${contactId}`);
            if (res.data?.success) {
                toast.success("Contact removed");
                await fetchContacts(selectedAudienceId);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove contact");
        }
    };

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!broadcastAudienceId || !broadcastSubject || !broadcastHtml) {
            return toast.error("Please fill in all broadcast fields");
        }
        setSendingBroadcast(true);
        try {
            const res = await api.post(`/api/projects/${projectId}/mail/broadcasts`, {
                audienceId: broadcastAudienceId,
                subject: broadcastSubject,
                html: broadcastHtml
            });
            if (res.data?.success) {
                toast.success("Marketing broadcast campaign deployed!");
                setBroadcastSubject('');
                setBroadcastHtml('');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to deploy broadcast campaign");
        } finally {
            setSendingBroadcast(false);
        }
    };

    const handleViewLiveStatus = async (log) => {
        setSelectedLog(log);
        setLiveStatusData(null);
        if (!log?.resendEmailId) return;
        setLiveStatusLoading(true);
        try {
            const res = await api.get(`/api/projects/${projectId}/mail/logs/${log.resendEmailId}/live`);
            if (res.data?.success) {
                setLiveStatusData(res.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not fetch live status from provider");
        } finally {
            setLiveStatusLoading(false);
        }
    };

    if (loading) return (
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div className="spinner" />
        </div>
    );

    const isByok = !!project?.hasResendApiKey;

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem', padding: '0 1rem' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ 
                        width: '44px', height: '44px', borderRadius: '10px', 
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.05) 100%)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        border: '1px solid rgba(168,85,247,0.3)' 
                    }}>
                        <Mail size={22} color="#a855f7" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Mail Platform</h1>
                            <span style={{ 
                                fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
                                background: isByok ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                                color: isByok ? '#10b981' : '#3b82f6', border: `1px solid ${isByok ? '#10b981' : '#3b82f6'}30`
                            }}>
                                {isByok ? 'BYOK Gateway Active' : 'Shared Pool Mode'}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                            High-throughput delivery logging, remote audiences segmentation, and mass broadcast pipelines.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => navigate(`/project/${projectId}/settings`)} 
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', height: '34px', borderColor: 'rgba(168,85,247,0.3)' }}
                    >
                        Configure BYOK Key
                    </button>
                    <button 
                        onClick={fetchProjectAndLogs} 
                        disabled={refreshing}
                        className="btn btn-primary"
                        style={{ height: '34px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                    >
                        <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Config & Metrics Banner */}
            {!isByok && (
                <div className="glass-card" style={{ 
                    marginBottom: '2rem', padding: '1.25rem', borderRadius: '8px', 
                    background: 'linear-gradient(90deg, rgba(168,85,247,0.05) 0%, rgba(0,0,0,0) 100%)',
                    borderLeft: '3px solid #a855f7'
                }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <ShieldAlert size={18} color="#a855f7" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Unlock Enterprise Delivery Mechanics</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0, maxWidth: '800px' }}>
                                Your project is currently operating within the shared global Resend tier. Configure your personal Resend API Key in <strong>Project Settings → Mail</strong> to establish dedicated DKIM authority, capture instant webhook callbacks, and provision external Audiences/Broadcast engines.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', gap: '8px' }}>
                <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={Send} label="Delivery Logs" count={logs.length} />
                <TabButton active={activeTab === 'audiences'} onClick={() => setActiveTab('audiences')} icon={Users} label="Audiences & Contacts" locked={!isByok} />
                <TabButton active={activeTab === 'broadcasts'} onClick={() => setActiveTab('broadcasts')} icon={Radio} label="Marketing Broadcasts" locked={!isByok} />
            </div>

            {/* TAB 1: DELIVERY LOGS */}
            {activeTab === 'logs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <SectionHeader title="Outbound History" style={{ marginBottom: 0 }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Showing last 50 background queue dispatches</span>
                    </div>

                    <div className="glass-card" style={{ borderRadius: '8px', overflow: 'hidden', padding: 0 }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)' }}>
                                    <tr>
                                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Subject</th>
                                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Recipient</th>
                                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Provider ID</th>
                                        <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Sent At</th>
                                        <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'center' }}>Inspect</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length > 0 ? logs.map(log => (
                                        <tr key={log._id} style={{ borderTop: '1px solid var(--color-border)' }} className="log-row">
                                            <td style={{ padding: '12px 20px' }}>
                                                <span style={{
                                                    color: STATUS_COLORS[log.status] || '#94a3b8',
                                                    background: `${STATUS_COLORS[log.status] || '#94a3b8'}15`,
                                                    padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.65rem',
                                                    textTransform: 'uppercase', border: `1px solid ${STATUS_COLORS[log.status] || '#94a3b8'}30`
                                                }}>
                                                    {log.status || 'sent'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 20px', fontWeight: 600, color: '#fff', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {log.subject || '—'}
                                            </td>
                                            <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                                                {log.to?.join(', ') || '—'}
                                            </td>
                                            <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.8 }}>
                                                {log.resendEmailId ? `${log.resendEmailId.slice(0, 12)}...` : 'N/A'}
                                            </td>
                                            <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                                {new Date(log.sentAt).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleViewLiveStatus(log)}
                                                    disabled={!log.resendEmailId}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '4px 8px', height: 'auto', color: 'var(--color-primary)' }}
                                                    title="Query active status from Resend edge"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                No sent emails logged yet. Trigger mail pipelines via <code>/api/mail/send</code> or SDK events.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: AUDIENCES & CONTACTS */}
            {activeTab === 'audiences' && isByok && (
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }}>
                    
                    {/* Left pane: Audiences List */}
                    <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Audiences</h3>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{audiences.length} total</span>
                        </div>

                        {/* Audience Selector list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                            {audiences.length > 0 ? audiences.map(aud => (
                                <div 
                                    key={aud.id}
                                    onClick={() => setSelectedAudienceId(aud.id)}
                                    style={{
                                        padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
                                        background: selectedAudienceId === aud.id ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.015)',
                                        border: `1px solid ${selectedAudienceId === aud.id ? '#a855f7' : 'rgba(255,255,255,0.04)'}`,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedAudienceId === aud.id ? '#fff' : 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {aud.name}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--color-text-muted)', opacity: 0.6 }}>
                                            ID: {aud.id.slice(0, 8)}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteAudience(aud.id); }}
                                        style={{ background: 'none', border: 'none', color: '#ea5455', cursor: 'pointer', padding: '4px', opacity: selectedAudienceId === aud.id ? 1 : 0.4 }}
                                        title="Delete Audience"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )) : (
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0', margin: 0 }}>No remote audiences found</p>
                            )}
                        </div>

                        {/* Create new audience form */}
                        <form onSubmit={handleCreateAudience} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                                Provision Audience
                            </label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                    type="text"
                                    placeholder="e.g. Beta Subscribers"
                                    value={newAudienceName}
                                    onChange={(e) => setNewAudienceName(e.target.value)}
                                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff' }}
                                />
                                <button 
                                    type="submit" 
                                    disabled={creatingAudience || !newAudienceName.trim()}
                                    className="btn btn-primary"
                                    style={{ padding: '0 10px', height: 'auto', borderRadius: '4px' }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right pane: Active Contacts inside Audience */}
                    <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '8px' }}>
                        {selectedAudienceId ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Audience Contacts</h3>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>Synced live with provider edge endpoint</p>
                                    </div>
                                    <button onClick={() => fetchContacts(selectedAudienceId)} className="btn btn-ghost" style={{ fontSize: '0.7rem', height: '28px' }}>
                                        <RefreshCw size={12} /> Sync
                                    </button>
                                </div>

                                {/* Add Contact Quick Form */}
                                <form onSubmit={handleCreateContact} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.015)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <input
                                        type="email"
                                        required
                                        placeholder="user@example.com"
                                        value={newContactEmail}
                                        onChange={(e) => setNewContactEmail(e.target.value)}
                                        style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={newContactFirstName}
                                        onChange={(e) => setNewContactFirstName(e.target.value)}
                                        style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={newContactLastName}
                                        onChange={(e) => setNewContactLastName(e.target.value)}
                                        style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff' }}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={creatingContact || !newContactEmail.trim()}
                                        className="btn btn-primary"
                                        style={{ padding: '0 12px', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <UserPlus size={12} /> {creatingContact ? 'Adding...' : 'Add'}
                                    </button>
                                </form>

                                {/* Contacts Table */}
                                <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
                                        <thead style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)' }}>
                                            <tr>
                                                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Email</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Name</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Created</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Remove</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contacts.length > 0 ? contacts.map(c => (
                                                <tr key={c.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '10px 14px', fontWeight: 600, fontFamily: 'monospace' }}>{c.email}</td>
                                                    <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}` : '—'}</td>
                                                    <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                                                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                                        <button 
                                                            onClick={() => handleDeleteContact(c.id)}
                                                            style={{ background: 'none', border: 'none', color: '#ea5455', cursor: 'pointer', opacity: 0.7 }}
                                                            title="Delete Contact"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                        No contacts enrolled in this segment yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <Users size={32} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                <p style={{ fontSize: '0.8rem', margin: 0 }}>Select or create an Audience segment on the left to manage target contacts.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: MARKETING BROADCASTS */}
            {activeTab === 'broadcasts' && isByok && (
                <div className="glass-card" style={{ padding: '2rem', borderRadius: '8px', maxWidth: '800px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <Radio size={20} color="#a855f7" />
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Mass Broadcast Campaign</h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Deploy promotional bundles instantly directly across selected external target audiences.</p>
                        </div>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '6px', marginBottom: '2rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <AlertCircle size={16} color="#a855f7" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <strong>Pro Tier Prerequisite:</strong> Broadcasting engines run massive multi-worker chunks and strictly demand active Pro entitling alongside personal BYOK keys.
                        </span>
                    </div>

                    <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Target Audience Segment</label>
                            <select
                                required
                                value={broadcastAudienceId}
                                onChange={(e) => setBroadcastAudienceId(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                            >
                                <option value="">-- Choose Target Segment --</option>
                                {audiences.map(aud => (
                                    <option key={aud.id} value={aud.id}>{aud.name} ({aud.id})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Campaign Subject Line</label>
                            <input
                                type="text"
                                required
                                placeholder="🚀 Welcome to the new era of urBackend BaaS Platform!"
                                value={broadcastSubject}
                                onChange={(e) => setBroadcastSubject(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Rich HTML Content / Payload</label>
                            <textarea
                                rows={8}
                                required
                                placeholder="<h1>Exciting announcements!</h1><p>Enjoy fully localized RLS boundaries and zero dependency overhead.</p>"
                                value={broadcastHtml}
                                onChange={(e) => setBroadcastHtml(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button
                                type="submit"
                                disabled={sendingBroadcast}
                                className="btn btn-primary"
                                style={{ background: '#a855f7', color: '#fff', border: 'none', padding: '0 24px', height: '36px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Send size={14} className={sendingBroadcast ? 'spin' : ''} />
                                {sendingBroadcast ? 'Deploying Broadcast Stream...' : 'Deploy Mass Campaign'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* LIVE STATUS INSPECT MODAL */}
            {selectedLog && liveStatusLoading && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" />
                </div>
            )}

            {selectedLog && liveStatusData && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', 
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="glass-card" style={{ maxWidth: '650px', width: '100%', padding: '1.5rem', borderRadius: '8px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Live Provider Delivery Matrix</h3>
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>Resolved raw record queried straight from Resend REST Edge</p>
                            </div>
                            <button onClick={() => { setSelectedLog(null); setLiveStatusData(null); }} className="btn btn-ghost" style={{ padding: '4px', height: 'auto' }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)' }}>Status: </span>
                                <strong style={{ color: STATUS_COLORS[liveStatusData.last_event] || '#10b981', textTransform: 'uppercase' }}>{liveStatusData.last_event || 'delivered'}</strong>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)' }}>ID: </span>
                                <code style={{ color: 'var(--color-primary)' }}>{liveStatusData.id}</code>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)' }}>To: </span>
                                <strong>{liveStatusData.to?.join(', ')}</strong>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-text-muted)' }}>Created At: </span>
                                <span>{new Date(liveStatusData.created_at).toLocaleString()}</span>
                            </div>
                        </div>

                        <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>Raw JSON Metadata Response</label>
                        <pre style={{ 
                            background: '#000', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-border)',
                            fontSize: '0.7rem', fontFamily: 'monospace', color: '#e2e8f0', overflowY: 'auto', flex: 1, margin: 0
                        }}>
                            {JSON.stringify(liveStatusData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .log-row:hover { background: rgba(255,255,255,0.015); }
                .spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-left-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}

/* eslint-disable-next-line */
function TabButton({ active, onClick, icon: Icon, label, count, locked }) {
    return (
        <button
            onClick={locked ? () => toast.error("Configure Bring-Your-Own-Key custom Resend account to access this tool") : onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: 'none', borderBottom: `2px solid ${active ? '#a855f7' : 'transparent'}`,
                color: active ? '#fff' : 'var(--color-text-muted)',
                fontSize: '0.8rem', fontWeight: active ? 600 : 500, cursor: 'pointer',
                transition: 'all 0.2s', opacity: locked ? 0.5 : 1
            }}
        >
            <Icon size={16} color={active ? '#a855f7' : 'currentColor'} />
            <span>{label}</span>
            {count !== undefined && (
                <span style={{ fontSize: '0.65rem', background: active ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)', color: active ? '#c084fc' : 'currentColor', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>
                    {count}
                </span>
            )}
            {locked && <span style={{ fontSize: '0.65rem', color: '#f59e0b' }}>🔒 BYOK</span>}
        </button>
    );
}
