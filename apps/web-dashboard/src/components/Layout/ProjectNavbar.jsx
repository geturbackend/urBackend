import { NavLink, useParams, Link } from 'react-router-dom';
import {
    LayoutDashboard, Database, Shield, HardDrive, Settings, BarChart2,
    ArrowLeft, Webhook
} from 'lucide-react';

function ProjectNavbar() {
    const { projectId } = useParams();

    if (!projectId) return null;

    return (
        <div className="project-navbar">
            <div className="nav-left">
                <Link to="/dashboard" className="nav-back-btn">
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </Link>
                <div className="nav-divider"></div>
            </div>

            <nav className="nav-links">
                <NavLink to={`/project/${projectId}`} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={18} />
                    <span>Overview</span>
                </NavLink>

                <NavLink to={`/project/${projectId}/database`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Database size={18} />
                    <span>Database</span>
                </NavLink>

                <NavLink to={`/project/${projectId}/auth`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Shield size={18} />
                    <span>Auth</span>
                </NavLink>

                <NavLink to={`/project/${projectId}/webhooks`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Webhook size={18} />
                    <span>Webhooks</span>
                </NavLink>

                <NavLink to={`/project/${projectId}/storage`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <HardDrive size={18} />
                    <span>Storage</span>
                </NavLink>

                <NavLink to={`/project/${projectId}/analytics`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <BarChart2 size={18} />
                    <span>Analytics</span>
                </NavLink>

                <NavLink to={`/project/${projectId}/settings`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Settings size={18} />
                    <span>Settings</span>
                </NavLink>
            </nav>
        </div>
    );
}

export default ProjectNavbar;
