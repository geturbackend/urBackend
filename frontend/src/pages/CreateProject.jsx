import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { API_URL } from '../config';


function CreateProject() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [newProject, setNewProject] = useState(null);

    const { token, user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?.isVerified) {
            toast.error(
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span>Account Verification Required</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        Please verify your account in Settings first.
                    </span>
                    <button
                        onClick={() => navigate('/settings')}
                        style={{
                            marginTop: '5px',
                            background: '#fff',
                            color: '#333',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Settings
                    </button>
                </div>,
                { duration: 5000 }
            );
            return;
        }

        if (!name) return toast.error("Project Name is required");

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/projects`,
                { name, description },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewProject(res.data);
            toast.success("Project Created!");
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to create project";
            toast.error(typeof errorMsg === 'object' ? "Validation Error" : errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    // --- SUCCESS VIEW (API KEY) ---
    if (newProject) {
        return (
            <div className="container" style={{ maxWidth: '600px', paddingTop: '4rem', paddingBottom: '4rem' }}>
                <div className="card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))' }}>
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
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Project Created!</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}><strong>{newProject.name}</strong> has been successfully initialized.</p>
                    </div>

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
                            <div className="input-field" style={{ fontFamily: 'monospace', backgroundColor: '#111', color: 'var(--color-primary)', overflowX: 'auto', whiteSpace: 'nowrap', flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}>
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
                            <div className="input-field" style={{ fontFamily: 'monospace', backgroundColor: '#111', color: '#ef4444', overflowX: 'auto', whiteSpace: 'nowrap', flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.95rem' }}>
                                {newProject.secretKey}
                            </div>
                            <button onClick={() => copyToClipboard(newProject.secretKey)} className="btn btn-secondary" style={{ height: 'auto', padding: '0 15px', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }} title="Copy Secret API Key"><Copy size={18} /></button>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '1rem', fontWeight: 600 }}
                    >
                        I have saved the key, Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // --- FORM VIEW ---
    return (
        <div className="container" style={{ maxWidth: '600px', paddingTop: '3rem' }}>
            <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-ghost"
                style={{ marginBottom: '1.5rem', paddingLeft: 0, color: 'var(--color-text-muted)' }}
            >
                <ArrowLeft size={18} style={{ marginRight: '5px' }} /> Back to Dashboard
            </button>

            <div className="card" style={{ padding: '2.5rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', background: 'rgba(62, 207, 142, 0.1)', borderRadius: '8px', display: 'flex' }}>
                            <Plus size={24} color="var(--color-primary)" />
                        </div>
                        Create New Project
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginLeft: '50px' }}>
                        Initialize a new backend project with database and storage.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontSize: '0.95rem' }}>Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                            placeholder="e.g. E-commerce API"
                            autoFocus
                            style={{ padding: '12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: '#fff' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label" style={{ fontSize: '0.95rem' }}>Description <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field"
                            style={{ minHeight: '120px', resize: 'vertical', padding: '12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', color: '#fff', lineHeight: '1.5' }}
                            placeholder="Describe your project's purpose..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateProject;