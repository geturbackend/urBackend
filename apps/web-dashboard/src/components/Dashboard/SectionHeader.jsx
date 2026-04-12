import React from 'react';

const SectionHeader = ({ title }) => {
  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ height: '1px', flex: 1, background: 'var(--color-border)' }}></div>
    </div>
  );
};

export default SectionHeader;
