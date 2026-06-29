import React from 'react';
import { Server } from 'lucide-react';

const EmptyState = ({ onCreateProject }) => {
  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: '6px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: '4rem 2rem',
      background: 'var(--color-bg-card)',
      maxWidth: '480px', margin: '0 auto'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '8px',
        background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
      }}>
        <Server size={18} color="var(--color-text-muted)" />
      </div>
      <h3 style={{ marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>No projects yet</h3>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.8125rem', lineHeight: '1.5', maxWidth: '300px' }}>
        Create your first project. You'll get instant access to a database, authentication, and APIs.
      </p>
      <button onClick={onCreateProject} className="btn btn-primary">Create Project</button>
    </div>
  );
};
export default EmptyState;
