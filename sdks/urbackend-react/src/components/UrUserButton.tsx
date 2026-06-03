import React, { useState, useRef, useEffect } from 'react';
import { useUser, useAuth } from '../hooks';

export interface UrUserButtonProps {
  /**
   * Shape of the profile avatar. Defaults to 'square' as requested.
   */
  shape?: 'square' | 'circle';
  /**
   * Position of the button on the screen. Defaults to 'top-right'.
   * Use 'inline' if you want to place it within a normal flex/grid layout instead of absolute positioning.
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  /**
   * Called when "Profile" is clicked.
   */
  onProfileClick?: () => void;
  /**
   * Called when "Settings" is clicked.
   */
  onSettingsClick?: () => void;
  /**
   * Z-index for the fixed container. Defaults to 999.
   */
  zIndex?: number;
}

export const UrUserButton: React.FC<UrUserButtonProps> = ({
  shape = 'square',
  position = 'top-right',
  onProfileClick,
  onSettingsClick,
  zIndex = 999,
}) => {
  const { user } = useUser();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null; // Only render if logged in

  const borderRadius = shape === 'circle' ? '50%' : '0px';
  const isFixed = position !== 'inline';

  const positionStyles: React.CSSProperties = isFixed
    ? {
        position: 'fixed',
        zIndex,
        top: position.includes('top') ? '24px' : 'auto',
        bottom: position.includes('bottom') ? '24px' : 'auto',
        right: position.includes('right') ? '24px' : 'auto',
        left: position.includes('left') ? '24px' : 'auto',
      }
    : { position: 'relative' };

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: position.includes('top') || position === 'inline' ? 'calc(100% + 8px)' : 'auto',
    bottom: position.includes('bottom') ? 'calc(100% + 8px)' : 'auto',
    right: position.includes('right') || position === 'inline' ? '0' : 'auto',
    left: position.includes('left') ? '0' : 'auto',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '0px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    width: '220px',
    display: isOpen ? 'block' : 'none',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const getInitials = () => {
    return user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div ref={containerRef} style={positionStyles}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '40px',
          height: '40px',
          padding: 0,
          border: '1px solid #e2e8f0',
          background: '#f8fafc',
          borderRadius,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          transition: 'transform 0.1s ease',
        }}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl as string} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#475569' }}>
            {getInitials()}
          </span>
        )}
      </button>

      <div style={dropdownStyles}>
        {/* User Info Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.name || 'User'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
            {user.email}
          </div>
        </div>

        {/* Action List */}
        <div style={{ padding: '8px' }}>
          {onProfileClick && (
            <button
              onClick={() => {
                setIsOpen(false);
                onProfileClick();
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                color: '#334155',
                cursor: 'pointer',
                borderRadius: '0px',
                display: 'block',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Profile
            </button>
          )}

          {onSettingsClick && (
            <button
              onClick={() => {
                setIsOpen(false);
                onSettingsClick();
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                color: '#334155',
                cursor: 'pointer',
                borderRadius: '0px',
                display: 'block',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Settings
            </button>
          )}

          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              background: 'transparent',
              border: 'none',
              fontSize: '14px',
              color: '#ef4444',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: '0px',
              display: 'block',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
