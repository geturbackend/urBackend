import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, HardDrive, Server, Database, RefreshCw, Clock, Globe } from 'lucide-react';
import { API_URL } from '../config';

export default function Analytics() {
    const { projectId } = useParams();
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setRefreshing(true);
            const res = await axios.get(`${API_URL}/api/projects/${projectId}/analytics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [projectId, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

      const SkeletonLoader = () => (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* Stats Cards Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[1,2,3].map(i => (
                    <div key={i} className="card" style={{ padding: '1rem', position: 'relative' }}>
                        <div className="skeleton skeleton-text" style={{ width: '40%', height: '16px' }} />
                        <div className="skeleton skeleton-text" style={{ width: '60%', height: '36px', marginTop: '8px' }} />
                        <div className="skeleton skeleton-text" style={{ width: '100%', height: '6px', marginTop: '12px' }} />
                    </div>
                ))}
            </div>

            {/* Chart & Logs Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                
                {/* Chart Skeleton */}
                <div className="card" style={{ height: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div className="skeleton skeleton-text" style={{ width: '50%', height: '16px', marginBottom: '12px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '100%', height: '340px' }} />
                </div>

                {/* Logs Skeleton */}
                <div className="card" style={{ height: '400px', padding: '1.5rem', overflowY: 'auto' }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                        <div key={i} className="skeleton-row">
                            <div className="skeleton skeleton-text" style={{ width: '100%' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Helper to format bytes
    const formatBytes = (bytes) => {
        if (!bytes) return '0 MB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // Helper for Status Color
    const getStatusColor = (status) => {
        if (status >= 500) return '#ef4444'; // Red
        if (status >= 400) return '#f59e0b'; // Yellow
        if (status >= 300) return '#3b82f6'; // Blue
        return '#22c55e'; // Green
    };

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header with Refresh */}
            <div className="page-header" style={{ marginBottom: '2.5rem', borderBottom: 'none' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Analytics</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Real-time usage metrics and logs.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="btn btn-secondary"
                    disabled={refreshing}
                    style={{ minWidth: '100px', display: 'flex', justifyContent: 'center' }}
                >
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} style={{ marginRight: '8px' }} />
                    {refreshing ? 'Updating' : 'Refresh'}
                </button>
            </div>

              {/* Main Content with Skeleton*/}
            {loading ? (
                <SkeletonLoader />
            ) : (
                <>
            {/* Stats Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* 1. Total Requests */}
                <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05, transform: 'rotate(15deg)' }}>
                        <Activity size={100} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                        <Globe size={16} /> Total Requests
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '700', color: '#fff', letterSpacing: '-1px' }}>
                        {data.totalRequests.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        All-time API hits
                    </div>
                </div>

                {/* 2. File Storage */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                            <HardDrive size={16} /> File Storage
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatBytes(data.storage.limit)} Limit</span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '12px' }}>
                        {formatBytes(data.storage.used)}
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min((data.storage.used / data.storage.limit) * 100, 100)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--color-primary), #34d399)',
                            borderRadius: '3px',
                            transition: 'width 0.5s ease'
                        }}></div>
                    </div>
                </div>

                {/* 3. Database Size */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                            <Database size={16} /> Database Size
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatBytes(data.database?.limit)} Limit</span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '12px' }}>
                        {formatBytes(data.database?.used || 0)}
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(((data.database?.used || 0) / (data.database?.limit || 1)) * 100, 100)}%`,
                            height: '100%',
                            background: ((data.database?.used || 0) / (data.database?.limit || 1)) > 0.8 ? '#ef4444' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                            borderRadius: '3px',
                            transition: 'width 0.5s ease'
                        }}></div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>

                {/* Traffic Chart */}
                <div className="card" style={{ height: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Traffic Overview</h3>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis
                                    dataKey="_id"
                                    stroke="var(--color-text-muted)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="var(--color-text-muted)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="var(--color-primary)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Logs List */}
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '400px', overflow: 'hidden' }}>
                    <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} /> Recent Logs
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Latest 50</span>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
                        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-bg-card)', zIndex: 1, boxShadow: '0 1px 0 var(--color-border)' }}>
                                <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)' }}>
                                    <th style={{ padding: '10px 16px', fontWeight: 600, width: '80px' }}>Status</th>
                                    <th style={{ padding: '10px 16px', fontWeight: 600, width: '80px' }}>Method</th>
                                    <th style={{ padding: '10px 16px', fontWeight: 600 }}>Path</th>
                                    <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right', width: '100px' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                            No recent activity
                                        </td>
                                    </tr>
                                ) : (
                                    data.logs.map((log) => (
                                        <tr key={log._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="log-row">
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    color: getStatusColor(log.status),
                                                    backgroundColor: `${getStatusColor(log.status)}15`,
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    border: `1px solid ${getStatusColor(log.status)}30`
                                                }}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                                <span style={{
                                                    color: log.method === 'GET' ? '#60a5fa' :
                                                        log.method === 'POST' ? '#34d399' :
                                                            log.method === 'DELETE' ? '#ef4444' : '#a78bfa'
                                                }}>{log.method}</span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--color-text-main)' }}>
                                                {log.path.replace('/api/', '/')}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
         </>
        )}

            
            <style>{`
            /* Inline Styles for Spin Animation & Hover */

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .log-row:hover { background-color: var(--color-bg-input); }
            
            /* Loading states */

                .skeleton {
                    position: relative;
                    overflow: hidden;
                    background: rgba(255,255,255,0.05);
                    border-radius: 4px;
                }

                .skeleton::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -150%;
                    width: 150%; height: 100%;
                    background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255,255,255,0.08),
                    transparent
                    );
                    animation: shimmer 1.8s infinite;
                }

                @keyframes shimmer {
                    100% { left: 150%; }
                }   
            `}</style>
        </div>
    );
}