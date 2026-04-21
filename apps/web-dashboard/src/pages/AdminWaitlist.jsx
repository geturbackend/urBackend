import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DashboardShell from '../components/Dashboard/DashboardShell';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import SectionHeader from '../components/Dashboard/SectionHeader';

export default function AdminWaitlist() {
    const { user, isLoading } = useAuth();
    const [waitlist, setWaitlist] = useState([]);
    const [count, setCount] = useState(0);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/api/waitlist/admin');
                if (res.data.success) {
                    setWaitlist(res.data.data.waitlist);
                    setCount(res.data.data.count);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to fetch waitlist");
            } finally {
                setLoadingData(false);
            }
        };
        
        if (user?.isAdmin) {
            fetchData();
        }
    }, [user]);

    if (isLoading) return null;
    if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

    return (
        <DashboardShell>
            <DashboardHeader />
            <SectionHeader title={`Waitlist Signups (${count})`} />
            
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '12px' }}>
                {loadingData ? (
                    <p>Loading waitlist...</p>
                ) : waitlist.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>No signups yet.</p>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '12px 0' }}>Email</th>
                                <th style={{ padding: '12px 0' }}>Status</th>
                                <th style={{ padding: '12px 0' }}>Joined At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {waitlist.map((entry) => (
                                <tr key={entry._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px 0', fontWeight: 600 }}>{entry.email}</td>
                                    <td style={{ padding: '12px 0' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '4px', 
                                            fontSize: '0.8rem', 
                                            background: entry.status === 'pending' ? 'rgba(255, 165, 0, 0.1)' : 'rgba(0, 245, 212, 0.1)',
                                            color: entry.status === 'pending' ? '#ffa500' : '#00f5d4'
                                        }}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        {new Date(entry.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardShell>
    );
}
