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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem('urbackend-sidebar-collapsed') === 'true';
        } catch {
            return false;
        }
    });
    const location = useLocation();
    const { headerContent } = useLayout();

    const isProjectRoute = matchPath("/project/:projectId/*", location.pathname);

    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed(prev => {
            const nextVal = !prev;
            try {
                localStorage.setItem('urbackend-sidebar-collapsed', String(nextVal));
            } catch (err) {
                console.warn("localStorage not accessible", err);
            }
            return nextVal;
        });
    };

    return (
        <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
            />

            {/* Main Content Area */}
            <div className="main-content" style={{ paddingTop: 'var(--header-height)' }}>

                {/* Global Header - Always visible */}
                <Header
                    logo={logoImage}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    showToggle={true}
                    isSidebarCollapsed={isSidebarCollapsed}
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