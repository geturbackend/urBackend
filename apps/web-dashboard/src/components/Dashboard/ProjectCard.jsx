import React from 'react';
import { Link } from 'react-router-dom';
import { Database, HardDrive, ArrowRight, Shield, Globe, Clock } from 'lucide-react';

const ProjectCard = ({ project }) => {
  const cardStyle = {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '1.5rem',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
        {/* Top Section: Icon & Status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{
            width: '42px', height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(62, 207, 142, 0.1), rgba(0,0,0,0))',
            color: 'var(--color-primary)',
            border: '1px solid rgba(62, 207, 142, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Database size={20} />
          </div>
          
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '20px',
            background: 'rgba(62, 207, 142, 0.05)',
            border: '1px solid rgba(62, 207, 142, 0.1)',
            fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
            Active
          </div>
        </div>

        {/* Info Section */}
        <div style={{ marginBottom: '1.5rem', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
            {project.name}
            </h3>
            <p style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
            }}>
            {project.description || "No description provided for this project."}
            </p>
        </div>

        {/* Tech Tags */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text-muted)' }}>MongoDB</span>
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text-muted)' }}>Auth</span>
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-text-muted)' }}>Storage</span>
        </div>

        {/* Footer Metrics */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                <span>{formatDate(project.updatedAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HardDrive size={12} />
                <span>{project.storageLimit ? Math.round(project.storageLimit / (1024 * 1024)) : 20}MB</span>
            </div>
          </div>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
