import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Database, Key, Copy, RefreshCw, AlertTriangle,
    Layers, ArrowRight, Activity, Server, ShieldCheck
} from 'lucide-react';
import { API_URL } from '../config';

function ProjectDetails() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState(null);
    const [isRegenerating, setIsRegenerating] = useState(null); // 'publishable', 'secret', or null

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/projects/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProject(res.data);
            } catch {
                toast.error("Failed to load project details");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId, token]);

    const handleRegenerateKey = async (keyType) => {
        if (!window.confirm(`Are you sure you want to roll your ${keyType} key? The old key will stop working immediately.`)) return;

        setIsRegenerating(keyType);
        try {
            const res = await axios.patch(`${API_URL}/api/projects/${projectId}/regenerate-key`, { keyType }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewKey({ key: res.data.apiKey, type: keyType });
            toast.success(`New ${keyType === 'publishable' ? 'Publishable' : 'Secret'} API Key Generated!`);
        } catch {
            toast.error("Failed to regenerate key");
        } finally {
            setIsRegenerating(null);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    if (loading) return (
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)', gap: '10px' }}>
            <div className="spinner"></div> Loading project...
        </div>
    );

    if (!project) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Project not found</div>;

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* --- NEW KEY MODAL --- */}
            {newKey && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%', border: `1px solid ${newKey.type === 'secret' ? '#ef4444' : 'var(--color-primary)'}`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: '50px', height: '50px', background: newKey.type === 'secret' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(62, 207, 142, 0.1)', color: newKey.type === 'secret' ? '#ef4444' : 'var(--color-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                <Key size={24} />
                            </div>
                            <h2 style={{ color: '#fff', marginBottom: '10px', fontSize: '1.5rem' }}>New {newKey.type === 'publishable' ? 'Publishable' : 'Secret'} Key Generated</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Please copy this key immediately. For security reasons, it will not be displayed again.
                            </p>
                        </div>
                        <div style={{ position: 'relative', marginBottom: '2rem' }}>
                            <code style={{
                                display: 'block',
                                padding: '1rem',
                                background: 'var(--color-bg-input)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                color: newKey.type === 'secret' ? '#ef4444' : '#3ECF8E',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all',
                                fontSize: '0.9rem'
                            }}>
                                {newKey.key}
                            </code>
                            <button
                                onClick={() => copyToClipboard(newKey.key)}
                                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                title="Copy"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                        <button onClick={() => setNewKey(null)} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                            I have copied it safely
                        </button>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="page-header" style={{ marginBottom: '3rem', borderBottom: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(62, 207, 142, 0.1), rgba(0,0,0,0))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(62, 207, 142, 0.1)' }}>
                            <Server size={28} color="#3ECF8E" />
                        </div>
                        <div>
                            <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '4px', letterSpacing: '-0.02em' }}>{project.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3ECF8E', background: 'rgba(62, 207, 142, 0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600, border: '1px solid rgba(62, 207, 142, 0.1)' }}>
                                    <span style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%' }}></span> Active
                                </span>
                                <span style={{ color: 'var(--color-text-muted)' }}>ID: {project._id}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button onClick={() => navigate(`/project/${projectId}/settings`)} className="btn btn-secondary">
                            Project Settings
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                {/* --- API CONFIGURATION --- */}
                <div style={{ order: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-main)' }}>
                        <ShieldCheck size={20} color="var(--color-primary)" /> API Config
                    </h3>
                    <div className="card">
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                                API Endpoint
                            </label>
                            <div className="input-group" style={{ display: 'flex', background: 'var(--color-bg-input)', borderRadius: '6px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                                <div style={{ padding: '10px 14px', color: '#666', borderRight: '1px solid var(--color-border)', fontSize: '0.9rem', userSelect: 'none', background: 'rgba(255,255,255,0.02)' }}>POST</div>
                                <input
                                    readOnly
                                    value={`${API_URL}/api/data/{collection}`}
                                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-text-main)', padding: '10px', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none' }}
                                />
                                <button onClick={() => copyToClipboard(`${API_URL}/api/data`)} style={{ background: 'transparent', border: 'none', color: '#666', padding: '0 12px', cursor: 'pointer', transition: 'color 0.2s' }}>
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                                    Publishable API Key
                                </label>
                                <button onClick={() => handleRegenerateKey('publishable')} disabled={!!isRegenerating} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <RefreshCw size={12} className={isRegenerating === 'publishable' ? "spin" : ""} /> Roll Key
                                </button>
                            </div>
                            <div className="input-group" style={{ display: 'flex', background: 'var(--color-bg-input)', borderRadius: '6px', border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: '8px' }}>
                                <div style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', color: '#555', borderRight: '1px solid var(--color-border)' }}><Key size={16} /></div>
                                <input readOnly value="pk_live_••••••••••••••••••••••••" type="password" style={{ flex: 1, background: 'transparent', border: 'none', color: '#666', padding: '10px', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none', letterSpacing: '2px' }} />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Safe for frontend use (React, Next.js). Read-only access.</p>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#ef4444', fontWeight: 500 }}>
                                    Secret API Key
                                </label>
                                <button onClick={() => handleRegenerateKey('secret')} disabled={!!isRegenerating} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <RefreshCw size={12} className={isRegenerating === 'secret' ? "spin" : ""} /> Roll Key
                                </button>
                            </div>
                            <div className="input-group" style={{ display: 'flex', background: 'var(--color-bg-input)', borderRadius: '6px', border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: '12px' }}>
                                <div style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', color: '#555', borderRight: '1px solid var(--color-border)' }}><Key size={16} /></div>
                                <input readOnly value="sk_live_••••••••••••••••••••••••" type="password" style={{ flex: 1, background: 'transparent', border: 'none', color: '#666', padding: '10px', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none', letterSpacing: '2px' }} />
                            </div>
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <AlertTriangle size={16} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8rem', color: '#ef4444', lineHeight: '1.4' }}>Grants full write/delete access. Keep secure in your backend (.env).</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- COLLECTIONS --- */}
                <div style={{ order: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-main)' }}>
                            <Database size={20} color="var(--color-primary)" /> Collections
                        </h3>
                        <button
                            onClick={() => navigate(`/project/${projectId}/create-collection`)}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.85rem', height: 'auto' }}
                        >
                            + New Collection
                        </button>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
                        {project.collections.length === 0 ? (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                                    <Layers size={24} color="#555" />
                                </div>
                                <h4 style={{ color: 'var(--color-text-main)', marginBottom: '5px' }}>No Data Yet</h4>
                                <p style={{ fontSize: '0.9rem', maxWidth: '200px' }}>Create a collection to start storing JSON documents.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-input)' }}>
                                            <th style={{ padding: '16px', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: '16px', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Schema</th>
                                            <th style={{ padding: '16px', textAlign: 'right' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {project.collections.map(c => (
                                            <tr key={c._id} className="collection-row" onClick={() => navigate(`/project/${projectId}/database?collection=${c.name}`)}>
                                                <td style={{ padding: '16px', fontWeight: 500, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Database size={16} color="var(--color-text-muted)" className="row-icon" /> {c.name}
                                                </td>
                                                <td style={{ padding: '16px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                    {c.model.length} fields defined
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                                                    <ArrowRight size={16} className="row-arrow" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .collection-row {
                    border-bottom: 1px solid var(--color-border);
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .collection-row:last-child {
                    border-bottom: none;
                }
                .collection-row:hover {
                    background: var(--color-bg-input);
                }
                .collection-row:hover td {
                    color: var(--color-text-main);
                }
                .collection-row:hover .row-icon, 
                .collection-row:hover .row-arrow {
                    color: var(--color-primary) !important;
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.1);
                    border-left-color: var(--color-primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

export default ProjectDetails;