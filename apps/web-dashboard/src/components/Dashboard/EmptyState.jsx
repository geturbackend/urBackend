import React from 'react';
import { Server } from 'lucide-react';

const EmptyState = ({ onCreateProject }) => {
  const cardStyle = {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '1.5rem',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    textAlign: 'center',
    padding: '6rem 2rem',
    alignItems: 'center',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0) 100%)',
    borderStyle: 'dashed',
    maxWidth: '600px',
    margin: '0 auto'
  };

  return (
    <div style={cardStyle}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: 'var(--color-bg-input)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
        border: '1px solid var(--color-border)'
      }}>
        <Server size={32} color="var(--color-text-muted)" />
      </div>
      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>No projects yet</h3>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '400px', lineHeight: '1.6' }}>
        Get started by creating your first project. You'll get instant access to a database, authentication, and storage.
      </p>
      <button
        onClick={onCreateProject}
        className="btn btn-primary"
      >
        Create Project
      </button>
    </div>
  );
};

export default EmptyState;
