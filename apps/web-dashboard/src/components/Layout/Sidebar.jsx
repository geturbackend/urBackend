import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Database, Shield, HardDrive, Settings, BarChart2,
    ArrowLeft, LogOut, X, Rocket, Webhook, Users, Mail, ChevronLeft, ChevronRight
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

function Sidebar({ logo, isOpen, onClose, isCollapsed, onToggleCollapse }) {
    const location = useLocation();
    const { projectId } = useParams();
    const { logout } = useAuth();

    const isActive = (path) => {
        if (path === `/project/${projectId}`) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    const handleNavClick = () => {
        if (window.innerWidth <= 768) onClose();
    };

    const navA11yProps = (label) => ({
        'aria-label': label,
        title: label,
    });

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header" style={{ padding: isCollapsed ? '0 1.25rem' : '0 1rem' }}>
                {projectId ? (
                    <Link to="/dashboard" onClick={handleNavClick} className="nav-item" style={{ padding: 0, color: 'var(--color-text-main)', border: 'none' }} {...navA11yProps('Back to Projects')}>
                        <ArrowLeft size={16} style={{ flexShrink: 0 }} />
                        <span className="back-text" style={{ marginLeft: '10px', fontWeight: 600 }}>Back to Projects</span>
                    </Link>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={logo} alt="Logo" style={{ height: '24px', width: 'auto', flexShrink: 0 }} />
                        <span className="logo-text" style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em' }}>urBackend</span>
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                {projectId ? (
                    <>
                        <div className="nav-section-label">Project</div>
                        <Link to={`/project/${projectId}`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}`) ? 'active' : ''}`} {...navA11yProps('Overview')}>
                            <LayoutDashboard size={16} /> <span>Overview</span>
                        </Link>
                        <Link to={`/project/${projectId}/database`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/database`) ? 'active' : ''}`} {...navA11yProps('Database')}>
                            <Database size={16} /> <span>Database</span>
                        </Link>
                        <Link to={`/project/${projectId}/auth`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/auth`) ? 'active' : ''}`} {...navA11yProps('Authentication')}>
                            <Shield size={16} /> <span>Auth</span>
                        </Link>
                        <Link to={`/project/${projectId}/webhooks`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/webhooks`) ? 'active' : ''}`} {...navA11yProps('Webhooks')}>
                            <Webhook size={16} /> <span>Webhooks</span>
                        </Link>
                        <Link to={`/project/${projectId}/storage`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/storage`) ? 'active' : ''}`} {...navA11yProps('Storage')}>
                            <HardDrive size={16} /> <span>Storage</span>
                        </Link>
                        <Link to={`/project/${projectId}/mail`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/mail`) ? 'active' : ''}`} {...navA11yProps('Mail')}>
                            <Mail size={16} /> <span>Mail</span>
                        </Link>
                        <Link to={`/project/${projectId}/analytics`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/analytics`) ? 'active' : ''}`} {...navA11yProps('Analytics')}>
                            <BarChart2 size={16} /> <span>Analytics</span>
                        </Link>
                        <Link to={`/project/${projectId}/team`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/team`) ? 'active' : ''}`} {...navA11yProps('Team')}>
                            <Users size={16} /> <span>Team</span>
                        </Link>
                        <Link to={`/project/${projectId}/settings`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/settings`) ? 'active' : ''}`} {...navA11yProps('Settings')}>
                            <Settings size={16} /> <span>Settings</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="nav-section-label">General</div>
                        <Link to="/dashboard" onClick={handleNavClick} className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} {...navA11yProps('Dashboard')}>
                            <LayoutDashboard size={16} /> <span>Dashboard</span>
                        </Link>
                        <Link to="/releases" onClick={handleNavClick} className={`nav-item ${isActive('/releases') ? 'active' : ''}`} {...navA11yProps("What's New")}>
                            <Rocket size={16} /> <span>What's New</span>
                        </Link>
                        <Link to="/settings" onClick={handleNavClick} className={`nav-item ${isActive('/settings') ? 'active' : ''}`} {...navA11yProps('Settings')}>
                            <Settings size={16} /> <span>Settings</span>
                        </Link>
                    </>
                )}
            </nav>

            <div style={{ padding: '0.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <ThemeToggle />
                <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', justifyContent: 'flex-start' }} {...navA11yProps('Logout')}>
                    <LogOut size={16} style={{ flexShrink: 0 }} /> <span className="logout-text">Logout</span>
                </button>
                <button onClick={onToggleCollapse} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', justifyContent: 'flex-start' }} {...navA11yProps(isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar')}>
                    {isCollapsed ? <ChevronRight size={16} style={{ flexShrink: 0 }} /> : <ChevronLeft size={16} style={{ flexShrink: 0 }} />}
                    <span className="collapse-text">Minimize Sidebar</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
