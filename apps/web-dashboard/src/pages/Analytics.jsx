import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { 
    AreaChart, Area, LineChart, Line, BarChart, Bar, 
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
    Activity, HardDrive, Database, RefreshCw, Globe, 
    Zap, Gauge, AlertCircle, BarChart3, Clock, 
    ChevronRight, ArrowUpRight, TrendingUp, Filter
} from 'lucide-react';
import SectionHeader from '../components/Dashboard/SectionHeader';

const STATUS_COLORS = {
    '2xx': '#10b981',
    '3xx': '#3b82f6',
    '4xx': '#f59e0b',
    '5xx': '#ef4444',
};

const METHOD_COLORS = {
    GET: '#3b82f6',
    POST: '#10b981',
    PATCH: '#f59e0b',
    PUT: '#f59e0b',
    DELETE: '#ef4444',
};

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const getStatusColor = (status) => {
    if (status >= 500) return '#ef4444';
    if (status >= 400) return '#f59e0b';
    if (status >= 300) return '#3b82f6';
    return '#10b981';
};

const RANGE_OPTIONS = [
    { label: '1h', value: 'last1h' },
    { label: '24h', value: 'last24h' },
    { label: '7d', value: 'last7d' },
    { label: '30d', value: 'last30d' },
    { label: 'All', value: 'allTime' },
];

export default function Analytics() {
    const { projectId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [range, setRange] = useState('last24h');

    const fetchData = useCallback(async (selectedRange) => {
        try {
            setRefreshing(true);
            const res = await api.get(`/api/projects/${projectId}/analytics?range=${selectedRange}`);
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [projectId]);

    useEffect(() => {
        queueMicrotask(() => fetchData(range));
    }, [range, fetchData]);

    // Skeleton loader component
    if (loading) return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div className="skeleton" style={{ width: '200px', height: '40px' }} />
                <div className="skeleton" style={{ width: '300px', height: '40px', borderRadius: '20px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="glass-card skeleton" style={{ height: '120px' }} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="glass-card skeleton" style={{ height: '400px' }} />
                <div className="glass-card skeleton" style={{ height: '400px' }} />
            </div>
        </div>
    );

    const rangeStats = data?.rangeStats || {};
    const selectedRangeLabel = RANGE_OPTIONS.find(r => r.value === range)?.label || '24h';
    
    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem', padding: '0 1rem' }}>
            
            {/* Header & Range Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: '4px', 
                        background: 'rgba(255, 255, 255, 0.03)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' 
                    }}>
                        <TrendingUp size={20} color="var(--color-text-muted)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Analytics</h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Data insights for the last {selectedRangeLabel}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                    {RANGE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setRange(opt.value)}
                            style={{
                                padding: '6px 16px',
                                fontSize: '0.75rem',
                                fontWeight: range === opt.value ? 600 : 500,
                                borderRadius: '2px',
                                border: 'none',
                                background: range === opt.value ? 'var(--color-primary)' : 'transparent',
                                color: range === opt.value ? '#000' : 'var(--color-text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                    <div style={{ width: '1px', height: '16px', background: 'var(--color-border)', margin: '0 8px' }} />
                    <button 
                        onClick={() => fetchData(range)} 
                        disabled={refreshing}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', padding: '0 8px' }}
                    >
                        <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                gap: '1.25rem', 
                marginBottom: '2rem',
                position: 'relative'
            }}>
                {/* Subtle loading overlay for cards */}
                {refreshing && (
                    <div style={{
                        position: 'absolute', top: -10, left: -10, right: -10, bottom: -10,
                        background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(2px)',
                        zIndex: 10, borderRadius: '4px', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <RefreshCw size={24} className="spin" color="var(--color-primary)" />
                    </div>
                )}
                
                <KPICard 
                    title="Traffic" 
                    value={rangeStats.totalRequests?.toLocaleString()} 
                    subtext={`Requests in ${selectedRangeLabel}`}
                    icon={<Globe size={18} />}
                    color="var(--color-border)"
                />
                <KPICard 
                    title="Latency" 
                    value={`${rangeStats.avgResponseTimeMs?.toFixed(0)}ms`} 
                    subtext={`p95 speed: ${rangeStats.p95ResponseTimeMs?.toFixed(0)}ms`}
                    icon={<Clock size={18} />}
                    color="var(--color-border)"
                />
                <KPICard 
                    title="Errors" 
                    value={`${rangeStats.errorRate?.toFixed(2)}%`} 
                    subtext={`${((rangeStats.errorRate / 100) * rangeStats.totalRequests).toFixed(0)} failures detected`}
                    icon={<AlertCircle size={18} />}
                    color="var(--color-border)"
                />
                <KPICard 
                    title="Storage" 
                    value={formatBytes(data?.storage?.used)} 
                    subtext={`of ${formatBytes(data?.storage?.limit)} available`}
                    icon={<HardDrive size={18} />}
                    color="var(--color-border)"
                    progress={(data?.storage?.used / data?.storage?.limit) * 100}
                />
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={16} color="#3b82f6" /> Traffic Distribution
                        </h3>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>BY TIME</span>
                    </div>
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.timeSeries}>
                                <defs>
                                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" fill="url(#colorSuccess)" strokeWidth={2} />
                                <Area type="monotone" dataKey="errors" stackId="1" stroke="#ef4444" fill="url(#colorError)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Gauge size={16} color="#10b981" /> Response Performance
                        </h3>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>LATENCY (MS)</span>
                    </div>
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.timeSeries}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                                <Tooltip content={<LatencyTooltip />} />
                                <Line type="monotone" dataKey="avgLatency" stroke="#10b981" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Breakdowns Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Most Active Endpoints</h3>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>TOP 10</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data?.topEndpoints?.length > 0 ? data.topEndpoints.map((ep, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: METHOD_COLORS[ep.method] || '#fff', background: `${METHOD_COLORS[ep.method] || '#fff'}15`, padding: '2px 6px', borderRadius: '2px', width: '45px', textAlign: 'center' }}>{ep.method}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 500, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.path}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ep.count}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>hits</div>
                                    </div>
                                    <div style={{ textAlign: 'right', width: '60px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: ep.avgLatency > 500 ? '#ef4444' : '#10b981' }}>{ep.avgLatency.toFixed(0)}ms</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>avg</div>
                                    </div>
                                </div>
                            </div>
                        )) : <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No data for {selectedRangeLabel}</p>}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '4px', flex: 1 }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.25rem' }}>Status Breakdown</h3>
                        <div style={{ height: '140px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.distributions?.statusCodes} layout="vertical" margin={{ left: -30 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.75rem' }} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                        {data?.distributions?.statusCodes?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry._id] || '#94a3b8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '4px', flex: 1 }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Method Breakdown</h3>
                        <div style={{ height: '140px', display: 'flex', alignItems: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.distributions?.methods}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={55}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="_id"
                                    >
                                        {data?.distributions?.methods?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={METHOD_COLORS[entry._id] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <SectionHeader title={`Recent Logs (${selectedRangeLabel})`} />
            <div className="glass-card" style={{ borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)' }}>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Method</th>
                                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Endpoint</th>
                                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Time</th>
                                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.logs?.length > 0 ? data.logs.map(log => (
                                <tr key={log._id} style={{ borderTop: '1px solid var(--color-border)' }} className="log-row">
                                    <td style={{ padding: '12px 20px' }}>
                                        <span style={{ 
                                            color: getStatusColor(log.status), 
                                            background: `${getStatusColor(log.status)}15`,
                                            padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem',
                                            border: `1px solid ${getStatusColor(log.status)}30`
                                        }}>{log.status}</span>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <span style={{ fontWeight: 700, color: METHOD_COLORS[log.method] || '#fff' }}>{log.method}</span>
                                    </td>
                                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', opacity: 0.9 }}>
                                        {log.path.replace('/api/', '/')}
                                    </td>
                                    <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600 }}>
                                        {log.responseTimeMs ? `${log.responseTimeMs.toFixed(0)}ms` : '—'}
                                    </td>
                                    <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No logs for this range</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .log-row:hover { background: rgba(255,255,255,0.015); }
                .skeleton {
                    background: linear-gradient(90deg, #1c1c1c 25%, #2a2a2a 50%, #1c1c1c 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                }
                @keyframes skeleton-loading { 
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

function KPICard({ title, value, subtext, icon, color, progress }) {
    return (
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{title}</span>
                <div style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>{icon}</div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '6px' }}>{value || '0'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{subtext}</div>
            {progress !== undefined && (
                <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', marginTop: '12px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: 'var(--color-text-muted)', borderRadius: '1px' }} />
                </div>
            )}
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', padding: '10px 14px', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</p>
                {payload.map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center', marginBottom: idx === 0 ? '4px' : 0 }}>
                        <span style={{ fontSize: '0.75rem', color: entry.color, fontWeight: 600 }}>{entry.name === 'success' ? 'Success' : 'Errors'}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const LatencyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', padding: '10px 14px', borderRadius: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Avg Latency</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{payload[0].value.toFixed(1)}ms</span>
                </div>
            </div>
        );
    }
    return null;
};