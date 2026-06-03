import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';
import { Toast } from './Toast';

export interface UrAuthProps {
  providers?: ('google' | 'github')[];
  theme?: 'light' | 'dark'; // Dark mode not perfectly matched to image, but kept for API compat
  onSuccess?: () => void;
}

export const UrAuth: React.FC<UrAuthProps> = ({ 
  providers = ['google', 'github'], 
  theme = 'light',
  onSuccess
}) => {
  const { login, signUp, socialLogin, requestPasswordReset, resetPassword, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'signin') {
        await login({ email, password });
        setToast({ message: 'Welcome back!', type: 'success' });
        if (onSuccess) onSuccess();
      } else if (mode === 'signup') {
        await signUp({ email, password, name });
        // Auto-login after signup for convenience
        await login({ email, password });
        setToast({ message: 'Account created successfully!', type: 'success' });
        if (onSuccess) onSuccess();
      } else if (mode === 'forgot') {
        await requestPasswordReset({ email });
        setToast({ message: 'Reset code sent to your email', type: 'success' });
        setMode('reset');
      } else if (mode === 'reset') {
        await resetPassword({ email, otp, newPassword: password });
        setToast({ message: 'Password reset successfully', type: 'success' });
        setMode('signin');
        setPassword('');
        setOtp('');
      }
    } catch (err: any) {
      // Error is now handled and stored globally by useAuth hook, which triggers the useEffect toast
    }
  };

  const isDark = theme === 'dark';
  const bg = isDark ? '#1a1a1a' : '#ffffff';
  const text = isDark ? '#ffffff' : '#0f172a';
  const textMuted = isDark ? '#a1a1aa' : '#64748b';
  const border = isDark ? '#333' : '#e2e8f0';
  const inputBg = isDark ? '#2a2a2a' : '#ffffff';
  
  const styles = {
    wrapper: {
      width: '100%',
      maxWidth: '420px',
      margin: '0 auto',
      borderRadius: '0',
      background: bg,
      boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05)',
      border: `1px solid ${border}`,
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: text,
    },
    body: {
      padding: '32px 32px 24px 32px',
    },
    switcherContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '32px'
    },
    switcher: {
      display: 'inline-flex',
      background: isDark ? '#2a2a2a' : '#f1f5f9',
      padding: '4px',
      borderRadius: '0',
    },
    switchBtn: (active: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 20px',
      borderRadius: '0',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      color: active ? text : textMuted,
      background: active ? (isDark ? '#444' : '#ffffff') : 'transparent',
      boxShadow: active ? (isDark ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)') : 'none',
      border: 'none',
      transition: 'all 0.2s ease',
    }),
    field: {
      marginBottom: '20px',
    },
    labelRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    label: {
      fontSize: '13px',
      fontWeight: 600,
      color: isDark ? '#ddd' : '#334155',
    },
    forgotLink: {
      fontSize: '12px',
      fontWeight: 600,
      color: text,
      cursor: 'pointer',
      textDecoration: 'none',
      background: 'none',
      border: 'none',
      padding: 0,
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '0',
      border: `1px solid ${border}`,
      background: inputBg,
      color: text,
      fontSize: '14px',
      boxSizing: 'border-box' as const,
      outline: 'none',
      transition: 'border-color 0.2s ease',
    },
    primaryBtn: {
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
      marginTop: '8px',
      transition: 'transform 0.1s ease',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '24px 0',
      color: '#94a3b8',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '1px',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: border,
    },
    dividerText: {
      padding: '0 12px',
    },
    socialBtn: {
      width: '100%',
      padding: '12px',
      borderRadius: '0',
      border: `1px solid ${border}`,
      background: isDark ? '#2a2a2a' : '#ffffff',
      color: text,
      fontSize: '14px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '12px',
      cursor: 'pointer',
      boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.02)',
      transition: 'background 0.2s ease',
    },
    footer: {
      background: isDark ? '#222' : '#f8fafc',
      padding: '24px',
      textAlign: 'center' as const,
      borderTop: `1px solid ${border}`,
      fontSize: '13px',
      color: textMuted,
    },
    footerLink: {
      color: text,
      fontWeight: 600,
      textDecoration: 'underline',
      cursor: 'pointer',
      marginLeft: '4px',
      background: 'none',
      border: 'none',
      padding: 0,
    }
  };

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const GithubIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={isDark ? '#fff' : '#000'}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );

  return (
    <div style={styles.wrapper}>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          isDark={isDark} 
          onClose={() => {
            setToast(null);
            if (toast.type === 'error') clearError();
          }} 
        />
      )}
      
      <div style={styles.body}>
        {(mode === 'signin' || mode === 'signup') && (
          <div style={styles.switcherContainer}>
            <div style={styles.switcher}>
              <button 
                type="button"
                style={styles.switchBtn(mode === 'signin')} 
                onClick={() => { setMode('signin'); clearError(); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Login
              </button>
              <button 
                type="button"
                style={styles.switchBtn(mode === 'signup')} 
                onClick={() => { setMode('signup'); clearError(); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Sign Up
              </button>
            </div>
          </div>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: text }}>
              {mode === 'forgot' ? 'Reset Password' : 'Enter Reset Code'}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: textMuted }}>
              {mode === 'forgot' ? "Enter your email and we'll send a code" : `Enter the code sent to ${email}`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Full Name</label>
              </div>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Email address</label>
            </div>
            <input
              style={styles.input}
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              readOnly={mode === 'reset'}
            />
          </div>

          {mode === 'reset' && (
            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>6-digit OTP Code</label>
              </div>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter reset code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
              />
            </div>
          )}

          {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>{mode === 'reset' ? 'New Password' : 'Password'}</label>
                {mode === 'signin' && (
                  <button type="button" style={styles.forgotLink} onClick={() => { setMode('forgot'); clearError(); }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                style={styles.input}
                type="password"
                placeholder={mode === 'reset' ? "Enter new password" : "Enter your password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button style={styles.primaryBtn} type="submit" disabled={isLoading} 
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isLoading 
              ? 'Processing...' 
              : (mode === 'signin' ? 'Log In' 
                : mode === 'signup' ? 'Create Account' 
                : mode === 'forgot' ? 'Send Reset Code' 
                : 'Reset Password')
            }
          </button>
        </form>

        {(mode === 'signin' || mode === 'signup') && providers && providers.length > 0 && (
          <>
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>OR</span>
              <div style={styles.dividerLine} />
            </div>

            <div>
              {providers.includes('google') && (
                <button style={styles.socialBtn} onClick={() => socialLogin('google')} type="button">
                  <GoogleIcon />
                  Continue with Google
                </button>
              )}
              {providers.includes('github') && (
                <button style={styles.socialBtn} onClick={() => socialLogin('github')} type="button">
                  <GithubIcon />
                  Continue with GitHub
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div style={styles.footer}>
        {mode === 'signin' ? "Don't have an account yet?" 
          : mode === 'signup' ? "Already have an account?"
          : "Remember your password?"}
        <button 
          type="button"
          style={styles.footerLink}
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            clearError();
          }}
        >
          {mode === 'signin' ? 'Sign up' : 'Log in'}
        </button>
      </div>
    </div>
  );
};
