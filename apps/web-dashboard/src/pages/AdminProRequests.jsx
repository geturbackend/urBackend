import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, Mail, User, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DashboardShell from '../components/Dashboard/DashboardShell';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import SectionHeader from '../components/Dashboard/SectionHeader';

export default function AdminProRequests() {
    const { user, isLoading } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const res = await api.get('/api/billing/admin/pro-requests');
            if (res.data.success) {
                setRequests(res.data.data);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch Pro requests");
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (user?.isAdmin) {
            fetchData();
        }
    }, [user]);

    const handleApprove = async (requestId) => {
        if (!window.confirm("Are you sure you want to approve this request and upgrade the user to Pro?")) return;

        setActionLoading(requestId);
        try {
            const res = await api.post('/api/billing/admin/approve-pro', { requestId });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchData(); // Refresh list
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to approve request");
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) return null;
    if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

    return (
        <DashboardShell>
            <DashboardHeader />
            <SectionHeader title={`Pro Requests Management`} />
            
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '12px' }}>
                {loadingData ? (
                    <p>Loading requests...</p>
                ) : requests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Info size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No Pro requests found.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '12px 1rem' }}>User</th>
                                    <th style={{ padding: '12px 1rem' }}>Bio / Use Case</th>
                                    <th style={{ padding: '12px 1rem' }}>Status</th>
                                    <th style={{ padding: '12px 1rem' }}>Requested At</th>
                                    <th style={{ padding: '12px 1rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' }}>
                                        <td style={{ padding: '12px 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Mail size={14} color="#888" />
                                                <span style={{ fontWeight: 600 }}>{req.email}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 1rem', maxWidth: '300px' }}>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc', lineHeight: '1.4' }}>
                                                {req.bio}
                                            </p>
                                        </td>
                                        <td style={{ padding: '12px 1rem' }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '4px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                background: req.status === 'pending' ? 'rgba(255, 165, 0, 0.1)' : req.status === 'approved' ? 'rgba(0, 245, 212, 0.1)' : 'rgba(255, 95, 86, 0.1)',
                                                color: req.status === 'pending' ? '#ffa500' : req.status === 'approved' ? '#00f5d4' : '#ff5f56'
                                            }}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={12} />
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 1rem' }}>
                                            {req.status === 'pending' && (
                                                <button 
                                                    onClick={() => handleApprove(req._id)}
                                                    disabled={actionLoading === req._id}
                                                    className="btn btn-primary"
                                                    style={{ 
                                                        padding: '6px 12px', 
                                                        fontSize: '0.8rem',
                                                        background: 'linear-gradient(135deg, #00f5d4 0%, #00c9a7 100%)',
                                                        color: '#000',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    {actionLoading === req._id ? '...' : <CheckCircle size={14} />}
                                                    Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
