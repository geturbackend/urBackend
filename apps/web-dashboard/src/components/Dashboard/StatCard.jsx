import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'var(--color-primary)', background = 'rgba(62, 207, 142, 0.1)' }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
        <div style={{ background, padding: '8px', borderRadius: '8px', color }}>
          <Icon size={20} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{value}</div>
    </div>
  );
};

export default StatCard;
