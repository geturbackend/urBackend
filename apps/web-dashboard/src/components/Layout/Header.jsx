import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, ChevronRight, Search } from 'lucide-react';
import api from '../../utils/api';

function Header({ onToggleSidebar, showToggle = true, isSidebarCollapsed = false }) {
    const { user } = useAuth();
    const { projectId } = useParams();
    const [projectName, setProjectName] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
    const searchInputRef = useRef(null);
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

    // Sync input value with URL search param
    useEffect(() => {
        let isMounted = true;
        queueMicrotask(() => {
            if (isMounted) {
                setInputValue(searchParams.get('q') || '');
            }
        });
        return () => { isMounted = false; };
    }, [searchParams]);

    // Keyboard shortcut to focus search input
    useEffect(() => {
        const handleKeyPress = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        if (location.pathname === '/dashboard') {
            setSearchParams(val ? { q: val } : {});
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            navigate(`/dashboard?q=${encodeURIComponent(inputValue)}`);
        }
    };

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
            paddingLeft: showToggle 
                ? `calc(${isSidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)'} + 1.5rem)` 
                : '1.5rem'
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
                    .search-container {
                        display: none !important; /* Hide search bar on mobile headers to save space */
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

            {/* Persistent Global Search Input */}
            <div className="search-container" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 2rem' }}>
                <div className="auth-input-wrap" style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
                    <Search size={15} style={{ left: '12px', position: 'absolute', color: 'var(--color-text-muted)', zIndex: 1, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="input-field"
                        placeholder="Search projects..."
                        style={{ paddingLeft: '2.4rem', paddingRight: '4rem', height: '32px', fontSize: '0.75rem', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                        value={inputValue}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <div style={{ 
                        position: 'absolute', 
                        right: '8px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        padding: '1px 5px',
                        background: 'var(--color-bg-main)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        fontSize: '0.6rem',
                        color: 'var(--color-text-muted)',
                        pointerEvents: 'none'
                    }}>
                        {navigator.platform.includes('Mac') ? '⌘ K' : 'Ctrl K'}
                    </div>
                </div>
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
