import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, ADMIN_EMAIL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send, ArrowLeft, AlertCircle } from 'lucide-react';

export default function AdminCreateRelease() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        version: '',
        title: '',
        content: ''
    });

    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (!isAdmin) {
            toast.error("Unauthorized access.");
            navigate('/releases');
        }
    }, [isAdmin, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.version || !formData.title || !formData.content) {
            return toast.error("Please fill all fields.");
        }

        setLoading(true);
        const loadToast = toast.loading("Publishing release and queuing emails...");

        try {
            const res = await axios.post(`${API_URL}/api/releases`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismiss(loadToast);
            toast.success(res.data.message);
            navigate('/releases');
        } catch (err) {
            toast.dismiss(loadToast);
            toast.error(err.response?.data?.error || "Failed to publish release.");
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="container" style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
            <button 
                onClick={() => navigate('/releases')}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', fontSize: '1rem' }}
            >
                <ArrowLeft size={18} /> Back to Changelog
            </button>

            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Create New Release</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
                This will be visible on the public changelog and sent to all verified users.
            </p>

            <div style={{ background: 'rgba(255, 189, 46, 0.1)', border: '1px solid #FFBD2E', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <AlertCircle color="#FFBD2E" size={24} />
                <p style={{ fontSize: '0.9rem', color: '#ededed', margin: 0 }}>
                    <strong>Warning:</strong> Emails will be queued immediately upon submission. 
                    Due to rate limits, it may take several hours to reach all users.
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                    <label className="form-label">Version Number (e.g. v1.2.0)</label>
                    <input 
                        type="text" 
                        className="input-field" 
                        placeholder="v1.0.0"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Release Title</label>
                    <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Groundbreaking New Features"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Content (Markdown style descriptions)</label>
                    <textarea 
                        className="input-field" 
                        style={{ minHeight: '300px', resize: 'vertical', paddingTop: '12px' }}
                        placeholder="What changed in this version? Use new lines for separate points."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                    style={{ padding: '14px', marginTop: '10px', fontSize: '1.1rem', justifyContent: 'center', gap: '10px' }}
                >
                    <Send size={20} /> {loading ? "Publishing..." : "Publish & Notify Users"}
                </button>
            </form>
        </div>
    );
}
