import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import toast from 'react-hot-toast';
import {
    Database, Key, Copy, RefreshCw, AlertTriangle,
    Layers, ArrowRight, Activity, Server, ShieldCheck, Code2
} from 'lucide-react';
import { PUBLIC_API_URL } from '../config';

import AnalyticsChart from '../components/ProjectDetails/AnalyticsChart';
import QuickStartTabs from '../components/ProjectDetails/QuickStartTabs';
import ProjectLogs from '../components/ProjectDetails/ProjectLogs';
import SectionHeader from '../components/Dashboard/SectionHeader';

function ProjectDetails() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { completeStep, setActiveProjectId } = useOnboarding();

    const [project, setProject] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState(null);

    useEffect(() => {
        Promise.resolve().then(() => {
            completeStep('get_api_key');
            setActiveProjectId(projectId);
        });
    }, [completeStep, setActiveProjectId, projectId]);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const [projectRes, analyticsRes] = await Promise.all([
                    api.get(`/api/projects/${projectId}`),
                    api.get(`/api/projects/${projectId}/analytics`)
                ]);
                if (isMounted) {
                    setProject(projectRes.data);
                    setAnalytics(analyticsRes.data);
                }
            } catch (err){
                toast.error("Failed to load project details");
                console.error(err)
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [projectId, user]);

    const handleRegenerateKey = async (keyType) => {
        if (!window.confirm(`Roll your ${keyType} key? Old key will expire.`)) return;
        try {
            const res = await api.post(`/api/projects/${projectId}/api-key`, { keyType });
            setNewKey({ key: res.data.apiKey, type: keyType });
            toast.success("New Key Generated!");
        } catch {
            toast.error("Failed to regenerate key");
        }
    };

    if (loading) return (
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)', gap: '10px' }}>
            <div className="spinner"></div>
        </div>
    );

    if (!project) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Project not found</div>;

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            
            {/* New Key Modal */}
            {newKey && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div className="glass-card" style={{ maxWidth: '450px', width: '90%', padding: '2rem', borderRadius: '12px', border: `1px solid ${newKey.type === 'secret' ? '#ef4444' : 'var(--color-primary)'}` }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>New {newKey.type} Key</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Copy this now. It won't be shown again.</p>
                        </div>
                        <code style={{ display: 'block', padding: '12px', background: '#000', borderRadius: '6px', fontSize: '0.85rem', wordBreak: 'break-all', marginBottom: '1.5rem', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}>{newKey.key}</code>
                        <button onClick={() => setNewKey(null)} className="btn btn-primary" style={{ width: '100%' }}>I've copied it</button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(62, 207, 142, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(62, 207, 142, 0.1)' }}>
                        <Server size={20} color="#3ECF8E" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{project.name}</h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Project ID: {project._id}</p>
                    </div>
                </div>
                <button onClick={() => navigate(`/project/${projectId}/settings`)} className="btn btn-secondary" style={{ fontSize: '0.8rem', height: '32px' }}>Settings</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
                
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    
                    {/* Analytics Section */}
                    <section>
                        <SectionHeader title="Traffic Overview" />
                        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Traffic (24h)</span>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{analytics?.rangeStats?.totalRequests || 0}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Database Used</span>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a78bfa' }}>{(project.databaseUsed / (1024 * 1024)).toFixed(2)} MB</div>
                                </div>
                            </div>
                            <AnalyticsChart data={analytics?.timeSeries} />
                        </div>
                    </section>

                    {/* Quick Start Section */}
                    <section>
                        <SectionHeader title="Quick Start" />
                        <QuickStartTabs projectId={projectId} publicUrl={PUBLIC_API_URL} />
                    </section>

                    {/* Collections Section */}
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.8 }}>Collections</h2>
                            <button onClick={() => navigate(`/project/${projectId}/create-collection`)} className="btn btn-primary" style={{ height: '28px', fontSize: '0.75rem', padding: '0 10px' }}>+ New</button>
                        </div>
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            {project.collections.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>No collections found.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                                        <tr>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Fields</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {project.collections.map(c => (
                                            <tr key={c._id} onClick={() => navigate(`/project/${projectId}/database?collection=${c.name}`)} style={{ cursor: 'pointer', borderTop: '1px solid var(--color-border)' }} className="hover-row">
                                                <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 500 }}>{c.name}</td>
                                                <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{c.model.length} fields</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}><ArrowRight size={14} color="var(--color-text-muted)" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    
                    {/* API Config / Keys */}
                    <section>
                        <SectionHeader title="API Credentials" />
                        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Publishable Key</label>
                                    <button onClick={() => handleRegenerateKey('publishable')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.7rem', cursor: 'pointer' }}>Roll</button>
                                </div>
                                <div style={{ display: 'flex', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <input readOnly value="pk_live_••••••••" type="password" style={{ flex: 1, background: 'transparent', border: 'none', color: '#666', padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
                                    <button onClick={() => toast.error("Roll key to view new value")} style={{ background: 'none', border: 'none', padding: '0 10px', color: '#555' }}><Copy size={12} /></button>
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }}>Secret Key</label>
                                    <button onClick={() => handleRegenerateKey('secret')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.7rem', cursor: 'pointer' }}>Roll</button>
                                </div>
                                <div style={{ display: 'flex', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <input readOnly value="sk_live_••••••••" type="password" style={{ flex: 1, background: 'transparent', border: 'none', color: '#666', padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
                                    <button onClick={() => toast.error("Roll key to view new value")} style={{ background: 'none', border: 'none', padding: '0 10px', color: '#555' }}><Copy size={12} /></button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Logs Section */}
                    <section>
                        <SectionHeader title="Recent Activity" />
                        <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px' }}>
                            <ProjectLogs logs={analytics?.logs?.slice(0, 5)} />
                            <button onClick={() => navigate(`/project/${projectId}/analytics`)} className="btn btn-ghost" style={{ width: '100%', marginTop: '1rem', fontSize: '0.7rem', opacity: 0.6 }}>View Detailed Logs</button>
                        </div>
                    </section>
                </div>
            </div>

            <style>{`
                .hover-row:hover { background: rgba(255,255,255,0.02); }
                .hover-row:hover td { color: var(--color-primary); }
                .spinner { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-left-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default ProjectDetails;
