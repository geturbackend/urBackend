import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Shield, Database, Mail, HardDrive, Check, Copy, Search, X, Eye, EyeOff,
    CheckCircle, Info, Server, Cpu
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { PUBLIC_API_URL } from '../../config';
import { FormField } from './formPrimitives';
import { inputStyle } from '../../utils/styles';
import DatabaseConfigForm from './DatabaseConfigForm';
import StorageConfigForm from './StorageConfigForm';
import MailTemplatesForm from './MailTemplatesForm';
import SettingInfoTooltip from './SettingInfoTooltip';

/* ─── SVG Brand Icons ─── */
const Icons = {
    GitHub: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
    ),
    Google: () => (
        <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.01 10.04.01 12c0 1.96.45 3.8 1.26 5.42l4.01-3.15z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
        </svg>
    ),
    Apple: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.09c.68-.83 1.14-1.98.99-3.14-.99.04-2.19.66-2.9 1.48-.63.73-1.18 1.9-.99 3.03 1.11.09 2.22-.54 2.9-1.37z" />
        </svg>
    ),
    Discord: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#5865F2">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
    ),
    MongoDB: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#13AA52">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.19 19.467c-.244.184-.717.382-1.19.382-.473 0-.946-.198-1.19-.382C8.75 17.87 6 13.9 6 10.5 6 7.185 8.686 4.5 12 4.5s6 2.685 6 6c0 3.4-2.75 7.37-4.81 8.967z" />
        </svg>
    ),
    Redis: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#DC382D">
            <path d="M22.023 13.682l-9.047 3.51a2.53 2.53 0 01-1.952 0l-9.047-3.51a1.27 1.27 0 01-.802-1.186v-3.99c0-.522.316-.992.802-1.186l9.047-3.51a2.53 2.53 0 011.952 0l9.047 3.51c.486.194.802.664.802 1.186v3.99c0 .522-.316.992-.802 1.186z" />
        </svg>
    ),
    Resend: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2zm0 4v12h18V7l-9 5.5L3 7zm9 3.5L20.4 5H3.6L12 10.5z" />
        </svg>
    )
};

const normalizeAuthProviders = (raw) => ({
    github: {
        enabled: !!raw?.github?.enabled,
        clientId: raw?.github?.clientId || '',
        clientSecret: raw?.github?.clientSecret || '',
        hasClientSecret: !!raw?.github?.hasClientSecret
    },
    google: {
        enabled: !!raw?.google?.enabled,
        clientId: raw?.google?.clientId || '',
        clientSecret: raw?.google?.clientSecret || '',
        hasClientSecret: !!raw?.google?.hasClientSecret
    }
});

export default function IntegrationsSettings({
    project,
    projectId,
    onProjectUpdate,
    role,
    hasResendKey,
    resendKeyValue,
    setResendKeyValue,
    resendFromEmailValue,
    setResendFromEmailValue,
    resendKeyLoading,
    handleResendKeySave,
}) {
    const isViewer = role === 'viewer';
    const siteUrl = project?.siteUrl || '';

    // Auth Providers State
    const [authProviders, setAuthProviders] = useState(() => normalizeAuthProviders(project?.authProviders));
    const [isSavingProviders, setIsSavingProviders] = useState(false);
    const [selectedProviderModal, setSelectedProviderModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Form States
    const [modalForm, setModalForm] = useState({ enabled: false, clientId: '', clientSecret: '' });
    const [showSecret, setShowSecret] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);

    // BYOK State
    const [projectGroqKey, setProjectGroqKey] = useState('');
    const [showProjectGroqKey, setShowProjectGroqKey] = useState(false);
    const [savingProjectByok, setSavingProjectByok] = useState(false);

    const closeButtonRef = useRef(null);

    const githubCallbackUrl = `${PUBLIC_API_URL}/api/userAuth/social/github/callback`;
    const googleCallbackUrl = `${PUBLIC_API_URL}/api/userAuth/social/google/callback`;

    useEffect(() => {
        if (project?.authProviders) {
            const normalized = normalizeAuthProviders(project.authProviders);
            Promise.resolve().then(() => setAuthProviders(normalized));
        }
    }, [project?.authProviders]);

    const handleProjectByokUpdate = async (clear = false) => {
        const payloadKey = clear ? null : projectGroqKey.trim();
        if (!clear && (!payloadKey || !payloadKey.startsWith('gsk_'))) {
            toast.error("Invalid Groq API key format. Key must start with 'gsk_'.");
            return;
        }

        setSavingProjectByok(true);
        try {
            const res = await api.put(`/api/projects/${projectId}/byok`, { groqKey: payloadKey });
            if (res.data?.success) {
                onProjectUpdate();
                if (clear) {
                    setProjectGroqKey('');
                    toast.success("Project BYOK key cleared.");
                } else {
                    setProjectGroqKey('');
                    toast.success("Project BYOK key saved securely.");
                }
            } else {
                toast.error(res.data?.message || "Failed to update project BYOK settings");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update project BYOK settings");
        } finally {
            setSavingProjectByok(false);
        }
    };

    useEffect(() => {
        if (!selectedProviderModal) return;
        closeButtonRef.current?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setSelectedProviderModal(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedProviderModal]);

    const openOAuthModal = (providerKey) => {
        const prov = authProviders[providerKey] || { enabled: false, clientId: '', clientSecret: '' };
        setModalForm({
            enabled: !!prov.enabled,
            clientId: prov.clientId || '',
            clientSecret: ''
        });
        setShowSecret(false);
        setCopiedUrl(false);
        setSelectedProviderModal(providerKey);
    };

    const handleSaveOAuthModal = async () => {
        if (!selectedProviderModal) return;

        // Validation: when enabling, clientId and clientSecret (new or existing) are required
        if (modalForm.enabled) {
            if (!modalForm.clientId.trim()) {
                toast.error("Client ID is required when enabling a provider.");
                return;
            }
            const existingHasSecret = authProviders[selectedProviderModal]?.hasClientSecret;
            if (!modalForm.clientSecret.trim() && !existingHasSecret) {
                toast.error("Client Secret is required when enabling a provider.");
                return;
            }
        }

        setIsSavingProviders(true);
        try {
            const updatedProviderData = {
                enabled: !!modalForm.enabled,
                clientId: modalForm.clientId,
                ...(modalForm.clientSecret ? { clientSecret: modalForm.clientSecret } : {})
            };

            const payload = {
                github: selectedProviderModal === 'github' ? updatedProviderData : {
                    enabled: !!authProviders.github.enabled,
                    clientId: authProviders.github.clientId,
                },
                google: selectedProviderModal === 'google' ? updatedProviderData : {
                    enabled: !!authProviders.google.enabled,
                    clientId: authProviders.google.clientId,
                }
            };

            const res = await api.patch(`/api/projects/${projectId}/auth/providers`, payload);
            const normalized = normalizeAuthProviders(res.data.authProviders);
            setAuthProviders(normalized);
            if (onProjectUpdate) {
                onProjectUpdate(prev => ({ ...prev, authProviders: normalized }));
            }
            toast.success(`${selectedProviderModal === 'github' ? 'GitHub' : 'Google'} OAuth settings updated!`);
            setSelectedProviderModal(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update provider settings');
        } finally {
            setIsSavingProviders(false);
        }
    };

    const copyToClipboard = async (text) => {
        if (!navigator?.clipboard) {
            toast.error('Clipboard access is not available.');
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            setCopiedUrl(true);
            toast.success('OAuth Callback URL copied!');
            setTimeout(() => setCopiedUrl(false), 2000);
        } catch {
            toast.error('Failed to copy to clipboard.');
        }
    };

    const oauthProvidersList = useMemo(() => {
        const list = [
            { id: 'github', name: 'GitHub', icon: Icons.GitHub, enabled: authProviders.github.enabled, configured: authProviders.github.hasClientSecret },
            { id: 'google', name: 'Google', icon: Icons.Google, enabled: authProviders.google.enabled, configured: authProviders.google.hasClientSecret },
            { id: 'apple', name: 'Apple', icon: Icons.Apple, disabled: true, statusText: 'Coming Soon' },
            { id: 'discord', name: 'Discord', icon: Icons.Discord, disabled: true, statusText: 'Coming Soon' }
        ];

        if (!searchTerm.trim()) return list;
        return list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [authProviders, searchTerm]);

    const activeCallbackUrl = selectedProviderModal === 'google' ? googleCallbackUrl : githubCallbackUrl;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* 1. OAUTH2 PROVIDERS GRID */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center' }}>
                            OAuth2 Providers
                            <SettingInfoTooltip
                                title="OAuth2 Social Auth Providers"
                                description="Enable GitHub or Google social login for your application's end-users. Click a provider card to open its configuration modal, select your provider, and enter your Client ID and Client Secret. The Callback URL is auto-generated and read-only — copy it into your provider's developer console. Credentials are encrypted at rest."
                                docsUrl="https://docs.ub.bitbros.in/guides/social-auth"
                            />
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                            Enable third-party social logins for your application users.
                        </p>
                    </div>

                    <div style={{ position: 'relative', width: '220px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search OAuth2 providers"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...inputStyle, paddingLeft: '30px', height: '32px', fontSize: '0.75rem' }}
                        />
                    </div>
                </div>

                {!siteUrl && (
                    <div style={{ padding: '10px 12px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '6px', fontSize: '0.75rem', color: '#eab308', marginBottom: '1rem' }}>
                        ⚠️ <strong>Site URL is not set:</strong> Please set your app's site URL in the <em>General Settings</em> tab so OAuth redirects to <code>/auth/callback</code> correctly.
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {oauthProvidersList.map((prov) => {
                        const ProviderIcon = prov.icon;
                        const isConfigured = prov.configured || prov.enabled;
                        return (
                            <div
                                key={prov.id}
                                role="button"
                                tabIndex={prov.disabled ? -1 : 0}
                                aria-disabled={prov.disabled}
                                onClick={() => !prov.disabled && openOAuthModal(prov.id)}
                                onKeyDown={(e) => {
                                    if (!prov.disabled && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault();
                                        openOAuthModal(prov.id);
                                    }
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    cursor: prov.disabled ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '110px',
                                    opacity: prov.disabled ? 0.6 : 1,
                                    transition: 'all 0.2s ease',
                                }}
                                className={!prov.disabled ? "provider-card-hover" : ""}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ProviderIcon />
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{prov.name}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        fontWeight: 600,
                                        background: prov.disabled ? 'rgba(255,255,255,0.06)' : prov.enabled ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                                        color: prov.disabled ? 'var(--color-text-muted)' : prov.enabled ? '#22c55e' : 'var(--color-text-muted)',
                                        border: prov.enabled ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--color-border)'
                                    }}>
                                        {prov.statusText || (prov.enabled ? 'enabled' : isConfigured ? 'configured' : 'disabled')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. DATABASES SECTION */}
            <div>
                <DatabaseConfigForm project={project} projectId={projectId} onProjectUpdate={onProjectUpdate} role={role} />
            </div>

            {/* 3. MAIL SECTION */}
            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px 0', display: 'flex', alignItems: 'center' }}>
                    Mail Delivery & Templates
                    <SettingInfoTooltip
                        title="Mail Delivery — Resend.com (BYOK)"
                        description="Connect a Resend.com API key (starts with re_) to send transactional emails from your own domain. Set a default From address (e.g. 'Acme <info@acme.com>'). Without a custom key, urBackend's shared mail quota applies. The API key is encrypted at rest."
                        docsUrl="https://docs.ub.bitbros.in/guides/mail-platform"
                    />
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
                    Transactional email providers and dynamic template engine.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(192,132,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icons.Resend />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>Resend.com (BYOK API Key)</h4>
                                    <span style={{ fontSize: '0.7rem', color: hasResendKey ? '#22c55e' : 'var(--color-text-muted)' }}>
                                        {hasResendKey ? '• Configured (Encrypted at rest)' : '• Not configured'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <FormField label="Resend API Key">
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="re_123456789..."
                                    value={resendKeyValue}
                                    onChange={(e) => setResendKeyValue(e.target.value)}
                                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                                    disabled={isViewer}
                                />
                            </FormField>
                            <FormField label="Default From Address" hint={<>Defaults to <code>onboarding@resend.dev</code></>}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Acme <info@acme.com>"
                                    value={resendFromEmailValue}
                                    onChange={(e) => setResendFromEmailValue(e.target.value)}
                                    style={inputStyle}
                                    disabled={isViewer}
                                />
                            </FormField>
                        </div>
                        {!isViewer && (
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleResendKeySave}
                                    className="btn btn-primary"
                                    disabled={resendKeyLoading || (!resendKeyValue.trim() && resendFromEmailValue.trim() === (project?.resendFromEmail || ""))}
                                    style={{ height: '32px', fontSize: '0.75rem', padding: '0 14px' }}
                                >
                                    {resendKeyLoading ? "Saving..." : "Save Mail Settings"}
                                </button>
                            </div>
                        )}
                    </div>

                    <MailTemplatesForm projectId={projectId} role={role} />
                </div>
            </div>

            {/* 4. STORAGE ENGINES */}
            <div>
                <StorageConfigForm project={project} projectId={projectId} onProjectUpdate={onProjectUpdate} role={role} />
            </div>

            {/* 5. AI SERVICES (BYOK) */}
            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px 0', display: 'flex', alignItems: 'center' }}>
                    AI Services
                    <SettingInfoTooltip
                        title="AI Services — Project-level Groq BYOK"
                        description="Provide a project-specific Groq API key to override the developer-level key for all AI operations in this project (schema suggestions, query generation, etc.). This key takes priority and is billed to your Groq account. Encrypted at rest; never returned by any API response."
                        docsUrl="https://docs.ub.bitbros.in/guides/ai-byok#set-a-project-level-key"
                    />
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 1rem 0' }}>
                    Project-level overrides for AI capabilities.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                                    <Cpu size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>Groq API (BYOK)</h4>
                                    <span style={{ fontSize: '0.7rem', color: project?.hasGroqKey ? '#22c55e' : 'var(--color-text-muted)' }}>
                                        {project?.hasGroqKey ? '• Configured (Encrypted at rest)' : '• Not configured'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                            <FormField label="Groq API Key" hint="This key overrides your developer-level key for this project only.">
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showProjectGroqKey ? "text" : "password"}
                                        className="input-field"
                                        placeholder={project?.hasGroqKey ? "gsk_••••••••••••••••" : "Enter your Groq API key"}
                                        value={projectGroqKey}
                                        onChange={(e) => setProjectGroqKey(e.target.value)}
                                        style={{ ...inputStyle, fontFamily: 'monospace', paddingRight: '40px' }}
                                        disabled={isViewer}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowProjectGroqKey(!showProjectGroqKey)}
                                        aria-label={showProjectGroqKey ? "Hide Groq API key" : "Show Groq API key"}
                                        aria-pressed={showProjectGroqKey}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                    >
                                        {showProjectGroqKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </FormField>
                        </div>
                        {!isViewer && (
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                {project?.hasGroqKey && (
                                    <button
                                        onClick={() => handleProjectByokUpdate(true)}
                                        className="btn"
                                        disabled={savingProjectByok}
                                        style={{ height: '32px', fontSize: '0.75rem', padding: '0 14px', background: 'rgba(234, 84, 85, 0.1)', color: '#ea5455', border: '1px solid rgba(234, 84, 85, 0.2)' }}
                                    >
                                        Clear
                                    </button>
                                )}
                                <button
                                    onClick={() => handleProjectByokUpdate(false)}
                                    className="btn btn-primary"
                                    disabled={savingProjectByok || !projectGroqKey}
                                    style={{ height: '32px', fontSize: '0.75rem', padding: '0 14px' }}
                                >
                                    {savingProjectByok ? "Saving..." : "Save Key"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── APPWRITE STYLE OAUTH2 PROVIDER SETTINGS MODAL ─── */}
            {selectedProviderModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="oauth-modal-title"
                    className="modal-overlay"
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setSelectedProviderModal(null)}
                >
                    <div
                        className="glass-card modal-content"
                        style={{ width: '100%', maxWidth: '520px', position: 'relative', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            ref={closeButtonRef}
                            className="btn-icon"
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                            onClick={() => setSelectedProviderModal(null)}
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedProviderModal === 'github' ? <Icons.GitHub /> : <Icons.Google />}
                            </div>
                            <div>
                                <h3 id="oauth-modal-title" style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                                    {selectedProviderModal === 'github' ? 'GitHub' : 'Google'} OAuth2 settings
                                </h3>
                            </div>
                        </div>

                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                            To use {selectedProviderModal === 'github' ? 'GitHub' : 'Google'} authentication in your application, fill in this form.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            
                            {/* Enable Toggle Switch */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Enable Provider</span>
                                <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={modalForm.enabled}
                                        onChange={(e) => setModalForm(p => ({ ...p, enabled: e.target.checked }))}
                                        disabled={isViewer}
                                    />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: modalForm.enabled ? '#22c55e' : 'var(--color-text-muted)' }}>
                                        {modalForm.enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>

                            {/* Client ID */}
                            <FormField label="Client ID">
                                <input
                                    type="text"
                                    placeholder={selectedProviderModal === 'github' ? 'e.g. Ov23li...' : 'e.g. 12345-abc.apps.googleusercontent.com'}
                                    value={modalForm.clientId}
                                    onChange={(e) => setModalForm(p => ({ ...p, clientId: e.target.value }))}
                                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                                    disabled={isViewer}
                                />
                            </FormField>

                            {/* Client Secret */}
                            <FormField label="Client Secret" hint={authProviders[selectedProviderModal]?.hasClientSecret ? "Leave blank to keep existing encrypted secret." : "Enter secret value."}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showSecret ? 'text' : 'password'}
                                        placeholder={authProviders[selectedProviderModal]?.hasClientSecret ? '••••••••••••••••' : 'Enter client secret'}
                                        value={modalForm.clientSecret}
                                        onChange={(e) => setModalForm(p => ({ ...p, clientSecret: e.target.value }))}
                                        style={{ ...inputStyle, fontFamily: 'monospace', paddingRight: '36px' }}
                                        disabled={isViewer}
                                    />
                                    <button
                                        type="button"
                                        aria-label="Toggle secret visibility"
                                        onClick={() => setShowSecret(!showSecret)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0 }}
                                    >
                                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </FormField>

                            {/* Callout Box for Redirect URI */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--color-text-muted)', fontSize: '0.73rem', lineHeight: 1.4, marginBottom: '8px' }}>
                                    <Info size={14} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--color-primary)' }} />
                                    <span>To complete set up, add this OAuth2 redirect URI to your {selectedProviderModal === 'github' ? 'GitHub app' : 'Google Cloud Console'} configuration.</span>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={activeCallbackUrl}
                                        style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', color: 'var(--color-text-muted)' }}
                                    />
                                    <button
                                        type="button"
                                        aria-label={`Copy ${selectedProviderModal === 'github' ? 'GitHub' : 'Google'} OAuth callback URL`}
                                        className="btn btn-secondary"
                                        onClick={() => copyToClipboard(activeCallbackUrl)}
                                        style={{ height: '32px', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                                    >
                                        {copiedUrl ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setSelectedProviderModal(null)}
                                style={{ height: '34px', fontSize: '0.78rem', padding: '0 14px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveOAuthModal}
                                className="btn btn-primary"
                                disabled={isSavingProviders || isViewer}
                                style={{ height: '34px', fontSize: '0.78rem', padding: '0 16px', background: 'var(--color-primary)' }}
                            >
                                {isSavingProviders ? 'Updating...' : 'Update Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .provider-card-hover:hover {
                    border-color: rgba(255, 255, 255, 0.25) !important;
                    background: rgba(255, 255, 255, 0.05) !important;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}
