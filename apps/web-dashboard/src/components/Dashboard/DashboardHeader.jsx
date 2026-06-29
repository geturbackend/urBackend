import React from 'react';
import { Plus } from 'lucide-react';

const DashboardHeader = ({ title = "Overview", subtitle = "Manage your projects.", onCreateProject }) => {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '2px', letterSpacing: '-0.02em', color: 'var(--color-text-main)' }}>{title}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
            {subtitle}
          </p>
        </div>
        <button onClick={onCreateProject} className="btn btn-primary" style={{ gap: '5px', fontSize: '0.75rem' }}>
          <Plus size={13} /> New Project
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
