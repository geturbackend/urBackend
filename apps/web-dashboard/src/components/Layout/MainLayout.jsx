import { useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ProjectNavbar from './ProjectNavbar';
import { useLayout } from '../../context/LayoutContext';

// Use the new official logo from public directory
const logoImage = "https://cdn.jsdelivr.net/gh/yash-pouranik/urBackend@main/frontend/public/logo.png";

function MainLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { headerContent } = useLayout();

    // Check if we are inside a project route to toggle layout mode
    // Paths like /project/:projectId/...
    const isProjectRoute = matchPath("/project/:projectId/*", location.pathname);

    return (
        <div className="app-shell">
            {/* Mobile Overlay - Only visible when sidebar is open on mobile */}
            {isSidebarOpen && !isProjectRoute && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar - Only show if NOT in a project route (or if we want global sidebar always, but plan said hide it) */}
            {!isProjectRoute && (
                <Sidebar
                    logo={logoImage}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            {/* If Project Route, remove margin-left (full width) */}
            {/* Add paddingTop to account for fixed global header only if not in project route */}
            <div className={`main-content ${isProjectRoute ? 'full-width' : ''}`} style={{ paddingTop: isProjectRoute ? '0' : 'var(--header-height)' }}>

                {/* Global Header */}
                {!isProjectRoute && (
                    <Header
                        logo={logoImage}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        // Hide toggle button if sidebar is hidden
                        showToggle={true}
                    >
                        {headerContent}
                    </Header>
                )}

                {/* Project Navigation Bar - Only visible in project routes */}
                {isProjectRoute && <ProjectNavbar />}

                {/* Dynamic Page Content */}
                {/* Remove default margin-top as main-content has padding now. Remove padding for Database page. */}
                <div
                    className="content-wrapper"
                    style={{
                        marginTop: 0,
                        padding: isProjectRoute && location.pathname.includes('/database') ? 0 : undefined
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

export default MainLayout;