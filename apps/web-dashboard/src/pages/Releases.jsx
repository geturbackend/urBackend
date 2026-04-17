import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ADMIN_EMAIL } from '../config';
import { useAuth } from '../context/AuthContext';
import { Rocket, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Releases() {
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const res = await api.get(`/api/releases`);
                setReleases(res.data);
            } catch (err) {
                console.error("Failed to fetch releases", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, []);

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '10px' }}>Changelog</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        The latest updates and improvements to urBackend.
                    </p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => navigate('/admin/create-release')}
                        className="btn btn-primary"
                        style={{ gap: '8px' }}
                    >
                        <Plus size={18} /> New Release
                    </button>
                )}
            </div>

            {loading ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {[1, 2, 3].map(i => (
            <div key={i} className="glass-card" style={{ borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '20px' }} />
                    <div className="skeleton" style={{ width: '120px', height: '14px' }} />
                </div>
                <div className="skeleton" style={{ width: '60%', height: '28px' }} />
                <div className="skeleton" style={{ width: '100%', height: '14px' }} />
                <div className="skeleton" style={{ width: '80%', height: '14px' }} />
                <div className="skeleton" style={{ width: '90%', height: '14px' }} />
            </div>
        ))}
    </div>
) : releases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <Rocket size={48} color="var(--color-text-muted)" style={{ marginBottom: '20px' }} />
                    <h3>No releases yet</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Stay tuned for our first major update!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {releases.map((release) => (
                        <div key={release._id} style={{ position: 'relative', paddingLeft: '30px', borderLeft: '2px solid var(--color-border)' }}>
                            <div style={{ 
                                position: 'absolute', 
                                left: '-9px', 
                                top: '0', 
                                width: '16px', 
                                height: '16px', 
                                borderRadius: '50%', 
                                background: 'var(--color-primary)',
                                boxShadow: '0 0 10px var(--color-primary)'
                            }}></div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                <span style={{ 
                                    background: 'rgba(99, 102, 241, 0.1)', 
                                    color: 'var(--color-primary)', 
                                    padding: '4px 12px', 
                                    borderRadius: '20px', 
                                    fontSize: '0.85rem', 
                                    fontWeight: 600 
                                }}>
                                    {release.version}
                                </span>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={14} /> {new Date(release.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '15px' }}>{release.title}</h2>
                            
                            <div className="markdown-content">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {release.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(99, 102, 241, 0.1);
                    border-radius: 50%;
                    border-top-color: var(--color-primary);
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .markdown-content {
                    color: var(--color-text-muted);
                    line-height: 1.7;
                    font-size: 1.05rem;
                }
                .markdown-content h1, .markdown-content h2, .markdown-content h3 {
                    color: #fff;
                    margin-top: 24px;
                    margin-bottom: 16px;
                    font-weight: 600;
                }
                .markdown-content h1 { font-size: 1.8rem; }
                .markdown-content h2 { font-size: 1.5rem; }
                .markdown-content h3 { font-size: 1.25rem; }
                
                .markdown-content p {
                    margin-bottom: 16px;
                }
                
                .markdown-content ul, .markdown-content ol {
                    padding-left: 20px;
                    margin-bottom: 16px;
                }
                
                .markdown-content li {
                    margin-bottom: 8px;
                }
                
                .markdown-content code {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 0.9em;
                }
                
                .markdown-content pre {
                    background: #1e1e1e;
                    padding: 16px;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin-bottom: 16px;
                    border: 1px solid var(--color-border);
                }
                
                .markdown-content pre code {
                    background: transparent;
                    padding: 0;
                }
                
                .markdown-content blockquote {
                    border-left: 4px solid var(--color-primary);
                    padding-left: 16px;
                    margin: 0 0 16px 0;
                    font-style: italic;
                    color: rgba(255, 255, 255, 0.7);
                }

                .markdown-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 16px;
                }
                .markdown-content th, .markdown-content td {
                    border: 1px solid var(--color-border);
                    padding: 8px 12px;
                    text-align: left;
                }
                .markdown-content th {
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
}
