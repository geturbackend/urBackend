import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

function Header({ onToggleSidebar, showToggle = true, children }) {
    const { user } = useAuth();
    const { projectId } = useParams();
    const [projectName, setProjectName] = useState('');
    const initial = user?.email ? user.email[0].toUpperCase() : 'D';

    useEffect(() => {
        let isMounted = true;
        if (!projectId) {
            queueMicrotask(() => {
                if (isMounted) setProjectName('');
            });
            return;
        }
        api.get(`/api/projects/${projectId}`)
            .then(res => {
                if (isMounted) setProjectName(res.data.name);
            })
            .catch(err => console.error("Failed to fetch project name for header:", err));
        return () => { isMounted = false; };
    }, [projectId]);

    return (
        <header style={{
            height: 'var(--header-height)',
            backgroundColor: 'var(--color-bg-main)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'fixed',
            top: 0,
            right: 0,
            left: 0,
            zIndex: 1000,
            width: '100%',
            paddingLeft: showToggle ? 'calc(var(--sidebar-width) + 1.5rem)' : '1.5rem'
        }} className="responsive-header">

            {/* CSS override for mobile padding in style tag below */}
            <style>{`
                @media (max-width: 768px) {
                    .responsive-header {
                        padding-left: 1rem !important; /* Reset padding on mobile */
                    }
                    .mobile-toggle {
                        display: block !important;
                    }
                }
                .mobile-toggle {
                    display: none;
                }
            `}</style>

            {/* Mobile Menu Button - Only show if toggle is allowed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {showToggle && (
                    <button
                        onClick={onToggleSidebar}
                        className="btn btn-ghost mobile-toggle"
                        style={{ padding: '8px', color: 'var(--color-text-main)' }}
                    >
                        <Menu size={20} />
                    </button>
                )}

                {/* Breadcrumbs for Project View */}
                {projectId && projectName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                        <Link to="/dashboard" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                            Personal
                        </Link>
                        <ChevronRight size={14} color="var(--color-text-muted)" />
                        <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>
                            {projectName}
                        </span>
                    </div>
                )}
            </div>

            {/* Search / Center Content Slot */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 2rem' }}>
                {!projectId && children}
            </div>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {user?.email || 'Dev'}
                </span>
                <div style={{
                    width: '28px', height: '28px', borderRadius: '4px',
                    background: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '600', fontSize: '0.75rem'
                }}>
                    {initial}
                </div>
            </div>
        </header>
    );
}

export default Header;
