import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  isDark?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, isDark = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation on mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    let innerTimer: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      setIsLeaving(true);
      innerTimer = setTimeout(onClose, 300); // Wait for exit animation
    }, 4000);

    return () => {
      clearTimeout(timer);
      if (innerTimer) clearTimeout(innerTimer);
    };
  }, [onClose]);

  const bgColor = isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const borderColor = type === 'success' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)';
  const iconColor = type === 'success' ? '#22c55e' : '#ef4444';
  const textColor = isDark ? '#fff' : '#000';

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from { transform: translate(-50%, -20px) scale(0.95); opacity: 0; }
            to { transform: translate(-50%, 0) scale(1); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translate(-50%, 0) scale(1); opacity: 1; }
            to { transform: translate(-50%, -20px) scale(0.95); opacity: 0; }
          }
        `}
      </style>
      <div
        style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          borderRadius: '0',
          background: bgColor,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          color: textColor,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          animation: isLeaving ? 'slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {type === 'success' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        )}
        {message}
      </div>
    </>
  );
};
