import { useState, useEffect } from 'react';
import { UrAuth, ProtectedRoute, GuestRoute, useUser, useAuth, UrUserButton } from '@urbackend/react';
import './App.css';

// Mini router component for the demo
function App() {
  const [route, setRoute] = useState(window.location.pathname);

  // Sync route state with browser history for back button
  useEffect(() => {
    const handlePop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  const LoadingFallback = (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fafafa' }}>
      <div style={{
        width: '24px',
        height: '24px',
        border: '2px solid #e4e4e7',
        borderTopColor: '#09090b',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  if (route === '/login') {
    return (
      <GuestRoute fallback={LoadingFallback} onRedirect={() => navigate('/')}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
          <UrAuth
            providers={{
              github: true,
              google: true,
              emailPassword: true,
            }}
            branding={{
              appName: "My Custom App",
              logo: "https://vite.dev/logo.svg",
              primaryColor: "#4F46E5",
            }}
            labels={{
              signInTitle: "Welcome back to Custom App",
              signInButton: "Proceed to App",
            }}
          />
        </div>
      </GuestRoute>
    );
  }

  // Default to protected dashboard
  return (
    <ProtectedRoute fallback={LoadingFallback} onRedirect={() => navigate('/login')}>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useUser();
  const { logout } = useAuth();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      
      {/* Naya component yahan dal diya! */}
      <UrUserButton 
        onSettingsClick={() => alert('Settings Clicked')} 
        onProfileClick={() => alert('Profile Clicked')} 
      />

      <div style={{ 
        width: '100%', 
        maxWidth: '500px', 
        background: '#ffffff', 
        borderRadius: '16px', 
        padding: '40px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 20px 40px -12px rgba(0,0,0,0.1)',
        border: '1px solid #e4e4e7',
        fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          {typeof user?.avatarUrl === 'string' && user?.avatarUrl ? (
                <img src={user.avatarUrl } alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e4e4e7' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 600, color: '#71717a', border: '1px solid #e4e4e7' }}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: 700 }}>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '15px' }}>You are successfully authenticated</p>
          </div>
        </div>

        <div style={{ background: '#fafafa', borderRadius: '12px', padding: '20px', border: '1px solid #e4e4e7', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#a1a1aa', fontWeight: 600 }}>Your Profile</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>Email</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>{user?.email}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>Name</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>{user?.name || 'Not provided'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>User ID</span>
            <span style={{ color: '#0f172a', fontWeight: 500, fontFamily: 'monospace' }}>{user?._id}</span>
          </div>
        </div>

        <button 
          onClick={logout}
          style={{ 
            width: '100%', 
            padding: '12px 14px', 
            borderRadius: '8px', 
            background: '#09090b', 
            color: '#ffffff', 
            fontSize: '14px', 
            fontWeight: 500, 
            border: 'none', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default App;
