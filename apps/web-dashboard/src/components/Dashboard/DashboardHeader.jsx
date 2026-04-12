import React from 'react';
import { Plus } from 'lucide-react';

const DashboardHeader = ({ title = "Overview", subtitle = "Welcome back! Here's what's happening with your projects.", onCreateProject }) => {
  return (
    <div className="page-header" style={{ marginBottom: '3rem', borderBottom: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{title}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
            {subtitle}
          </p>
        </div>
        <button
          onClick={onCreateProject}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem', gap: '8px', boxShadow: '0 4px 14px 0 rgba(62, 207, 142, 0.3)' }}
        >
          <Plus size={18} /> New Project
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
