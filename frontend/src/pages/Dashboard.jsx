import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Folder, Server, ArrowRight, Activity, Database, HardDrive, Zap } from 'lucide-react';
import { API_URL } from '../config';

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/projects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(response.data);
            } catch (err) {
                console.error(err);
                toast.error("Could not load projects.");
            } finally {
                setIsLoading(false);
            }
        };

        if (token) fetchProjects();
    }, [token]);

     const SkeletonLoader = () => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}
        >
            {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ padding: '1.5rem' }}>
                    <div className="skeleton skeleton-text" style={{ width: '50%', height: '14px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '100%', height: '22px', marginTop: '10px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '80%', height: '14px', marginTop: '8px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '60%', height: '14px', marginTop: '12px' }} />
                </div>
            ))}
        </div>
    );

    // Inline Styles for Cards to match Landing Page aesthetic
    const cardStyle = {
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.5rem',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
    };

    return (
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* Header Section */}
            <div className="page-header" style={{ marginBottom: '3rem', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Overview</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                        Welcome back! Here's what's happening with your projects.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/create-project')}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem', gap: '8px', boxShadow: '0 4px 14px 0 rgba(62, 207, 142, 0.3)' }}
                >
                    <Plus size={18} /> New Project
                </button>
            </div>

            {/* Stats Row */}
            {projects.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Total Projects</span>
                            <div style={{ background: 'rgba(62, 207, 142, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                <Folder size={20} />
                            </div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{projects.length}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>System Status</span>
                            <div style={{ background: 'rgba(62, 207, 142, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                <Activity size={20} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3ECF8E', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#3ECF8E', boxShadow: '0 0 10px #3ECF8E' }}></span>
                            Operational
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Current Plan</span>
                            <div style={{ background: 'rgba(255, 189, 46, 0.1)', padding: '8px', borderRadius: '8px', color: '#FFBD2E' }}>
                                <Zap size={20} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ededed' }}>Free Tier</div>
                    </div>
                </div>
            )}

            {/* Projects Grid */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.01em' }}>Your Projects</h2>
                <div style={{ height: '1px', flex: 1, background: 'var(--color-border)' }}></div>
            </div>

             {isLoading ?  (
                < SkeletonLoader /> ) : projects.length === 0 ? (
                <div style={{
                    ...cardStyle,
                    textAlign: 'center',
                    padding: '6rem 2rem',
                    alignItems: 'center',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0) 100%)',
                    borderStyle: 'dashed',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'var(--color-bg-input)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                        border: '1px solid var(--color-border)'
                    }}>
                        <Server size={32} color="var(--color-text-muted)" />
                    </div>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>No projects yet</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '400px', lineHeight: '1.6' }}>
                        Get started by creating your first project. You'll get instant access to a database, authentication, and storage.
                    </p>
                    <button
                        onClick={() => navigate('/create-project')}
                        className="btn btn-primary"
                    >
                        Create Project
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {projects.map((project) => (
                        <Link
                            to={`/project/${project._id}`}
                            key={project._id}
                            className="dashboard-card-link"
                            style={{ textDecoration: 'none' }}
                        >
                            <div className="dashboard-card" style={cardStyle}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <div style={{
                                        width: '48px', height: '48px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, rgba(62, 207, 142, 0.1), rgba(0,0,0,0))',
                                        color: '#3ECF8E',
                                        border: '1px solid rgba(62, 207, 142, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Database size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: 'var(--color-bg-input)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                                        ACTIVE
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                                    {project.name}
                                </h3>

                                <p style={{
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.6',
                                    marginBottom: '2rem',
                                    flex: 1,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {project.description || "A scalable backend project with database and auth."}
                                </p>

                                <div style={{
                                    borderTop: '1px solid var(--color-border)',
                                    paddingTop: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.85rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Database size={16} /> <span>Postgres</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <HardDrive size={16} /> <span>50MB</span>
                                    </div>
                                    <div style={{ marginLeft: 'auto', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500, fontSize: '0.8rem' }}>
                                        View Project <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Add New Project Card (always visible at end of list) */}
                    <button
                        onClick={() => navigate('/create-project')}
                        className="dashboard-card-add"
                        style={{
                            ...cardStyle,
                            background: 'transparent',
                            borderStyle: 'dashed',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            minHeight: '260px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ background: 'var(--color-bg-input)', padding: '16px', borderRadius: '50%', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                            <Plus size={24} />
                        </div>
                        <span style={{ fontWeight: 600 }}>Create New Project</span>
                    </button>
                </div>
            )}

            <style>{`
                .dashboard-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--color-border-hover) !important;
                    background: var(--color-bg-input) !important;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
                }
                .dashboard-card-add:hover {
                    border-color: var(--color-primary) !important;
                    color: var(--color-primary) !important;
                    background: rgba(62, 207, 142, 0.03) !important;
                }
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.1);
                    border-left-color: var(--color-primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                 /* Loading states */
                .skeleton {
                    position: relative;
                    overflow: hidden;
                    background: rgba(255,255,255,0.05);
                    border-radius: 4px;
                }

                .skeleton-text {
                    border-radius: 2px;
                }

                .skeleton::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -150%;
                    width: 150%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255,255,255,0.08),
                        transparent
                    );
                    animation: shimmer 1.8s infinite;
                }

                @keyframes shimmer {
                    100% {
                        left: 50%;
                    }
                }
            `}</style>
        </div>
    );
}