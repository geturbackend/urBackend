import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks';
import { Toast } from './Toast';

type AuthProvider = 'google' | 'github';
type ThemeMode = 'light' | 'dark';

interface AuthColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  inputBackground: string;
  primary: string;
  primaryColor?: string;
  primaryText: string;
  footerBackground: string;
  dividerText: string;
  socialButtonBackground: string;
}

interface AuthBranding {
  brandName?: string;
  appName?: string;
  title?: string;
  subtitle?: string;
  logo?: React.ReactNode | string;
  logoUrl?: string;
  primaryColor?: string;
}

interface AuthLabels {
  loginTab: string;
  signupTab: string;
  loginTitle: string;
  signupTitle: string;
  forgotTitle: string;
  resetTitle: string;
  loginButton: string;
  signupButton: string;
  forgotButton: string;
  resetButton: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  nameLabel: string;
  namePlaceholder: string;
  otpLabel: string;
  otpPlaceholder: string;
  forgotPasswordLink: string;
  socialDivider: string;
  googleButton: string;
  githubButton: string;
  footerSigninPrompt: string;
  footerSignupPrompt: string;
  footerForgotPrompt: string;
  noAuthMethods: string;
  forgotSubtitle: string;
 resetSubtitle: string;
  // Aliases support
  signInTitle?: string;
  signUpTitle?: string;
  signInTab?: string;
  signUpTab?: string;
  signInButton?: string;
  signUpButton?: string;
}

export interface UrAuthProps {
  providers?: AuthProvider[] | {
    google?: boolean;
    github?: boolean;
    emailPassword?: boolean;
  };
  enableEmailPassword?: boolean;
  theme?: ThemeMode;
  colors?: Partial<AuthColors>;
  branding?: AuthBranding;
  labels?: Partial<AuthLabels>;
  onSuccess?: () => void;
}

const defaultLabels: AuthLabels = {
  loginTab: 'Login',
  signupTab: 'Sign Up',
  loginTitle: 'Welcome back',
  signupTitle: 'Create your account',
  forgotTitle: 'Reset Password',
  resetTitle: 'Enter Reset Code',
  loginButton: 'Log In',
  signupButton: 'Create Account',
  forgotButton: 'Send Reset Code',
  resetButton: 'Reset Password',
  emailLabel: 'Email address',
  emailPlaceholder: 'Enter your email address',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Enter your password',
  nameLabel: 'Full Name',
  namePlaceholder: 'Enter your name',
  otpLabel: '6-digit OTP Code',
  otpPlaceholder: 'Enter reset code',
  forgotPasswordLink: 'Forgot password?',
  socialDivider: 'OR',
  googleButton: 'Continue with Google',
  githubButton: 'Continue with GitHub',
  footerSigninPrompt: "Don't have an account yet?",
  footerSignupPrompt: 'Already have an account?',
  footerForgotPrompt: 'Remember your password?',
  noAuthMethods: 'No authentication methods are enabled for this screen.',
  forgotSubtitle: 'Welcome back',
 resetSubtitle: 'Enter the code sent to {email}',
};

const defaultThemeColors: Record<ThemeMode, AuthColors> = {
  light: {
    background: '#ffffff',
    surface: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    inputBackground: '#ffffff',
    primary: '#111111',
    primaryText: '#ffffff',
    footerBackground: '#f8fafc',
    dividerText: '#94a3b8',
    socialButtonBackground: '#ffffff',
  },
  dark: {
    background: '#1a1a1a',
    surface: '#1a1a1a',
    text: '#ffffff',
    textMuted: '#a1a1aa',
    border: '#333333',
    inputBackground: '#2a2a2a',
    primary: '#ffffff',
    primaryText: '#111111',
    footerBackground: '#222222',
    dividerText: '#94a3b8',
    socialButtonBackground: '#2a2a2a',
  },
};

// Helper to adjust brightness of hex colors for professional gradient stops
const adjustColor = (color: string, percent: number) => {
  try {
    if (color.startsWith('#')) {
      let hex = color.replace('#', '');
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);

      r = Math.min(255, Math.max(0, r + percent));
      g = Math.min(255, Math.max(0, g + percent));
      b = Math.min(255, Math.max(0, b + percent));

      const rr = r.toString(16).padStart(2, '0');
     const gg = g.toString(16).padStart(2, '0');
      const bb = b.toString(16).padStart(2, '0');

      return `#${rr}${gg}${bb}`;
    }
  } catch (e) {
    // Safe fallback to original color
  }
  return color;
};




export const UrAuth: React.FC<UrAuthProps> = ({ 
  providers = ['google', 'github'], 
  enableEmailPassword = true,
  theme = 'light',
  colors,
  branding,
  labels,
  onSuccess
}) => {
  const { login, signUp, socialLogin, requestPasswordReset, resetPassword, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

 const text = {
  ...defaultLabels,
  ...labels,
  loginTab: labels?.signInTab ?? labels?.loginTab ?? defaultLabels.loginTab,
  loginTitle: labels?.signInTitle ?? labels?.loginTitle ?? defaultLabels.loginTitle,
  loginButton: labels?.signInButton ?? labels?.loginButton ?? defaultLabels.loginButton,
  signupTab: labels?.signUpTab ?? labels?.signupTab ?? defaultLabels.signupTab,
  signupTitle: labels?.signUpTitle ?? labels?.signupTitle ?? defaultLabels.signupTitle,
  signupButton: labels?.signUpButton ?? labels?.signupButton ?? defaultLabels.signupButton,
};

  const themeColors = { ...defaultThemeColors[theme], ...colors };
  const primaryColor = branding?.primaryColor || colors?.primaryColor || themeColors.primary;
  const secondStopColor = adjustColor(primaryColor, -15);

  let isGoogleEnabled = true;
  let isGithubEnabled = true;
  let isEmailPasswordEnabled = enableEmailPassword;

  if (providers) {
    if (Array.isArray(providers)) {
      isGoogleEnabled = providers.includes('google');
      isGithubEnabled = providers.includes('github');
    } else if (typeof providers === 'object') {
      isGoogleEnabled = !!providers.google;
      isGithubEnabled = !!providers.github;
       isEmailPasswordEnabled = providers.emailPassword !== undefined ? providers.emailPassword : enableEmailPassword;
    }
  }

  const hasPasswordAuth = isEmailPasswordEnabled;
  const hasSocialAuth = isGoogleEnabled || isGithubEnabled;
  const brandName = branding?.brandName || branding?.appName || branding?.title || 'urBackend';
  const headerTitle = branding?.title || brandName;
  const brandingLogo = branding?.logo ?? branding?.logoUrl;
  const headerSubtitle = branding?.subtitle || (mode === 'signin'
    ? text.loginTitle
    : mode === 'signup'
      ? text.signupTitle
      : mode === 'forgot'
        ? text.forgotTitle
        : text.resetTitle);
  const showSwitcher = hasPasswordAuth;

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
    }
  }, [error]);

  useEffect(() => {
    if (!hasPasswordAuth && mode !== 'signin') {
      setMode('signin');
    }
  }, [hasPasswordAuth, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'signin') {
        await login({ email, password });
        setToast({ message: 'Welcome back!', type: 'success' });
        if (onSuccess) onSuccess();
      } else if (mode === 'signup') {
        await signUp({ email, password, name });
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
      // Errors are surfaced via the shared auth hook state.
    }
  };

  const styles = {
    wrapper: {
      width: '100%',
      maxWidth: '420px',
      margin: '0 auto',
      borderRadius: '0',
      background: themeColors.background,
      boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05)',
      border: `1px solid ${themeColors.border}`,
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: themeColors.text,
    },
    body: {
      padding: '32px 32px 24px 32px',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '28px',
    },
    brandRow: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '10px',
    },
    brandLogo: {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme === 'dark' ? '#2a2a2a' : '#f1f5f9',
      color: themeColors.text,
      overflow: 'hidden' as const,
    },
    brandTitle: {
      margin: 0,
      fontSize: '26px',
      lineHeight: 1.1,
      fontWeight: 800,
      color: themeColors.text,
    },
    brandSubtitle: {
      margin: '0 auto',
      maxWidth: '320px',
      fontSize: '14px',
      lineHeight: 1.5,
      color: themeColors.textMuted,
    },
    switcherContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '32px'
    },
    switcher: {
      display: 'inline-flex',
      background: theme === 'dark' ? '#2a2a2a' : '#f1f5f9',
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
      color: active ? themeColors.text : themeColors.textMuted,
      background: active ? (theme === 'dark' ? '#444444' : '#ffffff') : 'transparent',
      boxShadow: active ? (theme === 'dark' ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)') : 'none',
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
      color: theme === 'dark' ? '#dddddd' : '#334155',
    },
    forgotLink: {
      fontSize: '12px',
      fontWeight: 600,
      color: themeColors.text,
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
      border: `1px solid ${themeColors.border}`,
      background: themeColors.inputBackground,
      color: themeColors.text,
      fontSize: '14px',
      boxSizing: 'border-box' as const,
      outline: 'none',
      transition: 'border-color 0.2s ease',
    },
    primaryBtn: {
      width: '100%',
      padding: '14px',
      borderRadius: '0',
      background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondStopColor} 100%)`,
      color: themeColors.primaryText,
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
      color: themeColors.dividerText,
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '1px',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: themeColors.border,
    },
    dividerText: {
      padding: '0 12px',
    },
    socialBtn: {
      width: '100%',
      padding: '12px',
      borderRadius: '0',
      border: `1px solid ${themeColors.border}`,
      background: themeColors.socialButtonBackground,
      color: themeColors.text,
      fontSize: '14px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginBottom: '12px',
      cursor: 'pointer',
      boxShadow: theme === 'dark' ? 'none' : '0 1px 2px rgba(0,0,0,0.02)',
      transition: 'background 0.2s ease',
    },
    footer: {
      background: themeColors.footerBackground,
      padding: '24px',
      textAlign: 'center' as const,
      borderTop: `1px solid ${themeColors.border}`,
      fontSize: '13px',
      color: themeColors.textMuted,
    },
    footerLink: {
      color: themeColors.text,
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill={theme === 'dark' ? '#fff' : '#000'}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );

  const renderSocialButtons = () => {
    if (!hasSocialAuth) {
      return null;
    }

    return (
      <>
        {hasPasswordAuth && (
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>{text.socialDivider}</span>
            <div style={styles.dividerLine} />
          </div>
        )}

        <div>
          {isGoogleEnabled && (
            <button style={styles.socialBtn} onClick={() => socialLogin('google')} type="button">
              <GoogleIcon />
              {text.googleButton}
            </button>
          )}
          {isGithubEnabled && (
            <button style={styles.socialBtn} onClick={() => socialLogin('github')} type="button">
              <GithubIcon />
              {text.githubButton}
            </button>
          )}
        </div>
      </>
    );
  };

  const footerPrompt = mode === 'signin'
    ? text.footerSigninPrompt
    : mode === 'signup'
      ? text.footerSignupPrompt
      : text.footerForgotPrompt;

  return (
    <div style={styles.wrapper}>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          isDark={theme === 'dark'} 
          onClose={() => {
            setToast(null);
            if (toast.type === 'error') clearError();
          }} 
        />
      )}
      
      <div style={styles.body}>
        {(brandingLogo || branding?.brandName || branding?.appName || branding?.title || branding?.subtitle || headerTitle || headerSubtitle) && (
          <div style={styles.header}>
            <div style={styles.brandRow}>
              {brandingLogo ? (
                <div style={styles.brandLogo}>
                  {typeof brandingLogo === 'string' ? (
                    <img src={brandingLogo} alt={brandName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    brandingLogo
                  )}
                </div>
              ) : (
                <div style={styles.brandLogo} aria-hidden="true">
                  {brandName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <h1 style={styles.brandTitle}>{headerTitle}</h1>
            <p style={styles.brandSubtitle}>{headerSubtitle}</p>
          </div>
        )}

        {showSwitcher && (mode === 'signin' || mode === 'signup') && (
          <div style={styles.switcherContainer}>
            <div style={styles.switcher}>
              <button 
                type="button"
                style={styles.switchBtn(mode === 'signin')} 
                onClick={() => { setMode('signin'); clearError(); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                {text.loginTab}
              </button>
              <button 
                type="button"
                style={styles.switchBtn(mode === 'signup')} 
                onClick={() => { setMode('signup'); clearError(); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                {text.signupTab}
              </button>
            </div>
          </div>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: themeColors.text }}>
              {mode === 'forgot' ? text.forgotTitle : text.resetTitle}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: themeColors.textMuted }}>
                {mode === 'forgot' ? text.forgotSubtitle : text.resetSubtitle.replace('{email}', email)}
              
            </p>
          </div>
        )}

        {!hasPasswordAuth && !hasSocialAuth && (
          <div style={{ textAlign: 'center', color: themeColors.textMuted, fontSize: '14px', lineHeight: 1.5 }}>
            {text.noAuthMethods}
          </div>
        )}

        {hasPasswordAuth && (
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>{text.nameLabel}</label>
                </div>
                <input
                  style={styles.input}
                  type="text"
                  placeholder={text.namePlaceholder}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>{text.emailLabel}</label>
              </div>
              <input
                style={styles.input}
                type="email"
                placeholder={text.emailPlaceholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                readOnly={mode === 'reset'}
              />
            </div>

            {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>{mode === 'reset' ? text.passwordLabel : text.passwordLabel}</label>
                  {mode === 'signin' && (
                    <button type="button" style={styles.forgotLink} onClick={() => { setMode('forgot'); clearError(); }}>
                      {text.forgotPasswordLink}
                    </button>
                  )}
                </div>
                <input
                  style={styles.input}
                  type="password"
                  placeholder={text.passwordPlaceholder}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {mode === 'reset' && (
              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>{text.otpLabel}</label>
                </div>
                <input
                  style={styles.input}
                  type="text"
                  placeholder={text.otpPlaceholder}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
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
                : (mode === 'signin' ? text.loginButton 
                  : mode === 'signup' ? text.signupButton 
                  : mode === 'forgot' ? text.forgotButton 
                  : text.resetButton)
              }
            </button>
          </form>
        )}

        {(mode === 'signin' || mode === 'signup') && renderSocialButtons()}
      </div>

      {hasPasswordAuth && (
        <div style={styles.footer}>
          {footerPrompt}
          <button 
            type="button"
            style={styles.footerLink}
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              clearError();
            }}
          >
            {mode === 'signin' ? text.signupTab : text.loginTab}
          </button>
        </div>
      )}
    </div>
  );
};
