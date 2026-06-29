import { useState } from 'react';
import api from '../utils/api';
import { useOnboarding } from '../context/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, CheckCircle, AlertTriangle, Plus, Lock } from 'lucide-react';


function CreateProject() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [provisionAuth, setProvisionAuth] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newProject, setNewProject] = useState(null);

    const { completeStep, setActiveProjectId } = useOnboarding();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isVerified = !!user?.isVerified;

    const goToVerification = () => {
        navigate('/verify-otp', {
            state: {
                email: user?.email,
                from: '/create-project'
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isVerified) return;
        if (!name) return toast.error("Project Name is required");
        if (loading) return;

        setLoading(true);
        try {
            const res = await api.post(`/api/projects`,
                { name, description }
            );
            const projectId = res.data?._id;
            
            if (provisionAuth && projectId) {
                // Auto provision the users collection
                const usersSchema = [
                    { key: 'email', type: 'String', required: true },
                    { key: 'password', type: 'String', required: true },
                    { key: 'username', type: 'String', required: false },
                    { key: 'emailVerified', type: 'Boolean', required: false }
                ];
                await api.post(`/api/projects/${projectId}/collections`, {
                    projectId,
                    collectionName: 'users',
                    schema: usersSchema
                });
            }

            setNewProject(res.data);
            setActiveProjectId(projectId);
            toast.success("Project Created!");
            completeStep('create_project');
            if (!res.data?.apiKeysLocked) completeStep('get_api_key');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.message || "Failed to create project";
            toast.error(typeof errorMsg === 'object' ? "Validation Error" : errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const downloadEnvFile = () => {
        if (!newProject) return;
        if (!newProject.publishableKey || !newProject.secretKey) {
            toast.error("Verify your email to reveal API keys.");
            return;
        }
        const envContent = `URBACKEND_PROJECT_ID=${newProject._id}\nURBACKEND_PUBLISHABLE_KEY=${newProject.publishableKey}\nURBACKEND_SECRET_KEY=${newProject.secretKey}\n`;
        const blob = new Blob([envContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '.env.local';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(".env file downloaded!");
    };

    // --- SUCCESS VIEW (API KEY) ---
    if (newProject) {
        return (
            <div className="container" style={{ maxWidth: '600px', paddingTop: '4rem', paddingBottom: '4rem' }}>
                <div style={{ padding: '0', background: 'transparent' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <CheckCircle size={40} color="var(--color-success)" />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Project Created!</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}><strong style={{ color: 'var(--color-text-main)' }}>{newProject.name}</strong> has been successfully initialized.</p>
                    </div>

                    {newProject.apiKeysLocked ? (
                        <div style={{ backgroundColor: 'rgba(62, 207, 142, 0.08)', border: '1px solid rgba(62, 207, 142, 0.25)', borderRadius: '8px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '15px' }}>
                            <AlertTriangle color="var(--color-primary)" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>Your backend is ready</strong>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    Create a collection next. API keys unlock after email verification.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '15px' }}>
                                <AlertTriangle color="#ef4444" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px' }}>Save these API Keys immediately</strong>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        For security reasons, these keys will <strong>only be shown once</strong>. If you lose them, you will need to regenerate them.
                                    </p>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ color: 'var(--color-primary)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Publishable API Key (Frontend safe)</span>
                                </label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                    <div className="input-field" style={{ fontFamily: 'monospace', backgroundColor: 'var(--color-bg-input)', color: 'var(--color-primary)', overflowX: 'auto', whiteSpace: 'nowrap', flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}>
                                        {newProject.publishableKey}
                                    </div>
                                    <button onClick={() => copyToClipboard(newProject.publishableKey)} className="btn btn-secondary" title="Copy Publishable API Key" style={{ height: 'auto', padding: '0 15px' }}><Copy size={18} /></button>
                                </div>
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="form-label" style={{ color: '#ef4444', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Secret API Key (Backend only)</span>
                                </label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                    <div className="input-field" style={{ fontFamily: 'monospace', backgroundColor: 'var(--color-bg-input)', color: '#ef4444', overflowX: 'auto', whiteSpace: 'nowrap', flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.95rem' }}>
                                        {newProject.secretKey}
                                    </div>
                                    <button onClick={() => copyToClipboard(newProject.secretKey)} className="btn btn-secondary" style={{ height: 'auto', padding: '0 15px', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Copy Secret API Key"><Copy size={18} /></button>
                                </div>
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button
                            onClick={downloadEnvFile}
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '14px', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 600 }}
                        >
                            Download .env
                        </button>
                        <button
                            onClick={() => navigate(newProject.apiKeysLocked ? `/project/${newProject._id}/create-collection` : '/dashboard')}
                            className="btn btn-primary"
                            style={{ flex: 2, padding: '14px', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 600 }}
                        >
                            {newProject.apiKeysLocked ? 'Create Collection' : 'Go to Dashboard'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- FORM VIEW ---
    return (
        <div className="container" style={{ maxWidth: '640px', paddingTop: '3rem', paddingBottom: '3rem' }}>
            <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-ghost"
                style={{ marginBottom: '2rem', paddingLeft: 0, color: 'var(--color-text-muted)' }}
            >
                <ArrowLeft size={18} style={{ marginRight: '5px' }} /> Back to Dashboard
            </button>

            <div style={{ padding: '0', background: 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '1.75rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(62, 207, 142, 0.1)', borderRadius: '10px', display: 'flex' }}>
                        <Plus size={24} color="var(--color-primary)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>
                            Create New Project
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.4rem', marginBottom: 0 }}>
                            Initialize a new backend project with database, auth, and storage ready to go.
                        </p>
                    </div>
                </div>

                <div style={{ padding: '1rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: '1.75rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-text-main)' }}>Project Details</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Add a clear name so it’s easy to find in the dashboard.</div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                            placeholder="e.g. E-commerce API"
                            autoFocus
                            style={{ padding: '12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: '6px' }}
                        />
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                            This appears on your dashboard and in API settings.
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>Description <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field"
                            style={{ minHeight: '120px', resize: 'vertical', padding: '12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: '6px', lineHeight: '1.5' }}
                            placeholder="Describe your project's purpose..."
                        />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={provisionAuth}
                                onChange={(e) => setProvisionAuth(e.target.checked)}
                                style={{ accentColor: 'var(--color-primary)', transform: 'scale(1.2)' }}
                            />
                            <div>
                                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Include standard Users collection for Authentication</span>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>Automatically configures a ready-to-use users table for signup and login.</p>
                            </div>
                        </label>
                    </div>

                    {!isVerified && (
                        <div
                            role="status"
                            aria-live="polite"
                            style={{
                                border: '1px solid rgba(255, 193, 7, 0.25)',
                                background: 'rgba(255, 193, 7, 0.08)',
                                borderRadius: '8px',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px'
                            }}
                        >
                            <Lock size={20} color="#FFC107" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#FFC107', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    Verify your email to unlock project creation.
                                </div>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                                    Verification protects the platform from abuse and unlocks projects, API keys, and production API access.
                                </p>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {!isVerified && (
                            <button
                                type="button"
                                onClick={goToVerification}
                                className="btn btn-secondary"
                                style={{ padding: '12px 18px', fontSize: '0.95rem', fontWeight: 600 }}
                            >
                                Verify Email
                            </button>
                        )}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !isVerified}
                            aria-disabled={loading || !isVerified}
                            style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
                        >
                            {loading ? 'Creating...' : isVerified ? 'Create Project' : 'Create Project Locked'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateProject;
