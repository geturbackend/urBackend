import { useState, useEffect } from 'react';
import { UrAuth, ProtectedRoute, GuestRoute, useUser, UrUserButton } from '@urbackend/react';
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b', background: '#f8fafc' }}>
      Loading urBackend...
    </div>
  );

  if (route === '/login') {
    return (
      <GuestRoute fallback={LoadingFallback} onRedirect={() => navigate('/')}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
          <UrAuth providers={['google', 'github']} theme="light" />
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
  const { user, logout } = useUser();

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
        borderRadius: '0', 
        padding: '40px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '0', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '0', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 600, color: '#64748b' }}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: 700 }}>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '15px' }}>You are successfully authenticated</p>
          </div>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '0', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 600 }}>Your Profile</h3>
          
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
            padding: '14px', 
            borderRadius: '0', 
            background: 'linear-gradient(180deg, #2a2a2a 0%, #111111 100%)', 
            color: '#ffffff', 
            fontSize: '15px', 
            fontWeight: 600, 
            border: 'none', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
            cursor: 'pointer',
            transition: 'transform 0.1s ease'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default App;
