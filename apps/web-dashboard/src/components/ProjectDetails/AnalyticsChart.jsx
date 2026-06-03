import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const success = payload.find(p => p.dataKey === 'success')?.value || 0;
    const errors = payload.find(p => p.dataKey === 'errors')?.value || 0;
    
    return (
      <div style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '0.7rem',
        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
        zIndex: 100
      }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 600 }}>{label}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'var(--color-primary)' }}>Success:</span>
            <span style={{ fontWeight: 700 }}>{success}</span>
          </div>
          {errors > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#ef4444' }}>Errors:</span>
              <span style={{ fontWeight: 700 }}>{errors}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '4px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Total:</span>
            <span style={{ fontWeight: 700 }}>{success + errors}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const AnalyticsChart = ({ data = [] }) => {
  return (
    <div style={{ width: '100%', height: 180, marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis 
            dataKey="_id" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
          <Area 
            type="monotone" 
            dataKey="success" 
            stackId="1"
            stroke="var(--color-primary)" 
            fillOpacity={1} 
            fill="url(#colorSuccess)" 
            strokeWidth={1.5}
            activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--color-primary)' }}
          />
          <Area 
            type="monotone" 
            dataKey="errors" 
            stackId="1"
            stroke="#ef4444" 
            fillOpacity={1} 
            fill="url(#colorErrors)" 
            strokeWidth={1.5}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;
