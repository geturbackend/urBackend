import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Activity, Zap, Database, HardDrive, LayoutGrid, AlertTriangle } from 'lucide-react';

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
  };  // Compute usage warnings from planData
  const usageWarnings = useMemo(() => {
    if (!planData) return [];
    const { limits, usage } = planData;
    const warnings = [];
    const pct = (used, limit) => (limit > 0 && limit !== -1 ? Math.round((used / limit) * 100) : 0);

    const reqPct = pct(usage?.totalRequests ?? 0, limits?.reqPerDay ?? 2000);
    if (reqPct >= 80) warnings.push({ label: 'API Requests', pct: reqPct, icon: <Activity size={13} /> });

    const dbPct = pct(usage?.totalDatabaseUsed ?? 0, limits?.mongoBytes ?? 52428800);
    if (dbPct >= 80 && !limits?.byomEnabled && limits?.mongoBytes !== -1)
      warnings.push({ label: 'Database Storage', pct: dbPct, icon: <Database size={13} /> });

    const storagePct = pct(usage?.totalStorageUsed ?? 0, limits?.storageBytes ?? 10485760);
    if (storagePct >= 80 && limits?.storageBytes !== -1)
      warnings.push({ label: 'File Storage', pct: storagePct, icon: <HardDrive size={13} /> });

    const projPct = pct(usage?.totalProjects ?? 0, limits?.maxProjects ?? 1);
    if (projPct >= 80) warnings.push({ label: 'Projects', pct: projPct, icon: <LayoutGrid size={13} /> });

    return warnings;
  }, [planData]);




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

      {/* Usage Warning Banner — shown when any metric >= 80% */}
      {!isLoading && usageWarnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
          {usageWarnings.map(w => {
            const isCritical = w.pct >= 100;
            return (
              <div key={w.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${isCritical ? 'var(--color-danger)' : 'rgba(234, 179, 8, 0.4)'}`,
                background: isCritical ? 'rgba(234, 84, 85, 0.06)' : 'rgba(234, 179, 8, 0.05)',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={13} color={isCritical ? 'var(--color-danger)' : '#eab308'} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-main)' }}>
                    <strong>{w.label}</strong> is at <strong>{w.pct}%</strong> of your plan limit
                    {isCritical && w.label === 'API Requests' && ' — requests may be blocked'}
                    {isCritical && w.label === 'Database Storage' && ' — database writes may be blocked'}
                    {isCritical && w.label === 'File Storage' && ' — file uploads may be blocked'}
                    {isCritical && w.label === 'Projects' && ' — project creation disabled'}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/pricing')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Upgrade
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pending Invitations Banner */}
      {!isLoading && invitations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {invitations.map(invite => (
            <div key={invite._id} style={{
              padding: '0.875rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              borderLeft: '3px solid #6366f1',
              background: 'var(--color-bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '2px' }}>
                  Invited to <strong>{invite.project?.name}</strong>
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Role: {invite.role} · From: {invite.invitedBy?.email}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button id={`accept-invite-${invite._id}`} onClick={() => handleAcceptInvite(invite._id)} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                  {processingInvites[invite._id] ? '...' : 'Accept'}
                </button>
                <button id={`decline-invite-${invite._id}`} onClick={() => handleDeclineInvite(invite._id)} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                  {processingInvites[invite._id] ? '...' : 'Decline'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Overview */}

      {!isLoading && (
        <div style={{
          padding: '0.875rem 1rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)',
        }}>
          {[
            { icon: <LayoutGrid size={13} />, label: 'Projects', value: projects.length },
            { icon: <Database size={13} />, label: 'Database', value: formatSize(totalDatabaseUsed) },
            { icon: <HardDrive size={13} />, label: 'Storage', value: formatSize(totalStorageUsed) },
            { icon: <Activity size={13} />, label: 'API Requests', value: planData ? `${planData.usage?.totalRequests || 0}` : '—', accent: true },
          ].map((item, i, arr) => (
            <div key={item.label} style={{
              display: 'flex', flexDirection: 'column', gap: '4px',
              padding: '0.75rem 1rem',
              borderRight: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {item.icon}{item.label}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: item.accent ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                {item.value}
              </span>
            </div>
          ))}
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

          {/* DeveloperMetrics removed — low value, 2 extra API calls */}

          {/* 2. Onboarding (Helpful Context) */}
          <OnboardingChecklist />

          {/* 3. Recent Activity (Historical Context) */}
          <SectionHeader title="Recent Activity" />
          <div className="custom-scrollbar" style={{ 
            padding: '0',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            maxHeight: '360px', 
            overflowY: 'auto',
            background: 'var(--color-bg-card)',
            marginBottom: '1rem'
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
              <div style={{ marginBottom: '1rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
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
