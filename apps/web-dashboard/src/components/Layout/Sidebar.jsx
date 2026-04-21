import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Database, Shield, HardDrive, Settings, BarChart2,
    ArrowLeft, LogOut, X, Rocket, Webhook
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

function Sidebar({ logo, isOpen, onClose }) {
    const location = useLocation();
    const { projectId } = useParams();
    const { logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const handleNavClick = () => {
        if (window.innerWidth <= 768) onClose();
    };

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                {projectId ? (
                    <Link to="/dashboard" onClick={handleNavClick} className="nav-item" style={{ padding: 0, color: 'var(--color-text-main)', border: 'none' }}>
                        <ArrowLeft size={16} />
                        <span style={{ marginLeft: '10px', fontWeight: 600 }}>Back to Projects</span>
                    </Link>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={logo} alt="Logo" style={{ height: '24px', width: 'auto' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em' }}>urBackend</span>
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                {projectId ? (
                    <>
                        <div className="nav-section-label">Project</div>
                        <Link to={`/project/${projectId}`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}`) ? 'active' : ''}`}>
                            <LayoutDashboard size={16} /> <span>Overview</span>
                        </Link>
                        <Link to={`/project/${projectId}/database`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/database`) ? 'active' : ''}`}>
                            <Database size={16} /> <span>Database</span>
                        </Link>
                        <Link to={`/project/${projectId}/auth`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/auth`) ? 'active' : ''}`}>
                            <Shield size={16} /> <span>Authentication</span>
                        </Link>
                        <Link to={`/project/${projectId}/storage`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/storage`) ? 'active' : ''}`}>
                            <HardDrive size={16} /> <span>Storage</span>
                        </Link>
                        <Link to={`/project/${projectId}/webhooks`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/webhooks`) ? 'active' : ''}`}>
                            <Webhook size={16} /> <span>Webhooks</span>
                        </Link>
                        <Link to={`/project/${projectId}/analytics`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/analytics`) ? 'active' : ''}`}>
                            <BarChart2 size={16} /> <span>Analytics</span>
                        </Link>
                        <Link to={`/project/${projectId}/settings`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/settings`) ? 'active' : ''}`}>
                            <Settings size={16} /> <span>Settings</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="nav-section-label">General</div>
                        <Link to="/dashboard" onClick={handleNavClick} className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                            <LayoutDashboard size={16} /> <span>Dashboard</span>
                        </Link>
                        <Link to="/releases" onClick={handleNavClick} className={`nav-item ${isActive('/releases') ? 'active' : ''}`}>
                            <Rocket size={16} /> <span>What's New</span>
                        </Link>
                        <Link to="/settings" onClick={handleNavClick} className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
                            <Settings size={16} /> <span>Settings</span>
                        </Link>
                    </>
                )}
            </nav>

            <div style={{ padding: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                <ThemeToggle />
                <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', justifyContent: 'flex-start' }}>
                    <LogOut size={16} /> <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;