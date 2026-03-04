import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Database, Shield, HardDrive, Settings, BarChart2,
    ArrowLeft, FileText, UserCog, LogOut, X, Rocket // Import Rocket
} from 'lucide-react';

function Sidebar({ logo, isOpen, onClose }) { // Props received
    const location = useLocation();
    const { projectId } = useParams();
    const { logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    // Helper to close sidebar on navigation (Mobile only)
    const handleNavClick = () => {
        if (window.innerWidth <= 768) onClose();
    };

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
                {projectId ? (
                    <Link to="/dashboard" onClick={handleNavClick} className="nav-item" style={{ padding: 0, color: 'var(--color-text-main)' }}>
                        <ArrowLeft size={20} />
                        <span style={{ marginLeft: '10px', fontWeight: 600 }}>Back</span>
                    </Link>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={logo} alt="Logo" style={{ height: '24px' }} />
                        <span className="sidebar-logo-text">urBackend</span>
                    </div>
                )}

                {/* Close Button (Mobile Only) */}
                <button
                    onClick={onClose}
                    className="btn btn-ghost"
                    style={{ padding: '4px', display: 'none' }} // Hidden on desktop
                >
                    <X size={20} />
                </button>
                <style>{`@media (max-width: 768px) { .sidebar-header button { display: block !important; } }`}</style>
            </div>

            {/* Navigation Links */}
            <nav className="sidebar-nav">
                {projectId ? (
                    <>
                        <div className="nav-section-label">Project Modules</div>
                        <Link to={`/project/${projectId}`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}`) ? 'active' : ''}`}>
                            <LayoutDashboard size={18} /> <span>Overview</span>
                        </Link>
                        <Link to={`/project/${projectId}/database`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/database`) ? 'active' : ''}`}>
                            <Database size={18} /> <span>Database</span>
                        </Link>
                        <Link to={`/project/${projectId}/auth`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/auth`) ? 'active' : ''}`}>
                            <Shield size={18} /> <span>Authentication</span>
                        </Link>
                        <Link to={`/project/${projectId}/storage`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/storage`) ? 'active' : ''}`}>
                            <HardDrive size={18} /> <span>Storage</span>
                        </Link>
                        <Link to={`/project/${projectId}/analytics`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/analytics`) ? 'active' : ''}`}>
                            <BarChart2 size={18} /> <span>Analytics</span>
                        </Link>
                        <Link to={`/project/${projectId}/settings`} onClick={handleNavClick} className={`nav-item ${isActive(`/project/${projectId}/settings`) ? 'active' : ''}`}>
                            <Settings size={18} /> <span>Settings</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="nav-section-label">General</div>
                        <Link to="/dashboard" onClick={handleNavClick} className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                            <LayoutDashboard size={18} /> <span>All Projects</span>
                        </Link>
                        <Link to="/settings" onClick={handleNavClick} className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
                            <UserCog size={18} /> <span>Account Settings</span>
                        </Link>
                        <Link to="/releases" onClick={handleNavClick} className={`nav-item ${isActive('/releases') ? 'active' : ''}`}>
                            <Rocket size={18} /> <span>Changelog</span>
                        </Link>
                    </>
                )}
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', justifyContent: 'flex-start' }}>
                    <LogOut size={18} /> <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;