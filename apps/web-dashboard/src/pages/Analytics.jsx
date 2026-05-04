import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, HardDrive, Database, RefreshCw, Globe, Zap, Gauge, AlertCircle } from 'lucide-react';
import SectionHeader from '../components/Dashboard/SectionHeader';

const getStatusColor = (status) => {
    if (status >= 500) return '#ef4444';
    if (status >= 400) return '#f59e0b';
    if (status >= 300) return '#3b82f6';
    return '#22c55e';
};

const formatBytes = (bytes) => {
    if (!bytes) return '0 MB';
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const METHOD_COLORS = {
    GET: '#60a5fa',
    POST: '#34d399',
    PATCH: '#a78bfa',
    PUT: '#a78bfa',
    DELETE: '#ef4444',
};

export default function Analytics() {
    const { projectId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [range, setRange] = useState('last24h');

    const fetchData = useCallback(async (selectedRange = 'last24h') => {
        try {
            setRefreshing(true);
            const res = await api.get(`/api/projects/${projectId}/analytics?range=${selectedRange}`);
            if (res.data.success) {
                setData(res.data.data);
            } else {
                console.error(res.data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [projectId]);

    useEffect(() => {
  let isMounted = true;
  const load = async () => {
    try {
      setRefreshing(true);
      const res = await api.get(`/api/projects/${projectId}/analytics?range=last24h`);
      if (res.data.success && isMounted) {
        setData(res.data.data);
      } else if (isMounted) {
        console.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };
  load();
  return () => { isMounted = false; };
}, [projectId]);
    const handleRangeChange = (e) => {
        const newRange = e.target.value;
        setRange(newRange);
        fetchData(newRange);
    };

    if (loading) return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="skeleton" style={{ width: '140px', height: '18px' }} />
                <div className="skeleton" style={{ width: '120px', height: '28px', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="glass-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                        <div className="skeleton" style={{ width: '50%', height: '12px', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ width: '70%', height: '28px' }} />
                        <div className="skeleton" style={{ width: '100%', height: '4px', marginTop: '10px' }} />
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[1, 2].map(i => (
                    <div key={i} className="glass-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                        <div className="skeleton" style={{ width: '50%', height: '12px', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ width: '70%', height: '28px' }} />
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-card" style={{ height: '340px', borderRadius: '8px' }} />
                <div className="glass-card" style={{ height: '340px', borderRadius: '8px' }} />
            </div>
        </div>
    );

    const storageLimit = data?.storage?.limit > 0 ? data.storage.limit : 1;
const storagePercent = Math.min(((data?.storage?.used || 0) / storageLimit) * 100, 100);

const dbLimit = data?.database?.limit > 0 ? data.database.limit : 1;
const dbPercent = Math.min(((data?.database?.used || 0) / dbLimit) * 100, 100);

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(62, 207, 142, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(62, 207, 142, 0.15)' }}>
                        <Activity size={16} color="var(--color-primary)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Analytics</h1>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Real-time usage metrics and request logs</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                        value={range}
                        onChange={handleRangeChange}
                        className="input-field"
                        style={{ width: '140px', height: '30px', fontSize: '0.75rem', padding: '0 8px', margin: 0 }}
                    >
                        <option value="last1h">Last hour</option>
                        <option value="last24h">Last 24 hours</option>
                        <option value="last7d">Last 7 days</option>
                        <option value="last30d">Last 30 days</option>
                        <option value="allTime">All time</option>
                    </select>
                    <button
                        onClick={() => fetchData(range)}
                        className="btn btn-secondary"
                        disabled={refreshing}
                        style={{ height: '30px', fontSize: '0.75rem', padding: '0 12px', gap: '5px' }}
                    >
                        <RefreshCw size={12} className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Updating...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div className="glass-card" style={{ padding: '1rem', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-8px', right: '-8px', opacity: 0.04 }}>
                        <Zap size={80} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', marginBottom: '6px', fontSize: '0.7rem', fontWeight: 500 }}>
                        <Globe size={12} /> Total Requests
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>
                        {(data?.totalRequests || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>All-time API hits</div>
                </div>

                <div className="glass-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500 }}>
                            <HardDrive size={12} /> File Storage
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{formatBytes(data?.storage?.limit)} limit</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '8px' }}>
                        {formatBytes(data?.storage?.used)}
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--color-bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${storagePercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), #34d399)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{storagePercent.toFixed(1)}% used</div>
                </div>

                <div className="glass-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500 }}>
                            <Database size={12} /> Database Size
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{formatBytes(data?.database?.limit)} limit</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '8px' }}>
                        {formatBytes(data?.database?.used || 0)}
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--color-bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${dbPercent}%`, height: '100%', background: dbPercent > 80 ? '#ef4444' : 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: dbPercent > 80 ? '#ef4444' : 'var(--color-text-muted)', marginTop: '4px' }}>{dbPercent.toFixed(1)}% used</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', marginBottom: '6px', fontSize: '0.7rem', fontWeight: 500 }}>
                        <Gauge size={12} /> Average Response Time
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {data?.avgResponseTimeMs !== null && data?.avgResponseTimeMs !== undefined
                            ? `${data.avgResponseTimeMs.toFixed(2)} ms`
                            : 'No data'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        For the selected time range
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', marginBottom: '6px', fontSize: '0.7rem', fontWeight: 500 }}>
                        <AlertCircle size={12} /> Error Rate
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {data?.errorRate !== null && data?.errorRate !== undefined
                            ? `${data.errorRate.toFixed(2)}%`
                            : 'No data'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Percentage of requests with status ≥ 400
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <SectionHeader title="Traffic Overview (7d)" />
                    <div className="glass-card" style={{ padding: '1rem', borderRadius: '8px', height: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis
                                        dataKey="_id"
                                        stroke="var(--color-text-muted)"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={8}
                                    />
                                    <YAxis
                                        stroke="var(--color-text-muted)"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '6px', color: '#fff', fontSize: '0.75rem' }}
                                    />
                                    <Bar dataKey="count" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div>
                    <SectionHeader title="Recent Logs" />
                    <div className="glass-card" style={{ borderRadius: '8px', overflow: 'hidden', height: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
                            <table style={{ width: '100%', fontSize: '0.73rem', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 1, boxShadow: '0 1px 0 var(--color-border)' }}>
                                    <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '7px 10px', fontWeight: 600, width: '60px' }}>Status</th>
                                        <th style={{ padding: '7px 10px', fontWeight: 600, width: '55px' }}>Method</th>
                                        <th style={{ padding: '7px 10px', fontWeight: 600 }}>Path</th>
                                        <th style={{ padding: '7px 10px', fontWeight: 600, textAlign: 'right', width: '60px' }}>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!data?.logs || data.logs.length === 0) ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '1rem 10px', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                                                No recent activity
                                            </td>
                                        </tr>
                                    ) : (
                                        data.logs.map((log) => (
                                            <tr key={log._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }} className="log-row">
                                                <td style={{ padding: '5px 10px' }}>
                                                    <span style={{
                                                        color: getStatusColor(log.status),
                                                        backgroundColor: `${getStatusColor(log.status)}15`,
                                                        padding: '1px 5px',
                                                        borderRadius: '3px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        border: `1px solid ${getStatusColor(log.status)}25`
                                                    }}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '5px 10px', fontWeight: 600, fontSize: '0.68rem' }}>
                                                    <span style={{ color: METHOD_COLORS[log.method] || '#fff' }}>{log.method}</span>
                                                </td>
                                                <td style={{ padding: '5px 10px', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                                    {(log.path && typeof log.path === 'string') ? log.path.replace('/api/', '/') : '/'}
                                                </td>
                                                <td style={{ padding: '5px 10px', color: 'var(--color-text-muted)', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.65rem' }}>
                                                   {(() => {
  const timestamp = log.timestamp;
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
})()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '6px 10px', borderTop: '1px solid var(--color-border)', fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                            Showing latest {data?.logs?.length || 0} entries
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .log-row:hover { background-color: rgba(255,255,255,0.015); }
                .skeleton {
                    position: relative; overflow: hidden;
                    background: linear-gradient(90deg, #1c1c1c 25%, #2a2a2a 50%, #1c1c1c 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                    border-radius: 4px;
                }
                @keyframes skeleton-loading { 
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}