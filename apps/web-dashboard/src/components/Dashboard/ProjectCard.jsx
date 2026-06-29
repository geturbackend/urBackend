import React from 'react';
import { Link } from 'react-router-dom';
import { Database, HardDrive, ArrowRight, Shield, Clock } from 'lucide-react';
import UsageProgressBar from './UsageProgressBar';

const ProjectCard = ({ project }) => {
  const cardStyle = {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    padding: '0.875rem',
    transition: 'border-color 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer'
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Link
      to={`/project/${project._id}`}
      className="dashboard-card-link"
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <div className="dashboard-card group" style={cardStyle}>
        {/* Top Section */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{
            width: '28px', height: '28px',
            borderRadius: '4px',
            background: 'var(--color-bg-input)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Database size={14} />
          </div>
          
          <div className={`badge badge-${project.health === 'warning' ? 'warning' : 'success'}`} style={{ padding: '1px 6px', fontSize: '0.6rem' }}>
            {project.health === 'warning' ? 'Degraded' : 'Active'}
          </div>
        </div>

        {/* Info Section */}
        <div style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '2px' }}>
            {project.name}
            </h3>
            <p style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.75rem',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
            }}>
            {project.description || "No description."}
            </p>
        </div>

        {/* Usage Metrics */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <UsageProgressBar 
                label="DB" 
                used={project.metrics?.database?.used || project.databaseUsed || 0} 
                limit={project.metrics?.database?.limit || project.databaseLimit || 20 * 1024 * 1024} 
            />
            <UsageProgressBar 
                label="Storage" 
                used={project.metrics?.storage?.used || project.storageUsed || 0} 
                limit={project.metrics?.storage?.limit || project.storageLimit || 20 * 1024 * 1024} 
            />
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '0.5rem',
          marginTop: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--color-text-muted)',
          fontSize: '0.65rem'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={10} />
                <span>{formatDate(project.updatedAt)}</span>
            </div>
            {project.isAuthEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--color-primary)' }}>
                    <Shield size={10} />
                    <span>Auth</span>
                </div>
            )}
          </div>
          <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
