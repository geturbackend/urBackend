import React from 'react';

const SkeletonLoader = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem'
    }}
  >
    {[1, 2, 3].map(i => (
      <div key={i} className="card" style={{ padding: '1.5rem' }}>
        <div className="skeleton skeleton-text" style={{ width: '50%', height: '14px' }} />
        <div className="skeleton skeleton-text" style={{ width: '100%', height: '22px', marginTop: '10px' }} />
        <div className="skeleton skeleton-text" style={{ width: '80%', height: '14px', marginTop: '8px' }} />
        <div className="skeleton skeleton-text" style={{ width: '60%', height: '14px', marginTop: '12px' }} />
      </div>
    ))}
  </div>
);

export default SkeletonLoader;
