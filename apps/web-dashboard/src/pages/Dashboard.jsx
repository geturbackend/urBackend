import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Activity, Zap, Database, HardDrive, LayoutGrid } from 'lucide-react';

import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';

import DashboardShell from '../components/Dashboard/DashboardShell';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import SectionHeader from '../components/Dashboard/SectionHeader';
import ProjectGrid from '../components/Dashboard/ProjectGrid';
import EmptyState from '../components/Dashboard/EmptyState';
import SkeletonLoader from '../components/Dashboard/SkeletonLoader';
import RecentActivityItem from '../components/Dashboard/RecentActivityItem';
import UsageQuota from '../components/Dashboard/UsageQuota';
import OnboardingChecklist from '../components/Dashboard/OnboardingChecklist';
import DocLinks from '../components/Dashboard/DocLinks';
import ReleaseBadge from '../components/Dashboard/ReleaseBadge';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { setHeaderContent } = useLayout();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, statsRes, activityRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/analytics/stats'),
          api.get('/api/analytics/activity')
        ]);
        
        setProjects(projectsRes.data);
        setGlobalStats(statsRes.data);
        setActivity(activityRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  // Inject search bar into global header
  useEffect(() => {
    setHeaderContent(
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
        <div className="auth-input-wrap" style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ left: '14px', position: 'absolute', color: 'var(--color-text-muted)', zIndex: 1, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            ref={searchInputRef}
            type="text"
            className="input-field"
            placeholder="Search projects..."
            style={{ paddingLeft: '2.8rem', paddingRight: '4rem', height: '38px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ 
            position: 'absolute', 
            right: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            padding: '2px 6px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            fontSize: '0.65rem',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none'
          }}>
            {navigator.platform.includes('Mac') ? '⌘ K' : 'Ctrl K'}
          </div>
        </div>
      </div>
    );
    return () => setHeaderContent(null);
  }, [searchTerm, setHeaderContent]);

  const handleCreateProject = () => navigate('/create-project');

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate global stats directly from projects array for 100% accuracy
  const totalDatabaseUsed = projects.reduce((acc, p) => acc + (p.databaseUsed || 0), 0);
  const totalStorageUsed = projects.reduce((acc, p) => acc + (p.storageUsed || 0), 0);
  const totalCollectionsCount = projects.reduce((acc, p) => acc + (p.collectionsCount || 0), 0);
  const totalRequests = globalStats?.totalRequests || 0;

  const formatSize = (bytes) => {
    if (!bytes) return '0 MB';
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <DashboardShell>
      <DocLinks />
      <DashboardHeader onCreateProject={handleCreateProject} />

      {/* Global Usage Overview Belt - More Compact */}
      {!isLoading && (
        <div className="glass-card" style={{ 
          padding: '1rem 1.5rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem',
          background: 'linear-gradient(135deg, rgba(62, 207, 142, 0.05) 0%, rgba(123, 97, 255, 0.05) 100%)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LayoutGrid size={12} /> Total Projects
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{projects.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={12} /> Database Used
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatSize(totalDatabaseUsed)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={12} /> Storage Used
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatSize(totalStorageUsed)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={12} /> API Requests
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalRequests}</span>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="pro-grid">
        {/* Left Column: Projects */}
        <div>
          <SectionHeader title={searchTerm ? `Search Results (${filteredProjects.length})` : "Your Projects"} />
          
          {isLoading ? (
            <SkeletonLoader />
          ) : projects.length === 0 ? (
            <EmptyState onCreateProject={handleCreateProject} />
          ) : (
            <ProjectGrid
              projects={filteredProjects}
              onCreateProject={handleCreateProject}
            />
          )}
        </div>

        {/* Right Column: Activity & Extras Sidebar */}
        <div className="sticky-sidebar">
          {/* 1. Usage Quota (Technical Context) */}
          <SectionHeader title="Plan & Usage" />
          <UsageQuota 
            projectsCount={projects.length} 
            collectionsCount={totalCollectionsCount}
            limits={globalStats?.limits}
          />

          {/* 2. Onboarding (Helpful Context) */}
          <OnboardingChecklist 
            projectsCount={projects.length} 
            activityCount={activity.length} 
          />

          {/* 3. Recent Activity (Historical Context) */}
          <SectionHeader title="Recent Activity" />
          <div className="glass-card custom-scrollbar" style={{ 
            padding: '1.25rem', 
            borderRadius: '12px', 
            maxHeight: '400px', 
            overflowY: 'auto',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            marginBottom: '2rem'
          }}>
            {activity.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>
                No recent activity.
              </p>
            ) : (
              activity.map(item => (
                <RecentActivityItem key={item.id} activity={item} />
              ))
            )}
          </div>

          {/* 4. Admin Controls */}
          {user?.isAdmin && (
            <>
              <SectionHeader title="Admin" />
              <div className="glass-card" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: '0.75rem', borderRadius: '6px' }}
                  onClick={() => navigate('/admin/waitlist')}
                >
                  View Waitlist
                </button>
              </div>
            </>
          )}

          {/* 5. Version Badge */}
          <ReleaseBadge />
        </div>
      </div>
    </DashboardShell>
  );
}
