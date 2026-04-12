import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react'; // Import Menu Icon

function Header({ onToggleSidebar, showToggle = true, children }) { // Default showToggle to true
    const { user } = useAuth();
    const initial = user?.email ? user.email[0].toUpperCase() : 'D';

    return (
        <header style={{
            height: 'var(--header-height)',
            backgroundColor: 'var(--color-bg-main)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            position: 'fixed',
            top: 0,
            right: 0,
            left: 0,
            zIndex: 1000,
            width: '100%',
            // Only add paddingLeft if we expect a sidebar (showToggle is a proxy for sidebar existence here)
            // But wait, showToggle means "can we toggle it". Even if we can't toggle, if sidebar is gone, padding should be 0 (or standard).
            // In Project Mode, showToggle is false. So paddingLeft should be 0 (or standard 1rem from padding above).
            paddingLeft: showToggle ? 'calc(var(--sidebar-width) + 1rem)' : '1rem'
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
            {showToggle && (
                <button
                    onClick={onToggleSidebar}
                    className="btn btn-ghost mobile-toggle"
                    style={{ padding: '8px', color: 'var(--color-text-main)' }}
                >
                    <Menu size={24} />
                </button>
            )}

            {/* Search / Center Content Slot */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 2rem' }}>
                {children}
            </div>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {user?.email || 'Dev'}
                </span>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
                    color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '0.9rem'
                }}>
                    {initial}
                </div>
            </div>
        </header>
    );
}

export default Header;
