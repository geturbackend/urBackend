import { useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLayout } from '../../context/LayoutContext';
import BackToTop from './BackToTop';
// Use the new official logo from public directory
const logoImage = "https://cdn.jsdelivr.net/gh/yash-pouranik/urBackend@main/frontend/public/logo.png";

function MainLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { headerContent } = useLayout();

    const isProjectRoute = matchPath("/project/:projectId/*", location.pathname);

    return (
        <div className="app-shell">
            {/* Mobile Overlay - Only visible when sidebar is open on mobile */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar - Always visible */}
            <Sidebar
                logo={logoImage}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="main-content" style={{ paddingTop: 'var(--header-height)' }}>

                {/* Global Header - Always visible */}
                <Header
                    logo={logoImage}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    showToggle={true}
                >
                    {headerContent}
                </Header>

                {/* Dynamic Page Content */}
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
            <BackToTop />
        </div>
    );
}

export default MainLayout;