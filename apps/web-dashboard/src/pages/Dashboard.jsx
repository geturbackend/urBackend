import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';

import DashboardShell from '../components/Dashboard/DashboardShell';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import StatsRow from '../components/Dashboard/StatsRow';
import SectionHeader from '../components/Dashboard/SectionHeader';
import ProjectGrid from '../components/Dashboard/ProjectGrid';
import EmptyState from '../components/Dashboard/EmptyState';
import SkeletonLoader from '../components/Dashboard/SkeletonLoader';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { setHeaderContent } = useLayout();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/api/projects');
        setProjects(response.data);
      } catch (err) {
        console.error(err);
        toast.error("Could not load projects.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchProjects();
  }, [user]);

  // Inject search bar into global header
  useEffect(() => {
    setHeaderContent(
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
        <div className="auth-input-wrap" style={{ flex: 1 }}>
          <Search size={18} style={{ left: '14px', position: 'absolute', color: 'var(--color-text-muted)', zIndex: 1 }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search projects..."
            style={{ paddingLeft: '2.8rem', height: '38px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px' }} className="hide-mobile">
          <button className="btn btn-secondary" style={{ height: '38px', fontSize: '0.75rem', padding: '0 12px' }}>All</button>
          <button className="btn btn-secondary" style={{ height: '38px', fontSize: '0.75rem', padding: '0 12px', opacity: 0.6 }}>Active</button>
        </div>
      </div>
    );

    // Cleanup on unmount
    return () => setHeaderContent(null);
  }, [searchTerm, setHeaderContent]);

  const handleCreateProject = () => navigate('/create-project');

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardShell>
      <DashboardHeader 
        onCreateProject={handleCreateProject} 
      />

      {projects.length > 0 && (
        <StatsRow projectsCount={projects.length} />
      )}

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
    </DashboardShell>
  );
}
