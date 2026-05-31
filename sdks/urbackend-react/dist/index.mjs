// src/context.tsx
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { UrBackendClient, AuthModule, DatabaseModule, StorageModule } from "@urbackend/sdk";
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
      auth: new AuthModule(_client),
      db: new DatabaseModule(_client),
      storage: new StorageModule(_client)
    };
  }, [apiKey, baseUrl]);
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token = hashParams.get("token");
        const error2 = urlParams.get("error");
        if (error2) {
          console.error("Social Auth Error:", error2);
          if (mounted) setError(error2);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (token) {
          auth.setToken(token);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          try {
            await auth.refreshToken();
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
      await auth.login(payload);
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

// src/components/UrAuth.tsx
import { useState as useState3, useEffect as useEffect3 } from "react";

// src/components/Toast.tsx
import { useEffect as useEffect2, useState as useState2 } from "react";
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
var Toast = ({ message, type, onClose, isDark = false }) => {
  const [isVisible, setIsVisible] = useState2(false);
  const [isLeaving, setIsLeaving] = useState2(false);
  useEffect2(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, 4e3);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgColor = isDark ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)";
  const borderColor = type === "success" ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)";
  const iconColor = type === "success" ? "#22c55e" : "#ef4444";
  const textColor = isDark ? "#fff" : "#000";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx2("style", { children: `
          @keyframes slideIn {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateY(0) scale(1); opacity: 1; }
            to { transform: translateY(-20px) scale(0.95); opacity: 0; }
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
          borderRadius: "12px",
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
            /* @__PURE__ */ jsx2("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
            /* @__PURE__ */ jsx2("polyline", { points: "22 4 12 14.01 9 11.01" })
          ] }) : /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: iconColor, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx2("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsx2("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
            /* @__PURE__ */ jsx2("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
          ] }),
          message
        ]
      }
    )
  ] });
};

// src/components/UrAuth.tsx
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var UrAuth = ({
  providers = ["google", "apple", "github"],
  theme = "light",
  onSuccess
}) => {
  const { login, signUp, socialLogin, requestPasswordReset, resetPassword, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState3("signin");
  const [email, setEmail] = useState3("");
  const [password, setPassword] = useState3("");
  const [otp, setOtp] = useState3("");
  const [name, setName] = useState3("");
  const [toast, setToast] = useState3(null);
  useEffect3(() => {
    if (error) {
      setToast({ message: error, type: "error" });
    }
  }, [error]);
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
  const isDark = theme === "dark";
  const bg = isDark ? "#1a1a1a" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0f172a";
  const textMuted = isDark ? "#a1a1aa" : "#64748b";
  const border = isDark ? "#333" : "#e2e8f0";
  const inputBg = isDark ? "#2a2a2a" : "#ffffff";
  const styles = {
    wrapper: {
      width: "100%",
      maxWidth: "420px",
      margin: "0 auto",
      borderRadius: "24px",
      background: bg,
      boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.5)" : "0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05)",
      border: `1px solid ${border}`,
      overflow: "hidden",
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: text
    },
    body: {
      padding: "32px 32px 24px 32px"
    },
    switcherContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "32px"
    },
    switcher: {
      display: "inline-flex",
      background: isDark ? "#2a2a2a" : "#f1f5f9",
      padding: "4px",
      borderRadius: "100px"
    },
    switchBtn: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 20px",
      borderRadius: "100px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      color: active ? text : textMuted,
      background: active ? isDark ? "#444" : "#ffffff" : "transparent",
      boxShadow: active ? isDark ? "0 2px 4px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.05)" : "none",
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
      color: isDark ? "#ddd" : "#334155"
    },
    forgotLink: {
      fontSize: "12px",
      fontWeight: 600,
      color: text,
      cursor: "pointer",
      textDecoration: "none"
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: `1px solid ${border}`,
      background: inputBg,
      color: text,
      fontSize: "14px",
      boxSizing: "border-box",
      outline: "none",
      transition: "border-color 0.2s ease"
    },
    primaryBtn: {
      width: "100%",
      padding: "14px",
      borderRadius: "12px",
      background: "linear-gradient(180deg, #2a2a2a 0%, #111111 100%)",
      color: "#ffffff",
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
      color: "#94a3b8",
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "1px"
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      background: border
    },
    dividerText: {
      padding: "0 12px"
    },
    socialBtn: {
      width: "100%",
      padding: "12px",
      borderRadius: "12px",
      border: `1px solid ${border}`,
      background: isDark ? "#2a2a2a" : "#ffffff",
      color: text,
      fontSize: "14px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      marginBottom: "12px",
      cursor: "pointer",
      boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.02)",
      transition: "background 0.2s ease"
    },
    footer: {
      background: isDark ? "#222" : "#f8fafc",
      padding: "24px",
      textAlign: "center",
      borderTop: `1px solid ${border}`,
      fontSize: "13px",
      color: textMuted
    },
    footerLink: {
      color: text,
      fontWeight: 600,
      textDecoration: "underline",
      cursor: "pointer",
      marginLeft: "4px"
    }
  };
  const GoogleIcon = () => /* @__PURE__ */ jsxs2("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", children: [
    /* @__PURE__ */ jsx3("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }),
    /* @__PURE__ */ jsx3("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }),
    /* @__PURE__ */ jsx3("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z", fill: "#FBBC05" }),
    /* @__PURE__ */ jsx3("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })
  ] });
  const AppleIcon = () => /* @__PURE__ */ jsx3("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: isDark ? "#fff" : "#000", children: /* @__PURE__ */ jsx3("path", { d: "M17.05 13.9c-.02-3.16 2.59-4.68 2.71-4.75-1.47-2.14-3.75-2.44-4.57-2.47-1.93-.19-3.78 1.14-4.76 1.14-1.01 0-2.54-1.1-4.14-1.07-2.07.03-3.98 1.2-5.06 3.08-2.16 3.76-.55 9.3 1.57 12.35 1.03 1.49 2.22 3.16 3.84 3.1 1.56-.06 2.14-1 4.02-1 1.85 0 2.39 1 4.02.97 1.67-.03 2.7-1.52 3.72-3.02 1.18-1.72 1.67-3.39 1.69-3.48-.04-.02-3.02-1.16-3.04-4.85zM14.9 5.25c.86-1.04 1.44-2.5 1.28-3.95-1.25.05-2.8.83-3.69 1.9-.79.95-1.45 2.44-1.26 3.86 1.4.11 2.81-.76 3.67-1.81z" }) });
  const GithubIcon = () => /* @__PURE__ */ jsx3("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: isDark ? "#fff" : "#000", children: /* @__PURE__ */ jsx3("path", { d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" }) });
  return /* @__PURE__ */ jsxs2("div", { style: styles.wrapper, children: [
    toast && /* @__PURE__ */ jsx3(
      Toast,
      {
        message: toast.message,
        type: toast.type,
        isDark,
        onClose: () => {
          setToast(null);
          if (toast.type === "error") clearError();
        }
      }
    ),
    /* @__PURE__ */ jsxs2("div", { style: styles.body, children: [
      (mode === "signin" || mode === "signup") && /* @__PURE__ */ jsx3("div", { style: styles.switcherContainer, children: /* @__PURE__ */ jsxs2("div", { style: styles.switcher, children: [
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
                /* @__PURE__ */ jsx3("path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" }),
                /* @__PURE__ */ jsx3("polyline", { points: "10 17 15 12 10 7" }),
                /* @__PURE__ */ jsx3("line", { x1: "15", y1: "12", x2: "3", y2: "12" })
              ] }),
              "Login"
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
                /* @__PURE__ */ jsx3("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
                /* @__PURE__ */ jsx3("circle", { cx: "9", cy: "7", r: "4" }),
                /* @__PURE__ */ jsx3("line", { x1: "19", y1: "8", x2: "19", y2: "14" }),
                /* @__PURE__ */ jsx3("line", { x1: "22", y1: "11", x2: "16", y2: "11" })
              ] }),
              "Sign Up"
            ]
          }
        )
      ] }) }),
      (mode === "forgot" || mode === "reset") && /* @__PURE__ */ jsxs2("div", { style: { marginBottom: "24px", textAlign: "center" }, children: [
        /* @__PURE__ */ jsx3("h2", { style: { margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: text }, children: mode === "forgot" ? "Reset Password" : "Enter Reset Code" }),
        /* @__PURE__ */ jsx3("p", { style: { margin: 0, fontSize: "14px", color: textMuted }, children: mode === "forgot" ? "Enter your email and we'll send a code" : `Enter the code sent to ${email}` })
      ] }),
      /* @__PURE__ */ jsxs2("form", { onSubmit: handleSubmit, children: [
        mode === "signup" && /* @__PURE__ */ jsxs2("div", { style: styles.field, children: [
          /* @__PURE__ */ jsx3("div", { style: styles.labelRow, children: /* @__PURE__ */ jsx3("label", { style: styles.label, children: "Full Name" }) }),
          /* @__PURE__ */ jsx3(
            "input",
            {
              style: styles.input,
              type: "text",
              placeholder: "Enter your name",
              value: name,
              onChange: (e) => setName(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("div", { style: styles.field, children: [
          /* @__PURE__ */ jsx3("div", { style: styles.labelRow, children: /* @__PURE__ */ jsx3("label", { style: styles.label, children: "Email address" }) }),
          /* @__PURE__ */ jsx3(
            "input",
            {
              style: styles.input,
              type: "email",
              placeholder: "Enter your email address",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              required: true,
              readOnly: mode === "reset"
            }
          )
        ] }),
        mode === "reset" && /* @__PURE__ */ jsxs2("div", { style: styles.field, children: [
          /* @__PURE__ */ jsx3("div", { style: styles.labelRow, children: /* @__PURE__ */ jsx3("label", { style: styles.label, children: "6-digit OTP Code" }) }),
          /* @__PURE__ */ jsx3(
            "input",
            {
              style: styles.input,
              type: "text",
              placeholder: "Enter reset code",
              value: otp,
              onChange: (e) => setOtp(e.target.value),
              required: true
            }
          )
        ] }),
        (mode === "signin" || mode === "signup" || mode === "reset") && /* @__PURE__ */ jsxs2("div", { style: styles.field, children: [
          /* @__PURE__ */ jsxs2("div", { style: styles.labelRow, children: [
            /* @__PURE__ */ jsx3("label", { style: styles.label, children: mode === "reset" ? "New Password" : "Password" }),
            mode === "signin" && /* @__PURE__ */ jsx3("span", { style: styles.forgotLink, onClick: () => {
              setMode("forgot");
              clearError();
            }, children: "Forgot password?" })
          ] }),
          /* @__PURE__ */ jsx3(
            "input",
            {
              style: styles.input,
              type: "password",
              placeholder: mode === "reset" ? "Enter new password" : "Enter your password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsx3(
          "button",
          {
            style: styles.primaryBtn,
            type: "submit",
            disabled: isLoading,
            onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.98)",
            onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
            onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)",
            children: isLoading ? "Processing..." : mode === "signin" ? "Log In" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Code" : "Reset Password"
          }
        )
      ] }),
      (mode === "signin" || mode === "signup") && providers && providers.length > 0 && /* @__PURE__ */ jsxs2(Fragment2, { children: [
        /* @__PURE__ */ jsxs2("div", { style: styles.divider, children: [
          /* @__PURE__ */ jsx3("div", { style: styles.dividerLine }),
          /* @__PURE__ */ jsx3("span", { style: styles.dividerText, children: "OR" }),
          /* @__PURE__ */ jsx3("div", { style: styles.dividerLine })
        ] }),
        /* @__PURE__ */ jsxs2("div", { children: [
          providers.includes("google") && /* @__PURE__ */ jsxs2("button", { style: styles.socialBtn, onClick: () => socialLogin("google"), type: "button", children: [
            /* @__PURE__ */ jsx3(GoogleIcon, {}),
            "Continue with Google"
          ] }),
          providers.includes("apple") && /* @__PURE__ */ jsxs2("button", { style: styles.socialBtn, onClick: () => alert("Apple login not implemented in demo"), type: "button", children: [
            /* @__PURE__ */ jsx3(AppleIcon, {}),
            "Continue with Apple"
          ] }),
          providers.includes("github") && /* @__PURE__ */ jsxs2("button", { style: styles.socialBtn, onClick: () => socialLogin("github"), type: "button", children: [
            /* @__PURE__ */ jsx3(GithubIcon, {}),
            "Continue with GitHub"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("div", { style: styles.footer, children: [
      mode === "signin" ? "Don't have an account yet?" : mode === "signup" ? "Already have an account?" : "Remember your password?",
      /* @__PURE__ */ jsx3(
        "span",
        {
          style: styles.footerLink,
          onClick: () => {
            setMode(mode === "signin" ? "signup" : "signin");
            clearError();
          },
          children: mode === "signin" ? "Sign up" : "Log in"
        }
      )
    ] })
  ] });
};

// src/index.ts
export * from "@urbackend/sdk";
export {
  UrAuth,
  UrProvider,
  useAuth,
  useDb,
  useStorage,
  useUrContext
};
//# sourceMappingURL=index.mjs.map