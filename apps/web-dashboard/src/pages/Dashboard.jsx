import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Activity, Zap, Database, HardDrive, LayoutGrid } from 'lucide-react';

import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { usePlan } from '../context/PlanContext';

import DashboardShell from '../components/Dashboard/DashboardShell';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import SectionHeader from '../components/Dashboard/SectionHeader';
import ProjectGrid from '../components/Dashboard/ProjectGrid';
import EmptyState from '../components/Dashboard/EmptyState';
import SkeletonLoader from '../components/Dashboard/SkeletonLoader';
import RecentActivityItem from '../components/Dashboard/RecentActivityItem';
import UsageQuota from '../components/Dashboard/UsageQuota';
import OnboardingChecklist from '../components/Onboarding/OnboardingChecklist';
import DeveloperMetrics from '../components/Dashboard/DeveloperMetrics';
import DocLinks from '../components/Dashboard/DocLinks';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingInvites, setProcessingInvites] = useState({});
  const { user } = useAuth();
  const { setHeaderContent } = useLayout();
  const { fetchPlanData, planData } = usePlan();
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
        const [projectsRes, activityRes, invitationsRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/analytics/activity'),
          api.get('/api/invitations').catch(() => ({ data: { success: true, data: [] } }))
        ]);
        
        setProjects(projectsRes.data.success ? projectsRes.data.data : projectsRes.data);
        setActivity(activityRes.data.success ? activityRes.data.data : activityRes.data);
        setInvitations(invitationsRes.data.success ? invitationsRes.data.data : invitationsRes.data || []);

        // fetchPlanData updates PlanContext which UsageQuota reads from
        await fetchPlanData();
      } catch (err) {
        console.error(err);
        toast.error("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      let isMounted = true;
      Promise.resolve().then(() => {
        if (isMounted) fetchData();
      });
      return () => { isMounted = false; };
    }
  }, [user, fetchPlanData]);

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

  const myOwnedProjects = projects.filter(p => {
    const ownerId = typeof p.owner === 'object' && p.owner !== null ? p.owner._id || p.owner : p.owner;
    return ownerId?.toString() === user?._id?.toString();
  });

  // Calculate global stats directly from owned projects array for 100% accuracy
  const totalDatabaseUsed = myOwnedProjects.reduce((acc, p) => acc + (p.databaseUsed || 0), 0);
  const totalStorageUsed = myOwnedProjects.reduce((acc, p) => acc + (p.storageUsed || 0), 0);

  const formatSize = (bytes) => {
    if (!bytes) return '0 MB';
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleAcceptInvite = async (inviteId) => {
    if (processingInvites[inviteId]) return;
    try {
      setProcessingInvites(prev => ({ ...prev, [inviteId]: true }));
      await api.post(`/api/invitations/${inviteId}/accept`);
      toast.success("Invitation accepted!");
      // Refresh projects list & pending invites
      const [projectsRes, invitationsRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/invitations').catch(() => ({ data: { success: true, data: [] } }))
      ]);
      setProjects(projectsRes.data.success ? projectsRes.data.data : projectsRes.data);
      setInvitations(invitationsRes.data.success ? invitationsRes.data.data : invitationsRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept invitation");
    } finally {
      setProcessingInvites(prev => ({ ...prev, [inviteId]: false }));
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    if (processingInvites[inviteId]) return;
    try {
      setProcessingInvites(prev => ({ ...prev, [inviteId]: true }));
      await api.post(`/api/invitations/${inviteId}/decline`);
      toast.success("Invitation declined");
      const invitationsRes = await api.get('/api/invitations').catch(() => ({ data: { success: true, data: [] } }));
      setInvitations(invitationsRes.data.success ? invitationsRes.data.data : invitationsRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline invitation");
    } finally {
      setProcessingInvites(prev => ({ ...prev, [inviteId]: false }));
    }
  };

  return (
    <DashboardShell>
      <DocLinks />
      <DashboardHeader onCreateProject={handleCreateProject} />

      {/* Pending Invitations Banner */}
      {!isLoading && invitations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {invitations.map(invite => (
            <div key={invite._id} className="glass-card" style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(129, 140, 248, 0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                  📬 You've been invited to join <span style={{ color: 'var(--color-primary)' }}>{invite.project?.name}</span>
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Role: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{invite.role}</strong> · Invited by: {invite.invitedBy?.email}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  id={`accept-invite-${invite._id}`}
                  onClick={() => handleAcceptInvite(invite._id)}
                  className="btn btn-primary"
                  style={{ padding: '6px 16px', fontSize: '0.8rem', height: 'auto' }}
                >
                  Accept
                </button>
                <button
                  id={`decline-invite-${invite._id}`}
                  onClick={() => handleDeclineInvite(invite._id)}
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                    height: 'auto',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{myOwnedProjects.length}</span>
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
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {planData ? `${planData.usage?.totalRequests || 0} / ${planData.limits?.reqPerDay === -1 ? '∞' : (planData.limits?.reqPerDay || 2000)}` : '—'}
            </span>
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
          <UsageQuota />

          {/* 1.5 My Performance (Per-Dev Analytics) */}
          <DeveloperMetrics />

          {/* 2. Onboarding (Helpful Context) */}
          <OnboardingChecklist />

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
                  onClick={() => navigate('/admin/pro-requests')}
                >
                  Pro Requests
                </button>
              </div>
            </>
          )}

          {/* 5. Version Badge removed */}
        </div>
      </div>
    </DashboardShell>
  );
}
