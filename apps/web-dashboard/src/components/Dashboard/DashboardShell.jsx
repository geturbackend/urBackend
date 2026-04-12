import React from 'react';

const DashboardShell = ({ children }) => {
  return (
    <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>
      {children}
      <style>{`
        .dashboard-card:hover {
          transform: translateY(-4px);
          border-color: var(--color-border-hover) !important;
          background: var(--color-bg-input) !important;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
        }
        .dashboard-card-add:hover {
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
          background: rgba(62, 207, 142, 0.03) !important;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.1);
          border-left-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Loading states */
        .skeleton {
          position: relative;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }

        .skeleton-text {
          border-radius: 2px;
        }

        .skeleton::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 150%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.08),
            transparent
          );
          animation: shimmer 1.8s infinite;
        }

        @keyframes shimmer {
          100% {
            left: 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardShell;
