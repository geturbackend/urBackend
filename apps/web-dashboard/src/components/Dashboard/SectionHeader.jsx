import React from 'react';

const SectionHeader = ({ title }) => {
  return (
    <div style={{ marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <h2 style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{title}</h2>
      <div style={{ height: '1px', flex: 1, background: 'var(--color-border)' }}></div>
    </div>
  );
};

export default SectionHeader;
