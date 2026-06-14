// src/context.tsx
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { UrBackendClient } from "@urbackend/sdk";
import { jsx } from "react/jsx-runtime";
var UrContext = createContext(void 0);
var UrProvider = ({ apiKey, baseUrl, children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { client, auth, db, storage } = useMemo(() => {
    const _client = new UrBackendClient({ apiKey, baseUrl });
    return {
      client: _client,
      auth: _client.auth,
      db: _client.db,
      storage: _client.storage
    };
  }, [apiKey, baseUrl]);
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          const savedToken = localStorage.getItem("ur_auth_token");
          if (savedToken) auth.setToken(savedToken);
        }
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get("token");
        const rtCode = urlParams.get("rtCode");
        const error2 = urlParams.get("error");
        if (error2) {
          console.error("Social Auth Error:", error2);
          if (mounted) setError(error2);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (token) {
          auth.setToken(token);
          if (typeof window !== "undefined") localStorage.setItem("ur_auth_token", token);
          if (rtCode) {
            try {
              const exRes = await auth.socialExchange({ token, rtCode });
              const exToken = exRes.accessToken || exRes.token;
              if (exToken && typeof window !== "undefined") localStorage.setItem("ur_auth_token", exToken);
            } catch (err) {
              console.error("Failed to exchange refresh token", err);
              if (mounted) setError(err.message || "Failed to complete social login");
              throw err;
            }
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          try {
            const res = await auth.refreshToken();
            const newToken = res.accessToken || res.token;
            if (newToken && typeof window !== "undefined") localStorage.setItem("ur_auth_token", newToken);
          } catch (e) {
          }
        }
        const currentUser = await auth.me();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error2) {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };
    initAuth();
    return () => {
      mounted = false;
    };
  }, [auth]);
  const value = {
    client,
    auth,
    db,
    storage,
    user,
    setUser,
    isInitializing,
    isLoading,
    setIsLoading,
    error,
    setError
  };
  return /* @__PURE__ */ jsx(UrContext.Provider, { value, children });
};
var useUrContext = () => {
  const context = useContext(UrContext);
  if (!context) {
    throw new Error("useUrContext must be used within an UrProvider");
  }
  return context;
};

// src/hooks.ts
import { useCallback } from "react";
var useAuth = () => {
  const { auth, user, setUser, isInitializing, isLoading, setIsLoading, error, setError } = useUrContext();
  if (!auth) {
    throw new Error("Auth module not initialized. Make sure you are inside UrProvider.");
  }
  const login = useCallback(async (payload) => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await auth.login(payload);
      const token = res.accessToken || res.token;
      if (token && typeof window !== "undefined") localStorage.setItem("ur_auth_token", token);
      const currentUser = await auth.me();
      setUser(currentUser);
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setUser, setIsLoading, setError]);
  const signUp = useCallback(async (payload) => {
    try {
      setError(null);
      setIsLoading(true);
      const newUser = await auth.signUp(payload);
      return newUser;
    } catch (err) {
      setError(err.message || "Sign up failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setIsLoading, setError]);
  const logout = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      await auth.logout();
      if (typeof window !== "undefined") localStorage.removeItem("ur_auth_token");
      setUser(null);
    } catch (err) {
      setError(err.message || "Logout failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setUser, setIsLoading, setError]);
  const socialLogin = useCallback((provider) => {
    setError(null);
    const url = auth.socialStart(provider);
    window.location.href = url;
  }, [auth, setError]);
  const verifyEmail = useCallback(async (payload) => {
    try {
      setError(null);
      return await auth.verifyEmail(payload);
    } catch (err) {
      setError(err.message || "Email verification failed");
      throw err;
    }
  }, [auth, setError]);
  const changePassword = useCallback(async (payload) => {
    try {
      setError(null);
      return await auth.changePassword(payload);
    } catch (err) {
      setError(err.message || "Failed to change password");
      throw err;
    }
  }, [auth, setError]);
  const requestPasswordReset = useCallback(async (payload) => {
    try {
      setError(null);
      setIsLoading(true);
      return await auth.requestPasswordReset(payload);
    } catch (err) {
      setError(err.message || "Failed to request password reset");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setError, setIsLoading]);
  const resetPassword = useCallback(async (payload) => {
    try {
      setError(null);
      setIsLoading(true);
      return await auth.resetPassword(payload);
    } catch (err) {
      setError(err.message || "Failed to reset password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auth, setError, setIsLoading]);
  const clearError = useCallback(() => setError(null), [setError]);
  return {
    user,
    isInitializing,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    signUp,
    logout,
    socialLogin,
    verifyEmail,
    changePassword,
    requestPasswordReset,
    resetPassword,
    clearError,
    authApi: auth
    // Escape hatch to underlying SDK
  };
};
var useUser = () => {
  const { user, isInitializing, isLoading, error } = useUrContext();
  return {
    user,
    isInitializing,
    isLoading,
    error,
    isAuthenticated: !!user
  };
};
var useDb = () => {
  const { db } = useUrContext();
  if (!db) {
    throw new Error("Database module not initialized.");
  }
  return db;
};
var useStorage = () => {
  const { storage } = useUrContext();
  if (!storage) {
    throw new Error("Storage module not initialized.");
  }
  return storage;
};

// src/components.tsx
import { useEffect as useEffect2 } from "react";
import { Fragment, jsx as jsx2 } from "react/jsx-runtime";
var ProtectedRoute = ({
  children,
  redirectTo = "/login",
  fallback = null,
  onRedirect
}) => {
  const { isAuthenticated, isInitializing } = useUser();
  useEffect2(() => {
    if (!isInitializing && !isAuthenticated) {
      if (onRedirect) {
        onRedirect();
      } else if (typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
    }
  }, [isAuthenticated, isInitializing, redirectTo, onRedirect]);
  if (isInitializing) {
    return fallback;
  }
  if (!isAuthenticated) {
    return fallback;
  }
  return /* @__PURE__ */ jsx2(Fragment, { children });
};
var GuestRoute = ({
  children,
  redirectTo = "/dashboard",
  fallback = null,
  onRedirect
}) => {
  const { isAuthenticated, isInitializing } = useUser();
  useEffect2(() => {
    if (!isInitializing && isAuthenticated) {
      if (onRedirect) {
        onRedirect();
      } else if (typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
    }
  }, [isAuthenticated, isInitializing, redirectTo, onRedirect]);
  if (isInitializing) {
    return fallback;
  }
  if (isAuthenticated) {
    return fallback;
  }
  return /* @__PURE__ */ jsx2(Fragment, { children });
};

// src/components/UrAuth.tsx
import { useEffect as useEffect4, useState as useState3 } from "react";

// src/components/Toast.tsx
import { useEffect as useEffect3, useState as useState2 } from "react";
import { Fragment as Fragment2, jsx as jsx3, jsxs } from "react/jsx-runtime";
var Toast = ({ message, type, onClose, isDark = false }) => {
  const [isVisible, setIsVisible] = useState2(false);
  const [isLeaving, setIsLeaving] = useState2(false);
  useEffect3(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    let innerTimer;
    const timer = setTimeout(() => {
      setIsLeaving(true);
      innerTimer = setTimeout(onClose, 300);
    }, 4e3);
    return () => {
      clearTimeout(timer);
      if (innerTimer) clearTimeout(innerTimer);
    };
  }, [onClose]);
  const bgColor = isDark ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)";
  const borderColor = type === "success" ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)";
  const iconColor = type === "success" ? "#22c55e" : "#ef4444";
  const textColor = isDark ? "#fff" : "#000";
  return /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx3("style", { children: `
          @keyframes slideIn {
            from { transform: translate(-50%, -20px) scale(0.95); opacity: 0; }
            to { transform: translate(-50%, 0) scale(1); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translate(-50%, 0) scale(1); opacity: 1; }
            to { transform: translate(-50%, -20px) scale(0.95); opacity: 0; }
          }
        ` }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 20px",
          borderRadius: "0",
          background: bgColor,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${borderColor}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          color: textColor,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          animation: isLeaving ? "slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        },
        children: [
          type === "success" ? /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: iconColor, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx3("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
            /* @__PURE__ */ jsx3("polyline", { points: "22 4 12 14.01 9 11.01" })
          ] }) : /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: iconColor, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsx3("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
            /* @__PURE__ */ jsx3("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
          ] }),
          message
        ]
      }
    )
  ] });
};

// src/components/UrAuth.tsx
import { Fragment as Fragment3, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var defaultLabels = {
  loginTab: "Login",
  signupTab: "Sign Up",
  loginTitle: "Welcome back",
  signupTitle: "Create your account",
  forgotTitle: "Reset Password",
  resetTitle: "Enter Reset Code",
  loginButton: "Log In",
  signupButton: "Create Account",
  forgotButton: "Send Reset Code",
  resetButton: "Reset Password",
  emailLabel: "Email address",
  emailPlaceholder: "Enter your email address",
  passwordLabel: "Password",
  passwordPlaceholder: "Enter your password",
  nameLabel: "Full Name",
  namePlaceholder: "Enter your name",
  otpLabel: "6-digit OTP Code",
  otpPlaceholder: "Enter reset code",
  forgotPasswordLink: "Forgot password?",
  socialDivider: "OR",
  googleButton: "Continue with Google",
  githubButton: "Continue with GitHub",
  footerSigninPrompt: "Don't have an account yet?",
  footerSignupPrompt: "Already have an account?",
  footerForgotPrompt: "Remember your password?",
  noAuthMethods: "No authentication methods are enabled for this screen.",
  forgotSubtitle: "Welcome back",
  resetSubtitle: "Enter the code sent to {email}"
};
var defaultThemeColors = {
  light: {
    background: "#ffffff",
    surface: "#ffffff",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    inputBackground: "#ffffff",
    primary: "#111111",
    primaryText: "#ffffff",
    footerBackground: "#f8fafc",
    dividerText: "#94a3b8",
    socialButtonBackground: "#ffffff"
  },
  dark: {
    background: "#1a1a1a",
    surface: "#1a1a1a",
    text: "#ffffff",
    textMuted: "#a1a1aa",
    border: "#333333",
    inputBackground: "#2a2a2a",
    primary: "#ffffff",
    primaryText: "#111111",
    footerBackground: "#222222",
    dividerText: "#94a3b8",
    socialButtonBackground: "#2a2a2a"
  }
};
var adjustColor = (color, percent) => {
  try {
    if (color.startsWith("#")) {
      let hex = color.replace("#", "");
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);
      r = Math.min(255, Math.max(0, r + percent));
      g = Math.min(255, Math.max(0, g + percent));
      b = Math.min(255, Math.max(0, b + percent));
      const rr = r.toString(16).padStart(2, "0");
      const gg = g.toString(16).padStart(2, "0");
      const bb = b.toString(16).padStart(2, "0");
      return `#${rr}${gg}${bb}`;
    }
  } catch (e) {
  }
  return color;
};
var UrAuth = ({
  providers = ["google", "github"],
  enableEmailPassword = true,
  theme = "light",
  colors,
  branding,
  labels,
  onSuccess
}) => {
  const { login, signUp, socialLogin, requestPasswordReset, resetPassword, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState3("signin");
  const [email, setEmail] = useState3("");
  const [password, setPassword] = useState3("");
  const [otp, setOtp] = useState3("");
  const [name, setName] = useState3("");
  const [toast, setToast] = useState3(null);
  const text = {
    ...defaultLabels,
    ...labels,
    loginTab: labels?.signInTab ?? labels?.loginTab ?? defaultLabels.loginTab,
    loginTitle: labels?.signInTitle ?? labels?.loginTitle ?? defaultLabels.loginTitle,
    loginButton: labels?.signInButton ?? labels?.loginButton ?? defaultLabels.loginButton,
    signupTab: labels?.signUpTab ?? labels?.signupTab ?? defaultLabels.signupTab,
    signupTitle: labels?.signUpTitle ?? labels?.signupTitle ?? defaultLabels.signupTitle,
    signupButton: labels?.signUpButton ?? labels?.signupButton ?? defaultLabels.signupButton
  };
  const themeColors = { ...defaultThemeColors[theme], ...colors };
  const primaryColor = branding?.primaryColor || colors?.primaryColor || themeColors.primary;
  const secondStopColor = adjustColor(primaryColor, -15);
  let isGoogleEnabled = true;
  let isGithubEnabled = true;
  let isEmailPasswordEnabled = enableEmailPassword;
  if (providers) {
    if (Array.isArray(providers)) {
      isGoogleEnabled = providers.includes("google");
      isGithubEnabled = providers.includes("github");
    } else if (typeof providers === "object") {
      isGoogleEnabled = !!providers.google;
      isGithubEnabled = !!providers.github;
      isEmailPasswordEnabled = providers.emailPassword !== void 0 ? providers.emailPassword : enableEmailPassword;
    }
  }
  const hasPasswordAuth = isEmailPasswordEnabled;
  const hasSocialAuth = isGoogleEnabled || isGithubEnabled;
  const brandName = branding?.brandName || branding?.appName || branding?.title || "urBackend";
  const headerTitle = branding?.title || brandName;
  const brandingLogo = branding?.logo ?? branding?.logoUrl;
  const headerSubtitle = branding?.subtitle || (mode === "signin" ? text.loginTitle : mode === "signup" ? text.signupTitle : mode === "forgot" ? text.forgotTitle : text.resetTitle);
  const showSwitcher = hasPasswordAuth;
  useEffect4(() => {
    if (error) {
      setToast({ message: error, type: "error" });
    }
  }, [error]);
  useEffect4(() => {
    if (!hasPasswordAuth && mode !== "signin") {
      setMode("signin");
    }
  }, [hasPasswordAuth, mode]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "signin") {
        await login({ email, password });
        setToast({ message: "Welcome back!", type: "success" });
        if (onSuccess) onSuccess();
      } else if (mode === "signup") {
        await signUp({ email, password, name });
        await login({ email, password });
        setToast({ message: "Account created successfully!", type: "success" });
        if (onSuccess) onSuccess();
      } else if (mode === "forgot") {
        await requestPasswordReset({ email });
        setToast({ message: "Reset code sent to your email", type: "success" });
        setMode("reset");
      } else if (mode === "reset") {
        await resetPassword({ email, otp, newPassword: password });
        setToast({ message: "Password reset successfully", type: "success" });
        setMode("signin");
        setPassword("");
        setOtp("");
      }
    } catch (err) {
    }
  };
  const styles = {
    wrapper: {
      width: "100%",
      maxWidth: "420px",
      margin: "0 auto",
      borderRadius: "0",
      background: themeColors.background,
      boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.5)" : "0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05)",
      border: `1px solid ${themeColors.border}`,
      overflow: "hidden",
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: themeColors.text
    },
    body: {
      padding: "32px 32px 24px 32px"
    },
    header: {
      textAlign: "center",
      marginBottom: "28px"
    },
    brandRow: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "12px",
      marginBottom: "10px"
    },
    brandLogo: {
      width: "44px",
      height: "44px",
      borderRadius: "12px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: theme === "dark" ? "#2a2a2a" : "#f1f5f9",
      color: themeColors.text,
      overflow: "hidden"
    },
    brandTitle: {
      margin: 0,
      fontSize: "26px",
      lineHeight: 1.1,
      fontWeight: 800,
      color: themeColors.text
    },
    brandSubtitle: {
      margin: "0 auto",
      maxWidth: "320px",
      fontSize: "14px",
      lineHeight: 1.5,
      color: themeColors.textMuted
    },
    switcherContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "32px"
    },
    switcher: {
      display: "inline-flex",
      background: theme === "dark" ? "#2a2a2a" : "#f1f5f9",
      padding: "4px",
      borderRadius: "0"
    },
    switchBtn: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 20px",
      borderRadius: "0",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      color: active ? themeColors.text : themeColors.textMuted,
      background: active ? theme === "dark" ? "#444444" : "#ffffff" : "transparent",
      boxShadow: active ? theme === "dark" ? "0 2px 4px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.05)" : "none",
      border: "none",
      transition: "all 0.2s ease"
    }),
    field: {
      marginBottom: "20px"
    },
    labelRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px"
    },
    label: {
      fontSize: "13px",
      fontWeight: 600,
      color: theme === "dark" ? "#dddddd" : "#334155"
    },
    forgotLink: {
      fontSize: "12px",
      fontWeight: 600,
      color: themeColors.text,
      cursor: "pointer",
      textDecoration: "none",
      background: "none",
      border: "none",
      padding: 0
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "0",
      border: `1px solid ${themeColors.border}`,
      background: themeColors.inputBackground,
      color: themeColors.text,
      fontSize: "14px",
      boxSizing: "border-box",
      outline: "none",
      transition: "border-color 0.2s ease"
    },
    primaryBtn: {
      width: "100%",
      padding: "14px",
      borderRadius: "0",
      background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondStopColor} 100%)`,
      color: themeColors.primaryText,
      fontSize: "15px",
      fontWeight: 600,
      border: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      cursor: "pointer",
      marginTop: "8px",
      transition: "transform 0.1s ease"
    },
    divider: {
      display: "flex",
      alignItems: "center",
      margin: "24px 0",
      color: themeColors.dividerText,
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "1px"
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      background: themeColors.border
    },
    dividerText: {
      padding: "0 12px"
    },
    socialBtn: {
      width: "100%",
      padding: "12px",
      borderRadius: "0",
      border: `1px solid ${themeColors.border}`,
      background: themeColors.socialButtonBackground,
      color: themeColors.text,
      fontSize: "14px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      marginBottom: "12px",
      cursor: "pointer",
      boxShadow: theme === "dark" ? "none" : "0 1px 2px rgba(0,0,0,0.02)",
      transition: "background 0.2s ease"
    },
    footer: {
      background: themeColors.footerBackground,
      padding: "24px",
      textAlign: "center",
      borderTop: `1px solid ${themeColors.border}`,
      fontSize: "13px",
      color: themeColors.textMuted
    },
    footerLink: {
      color: themeColors.text,
      fontWeight: 600,
      textDecoration: "underline",
      cursor: "pointer",
      marginLeft: "4px",
      background: "none",
      border: "none",
      padding: 0
    }
  };
  const GoogleIcon = () => /* @__PURE__ */ jsxs2("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", children: [
    /* @__PURE__ */ jsx4("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }),
    /* @__PURE__ */ jsx4("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }),
    /* @__PURE__ */ jsx4("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z", fill: "#FBBC05" }),
    /* @__PURE__ */ jsx4("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })
  ] });
  const GithubIcon = () => /* @__PURE__ */ jsx4("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: theme === "dark" ? "#fff" : "#000", children: /* @__PURE__ */ jsx4("path", { d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" }) });
  const renderSocialButtons = () => {
    if (!hasSocialAuth) {
      return null;
    }
    return /* @__PURE__ */ jsxs2(Fragment3, { children: [
      hasPasswordAuth && /* @__PURE__ */ jsxs2("div", { style: styles.divider, children: [
        /* @__PURE__ */ jsx4("div", { style: styles.dividerLine }),
        /* @__PURE__ */ jsx4("span", { style: styles.dividerText, children: text.socialDivider }),
        /* @__PURE__ */ jsx4("div", { style: styles.dividerLine })
      ] }),
      /* @__PURE__ */ jsxs2("div", { children: [
        isGoogleEnabled && /* @__PURE__ */ jsxs2("button", { style: styles.socialBtn, onClick: () => socialLogin("google"), type: "button", children: [
          /* @__PURE__ */ jsx4(GoogleIcon, {}),
          text.googleButton
        ] }),
        isGithubEnabled && /* @__PURE__ */ jsxs2("button", { style: styles.socialBtn, onClick: () => socialLogin("github"), type: "button", children: [
          /* @__PURE__ */ jsx4(GithubIcon, {}),
          text.githubButton
        ] })
      ] })
    ] });
  };
  const footerPrompt = mode === "signin" ? text.footerSigninPrompt : mode === "signup" ? text.footerSignupPrompt : text.footerForgotPrompt;
  return /* @__PURE__ */ jsxs2("div", { style: styles.wrapper, children: [
    toast && /* @__PURE__ */ jsx4(
      Toast,
      {
        message: toast.message,
        type: toast.type,
        isDark: theme === "dark",
        onClose: () => {
          setToast(null);
          if (toast.type === "error") clearError();
        }
      }
    ),
    /* @__PURE__ */ jsxs2("div", { style: styles.body, children: [
      (brandingLogo || branding?.brandName || branding?.appName || branding?.title || branding?.subtitle || headerTitle || headerSubtitle) && /* @__PURE__ */ jsxs2("div", { style: styles.header, children: [
        /* @__PURE__ */ jsx4("div", { style: styles.brandRow, children: brandingLogo ? /* @__PURE__ */ jsx4("div", { style: styles.brandLogo, children: typeof brandingLogo === "string" ? /* @__PURE__ */ jsx4("img", { src: brandingLogo, alt: brandName, style: { width: "100%", height: "100%", objectFit: "contain" } }) : brandingLogo }) : /* @__PURE__ */ jsx4("div", { style: styles.brandLogo, "aria-hidden": "true", children: brandName.slice(0, 1).toUpperCase() }) }),
        /* @__PURE__ */ jsx4("h1", { style: styles.brandTitle, children: headerTitle }),
        /* @__PURE__ */ jsx4("p", { style: styles.brandSubtitle, children: headerSubtitle })
      ] }),
      showSwitcher && (mode === "signin" || mode === "signup") && /* @__PURE__ */ jsx4("div", { style: styles.switcherContainer, children: /* @__PURE__ */ jsxs2("div", { style: styles.switcher, children: [
        /* @__PURE__ */ jsxs2(
          "button",
          {
            type: "button",
            style: styles.switchBtn(mode === "signin"),
            onClick: () => {
              setMode("signin");
              clearError();
            },
            children: [
              /* @__PURE__ */ jsxs2("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx4("path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" }),
                /* @__PURE__ */ jsx4("polyline", { points: "10 17 15 12 10 7" }),
                /* @__PURE__ */ jsx4("line", { x1: "15", y1: "12", x2: "3", y2: "12" })
              ] }),
              text.loginTab
            ]
          }
        ),
        /* @__PURE__ */ jsxs2(
          "button",
          {
            type: "button",
            style: styles.switchBtn(mode === "signup"),
            onClick: () => {
              setMode("signup");
              clearError();
            },
            children: [
              /* @__PURE__ */ jsxs2("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx4("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
                /* @__PURE__ */ jsx4("circle", { cx: "9", cy: "7", r: "4" }),
                /* @__PURE__ */ jsx4("line", { x1: "19", y1: "8", x2: "19", y2: "14" }),
                /* @__PURE__ */ jsx4("line", { x1: "22", y1: "11", x2: "16", y2: "11" })
              ] }),
              text.signupTab
            ]
          }
        )
      ] }) }),
      (mode === "forgot" || mode === "reset") && /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "24px", textAlign: "center" }, children: [
        /* @__PURE__ */ jsx4("h2", { style: { margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: themeColors.text }, children: mode === "forgot" ? text.forgotTitle : text.resetTitle }),
        /* @__PURE__ */ jsx4("p", { style: { margin: 0, fontSize: "14px", color: themeColors.textMuted }, children: mode === "forgot" ? text.forgotSubtitle : text.resetSubtitle.replace("{email}", email) })
      ] }),
      !hasPasswordAuth && !hasSocialAuth && /* @__PURE__ */ jsx4("div", { style: { textAlign: "center", color: themeColors.textMuted, fontSize: "14px", lineHeight: 1.5 }, children: text.noAuthMethods }),
      hasPasswordAuth && /* @__PURE__ */ jsxs2("form", { onSubmit: handleSubmit, children: [
        mode === "signup" && /* @__PURE__ */ jsxs2("div", { style: styles.field, children: [
          /* @__PURE__ */ jsx4("div", { style: styles.labelRow, children: /* @__PURE__ */ jsx4("label", { style: styles.label, children: text.nameLabel }) }),
          /* @__PURE__ */ jsx4(
            "input",
            {
              style: styles.input,
              type: "text",
              placeholder: text.namePlaceholder,
              value: name,
              onChange: (e) => setName(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { style: styles.field, children: [
          /* @__PURE__ */ jsx4("div", { style: styles.labelRow, children: /* @__PURE__ */ jsx4("label", { style: styles.label, children: text.emailLabel }) }),
          /* @__PURE__ */ jsx4(
            "input",
            {
              style: styles.input,
              type: "email",
              placeholder: text.emailPlaceholder,
              value: email,
              onChange: (e) => setEmail(e.target.value),
              required: true,
              readOnly: mode === "reset"
            }
          )
        ] }),
        (mode === "signin" || mode === "signup" || mode === "reset") && /* @__PURE__ */ jsxs2("div", { style: styles.field, children: [
          /* @__PURE__ */ jsxs2("div", { style: styles.labelRow, children: [
            /* @__PURE__ */ jsx4("label", { style: styles.label, children: mode === "reset" ? text.passwordLabel : text.passwordLabel }),
            mode === "signin" && /* @__PURE__ */ jsx4("button", { type: "button", style: styles.forgotLink, onClick: () => {
              setMode("forgot");
              clearError();
            }, children: text.forgotPasswordLink })
          ] }),
          /* @__PURE__ */ jsx4(
            "input",
            {
              style: styles.input,
              type: "password",
              placeholder: text.passwordPlaceholder,
              value: password,
              onChange: (e) => setPassword(e.target.value),
              required: true
            }
          )
        ] }),
        mode === "reset" && /* @__PURE__ */ jsxs2("div", { style: styles.field, children: [
          /* @__PURE__ */ jsx4("div", { style: styles.labelRow, children: /* @__PURE__ */ jsx4("label", { style: styles.label, children: text.otpLabel }) }),
          /* @__PURE__ */ jsx4(
            "input",
            {
              style: styles.input,
              type: "text",
              placeholder: text.otpPlaceholder,
              value: otp,
              onChange: (e) => setOtp(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsx4(
          "button",
          {
            style: styles.primaryBtn,
            type: "submit",
            disabled: isLoading,
            onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.98)",
            onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
            onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)",
            children: isLoading ? "Processing..." : mode === "signin" ? text.loginButton : mode === "signup" ? text.signupButton : mode === "forgot" ? text.forgotButton : text.resetButton
          }
        )
      ] }),
      (mode === "signin" || mode === "signup") && renderSocialButtons()
    ] }),
    hasPasswordAuth && /* @__PURE__ */ jsxs2("div", { style: styles.footer, children: [
      footerPrompt,
      /* @__PURE__ */ jsx4(
        "button",
        {
          type: "button",
          style: styles.footerLink,
          onClick: () => {
            setMode(mode === "signin" ? "signup" : "signin");
            clearError();
          },
          children: mode === "signin" ? text.signupTab : text.loginTab
        }
      )
    ] })
  ] });
};

// src/components/UrUserButton.tsx
import { useState as useState4, useRef, useEffect as useEffect5 } from "react";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var UrUserButton = ({
  shape = "square",
  position = "top-right",
  onProfileClick,
  onSettingsClick,
  zIndex = 999
}) => {
  const { user } = useUser();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState4(false);
  const containerRef = useRef(null);
  useEffect5(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  if (!user) return null;
  const borderRadius = shape === "circle" ? "50%" : "0px";
  const isFixed = position !== "inline";
  const positionStyles = isFixed ? {
    position: "fixed",
    zIndex,
    top: position.includes("top") ? "24px" : "auto",
    bottom: position.includes("bottom") ? "24px" : "auto",
    right: position.includes("right") ? "24px" : "auto",
    left: position.includes("left") ? "24px" : "auto"
  } : { position: "relative" };
  const dropdownStyles = {
    position: "absolute",
    top: position.includes("top") || position === "inline" ? "calc(100% + 8px)" : "auto",
    bottom: position.includes("bottom") ? "calc(100% + 8px)" : "auto",
    right: position.includes("right") || position === "inline" ? "0" : "auto",
    left: position.includes("left") ? "0" : "auto",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "0px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    width: "220px",
    display: isOpen ? "block" : "none",
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, sans-serif"
  };
  const getInitials = () => {
    return user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };
  return /* @__PURE__ */ jsxs3("div", { ref: containerRef, style: positionStyles, children: [
    /* @__PURE__ */ jsx5(
      "button",
      {
        onClick: () => setIsOpen(!isOpen),
        style: {
          width: "40px",
          height: "40px",
          padding: 0,
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          borderRadius,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          transition: "transform 0.1s ease"
        },
        children: user.avatarUrl ? /* @__PURE__ */ jsx5("img", { src: user.avatarUrl, alt: "User", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsx5("span", { style: { fontSize: "16px", fontWeight: 600, color: "#475569" }, children: getInitials() })
      }
    ),
    /* @__PURE__ */ jsxs3("div", { style: dropdownStyles, children: [
      /* @__PURE__ */ jsxs3("div", { style: { padding: "16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }, children: [
        /* @__PURE__ */ jsx5("div", { style: { fontSize: "14px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: user.name || "User" }),
        /* @__PURE__ */ jsx5("div", { style: { fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }, children: user.email })
      ] }),
      /* @__PURE__ */ jsxs3("div", { style: { padding: "8px" }, children: [
        onProfileClick && /* @__PURE__ */ jsx5(
          "button",
          {
            onClick: () => {
              setIsOpen(false);
              onProfileClick();
            },
            style: {
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              background: "transparent",
              border: "none",
              fontSize: "14px",
              color: "#334155",
              cursor: "pointer",
              borderRadius: "0px",
              display: "block"
            },
            onMouseEnter: (e) => e.currentTarget.style.background = "#f1f5f9",
            onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
            children: "Profile"
          }
        ),
        onSettingsClick && /* @__PURE__ */ jsx5(
          "button",
          {
            onClick: () => {
              setIsOpen(false);
              onSettingsClick();
            },
            style: {
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              background: "transparent",
              border: "none",
              fontSize: "14px",
              color: "#334155",
              cursor: "pointer",
              borderRadius: "0px",
              display: "block"
            },
            onMouseEnter: (e) => e.currentTarget.style.background = "#f1f5f9",
            onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
            children: "Settings"
          }
        ),
        /* @__PURE__ */ jsx5("div", { style: { height: "1px", background: "#e2e8f0", margin: "4px 0" } }),
        /* @__PURE__ */ jsx5(
          "button",
          {
            onClick: () => {
              setIsOpen(false);
              logout();
            },
            style: {
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              background: "transparent",
              border: "none",
              fontSize: "14px",
              color: "#ef4444",
              fontWeight: 500,
              cursor: "pointer",
              borderRadius: "0px",
              display: "block"
            },
            onMouseEnter: (e) => e.currentTarget.style.background = "#fef2f2",
            onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
            children: "Logout"
          }
        )
      ] })
    ] })
  ] });
};

// src/index.ts
export * from "@urbackend/sdk";
export {
  GuestRoute,
  ProtectedRoute,
  UrAuth,
  UrProvider,
  UrUserButton,
  useAuth,
  useDb,
  useStorage,
  useUrContext,
  useUser
};
//# sourceMappingURL=index.mjs.map