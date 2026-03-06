import { useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ProjectNavbar from './ProjectNavbar';
// Use the new official logo from public directory
const logoImage = "/urBACKEND_NAV_LOGO (2).png";

/**
 * App shell that renders the global sidebar, header, or a project-specific navbar and places page content.
 *
 * Renders a mobile overlay and global sidebar/header when not on a project route; renders a project navbar and a full-width main area when the current path matches `/project/:projectId/*`. Adjusts top padding and content padding for project routes and for paths that include `/database`.
 *
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - The page content to render inside the layout.
 * @returns {JSX.Element} The composed layout element containing navigation and the provided children.
 */
function MainLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

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
                    />
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