import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Trash2, AlertTriangle, Save, CheckCircle, Cpu, Eye, EyeOff } from 'lucide-react';
import SettingInfoTooltip from '../components/Settings/SettingInfoTooltip';
import ConfirmationModal from './ConfirmationModal';
import PATManager from '../components/PATManager';

export default function Settings() {
    const { logout, user, isLoading, updateUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const highlightVerification = new URLSearchParams(location.search).get('verify') === 'email';

    // Password State
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
    const [loadingPass, setLoadingPass] = useState(false);

    // Delete Account State
    const [deletePass, setDeletePass] = useState('');
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const pageLoading = isLoading;

    // BYOK State
    const [groqKeyValue, setGroqKeyValue] = useState('');
    const [showGroqKey, setShowGroqKey] = useState(false);
    const [loadingByok, setLoadingByok] = useState(false);

    // Handle Password Change
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoadingPass(true);
        try {
            await api.put(`/api/auth/change-password`, passData);
            toast.success("Password updated!");
            setPassData({ currentPassword: '', newPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update password");
        } finally {
            setLoadingPass(false);
        }
    };

    // Handle Delete Account - Final Step
    const executeDeleteAccount = async () => {
        setLoadingDelete(true);
        try {
            // api utility handles credentials
            await api.delete(`/api/auth/delete-account`, {
                data: { password: deletePass }
            });

            toast.success("Account deleted. Goodbye!");
            logout(); // Log user out immediately
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to delete account");
            setShowDeleteModal(false); // Close modal on error so user can retry
        } finally {
            setLoadingDelete(false);
        }
    };

    // Handle BYOK Update
    const handleByokUpdate = async (clear = false) => {
        const payloadKey = clear ? null : groqKeyValue.trim();
        if (!clear && (!payloadKey || !payloadKey.startsWith('gsk_'))) {
            toast.error("Invalid Groq API key format. Key must start with 'gsk_'.");
            return;
        }

        setLoadingByok(true);
        try {
            const res = await api.put('/api/auth/me/byok', { groqKey: payloadKey });
            if (res.data?.success) {
                updateUser((curr) => ({ ...curr, hasGroqKey: res.data.data.hasGroqKey }));
                if (clear) {
                    setGroqKeyValue('');
                    toast.success("BYOK key cleared.");
                } else {
                    setGroqKeyValue('');
                    toast.success("BYOK key saved securely.");
                }
            } else {
                toast.error(res.data?.message || "Failed to update BYOK settings");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update BYOK settings");
        } finally {
            setLoadingByok(false);
        }
    };

    // Open Modal
    const handleDeleteClick = () => {
        if (!deletePass) return toast.error("Please enter your password to confirm.");
        setShowDeleteModal(true);
    };

    const goToVerification = () => {
        navigate('/verify-otp', { state: { email: user?.email } });
    };



if (pageLoading) return <SettingsSkeleton />;

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div className="page-header" style={{ marginBottom: '3rem', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Settings</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Manage your developer account preferences.</p>
                </div>
                {/* Verification Status Badge */}
                <div style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: user?.isVerified ? 'rgba(62, 207, 142, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                    border: `1px solid ${user?.isVerified ? 'rgba(62, 207, 142, 0.2)' : 'rgba(255, 193, 7, 0.2)'}`,
                    color: user?.isVerified ? '#3ECF8E' : '#FFC107',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                }}>
                    {user?.isVerified ? (
                        <>
                            <CheckCircle size={16} /> Verified Account
                        </>
                    ) : (
                        <>
                            <AlertTriangle size={16} /> Unverified
                            <button
                                onClick={goToVerification}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    textDecoration: 'underline',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    marginLeft: '5px',
                                    fontWeight: 'bold',
                                    fontSize: 'inherit'
                                }}
                            >
                                Verify Now
                            </button>
                        </>
                    )}
                </div>
            </div>

            {!user?.isVerified && (
                <div
                    className="card"
                    style={{
                        marginBottom: '2.5rem',
                        border: `1px solid ${highlightVerification ? 'rgba(255, 193, 7, 0.45)' : 'rgba(255, 193, 7, 0.2)'}`,
                        background: 'rgba(255, 193, 7, 0.06)'
                    }}
                >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', background: 'rgba(255, 193, 7, 0.12)', borderRadius: '10px', color: '#FFC107' }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '2px' }}>Verify your email</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Verification is required before onboarding, project creation, and API key access.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={goToVerification}
                        className="btn btn-primary"
                        style={{ padding: '10px 18px' }}
                    >
                        Send Verification Code
                    </button>
                </div>
            )}

            {/* Change Password Section */}
            <div className="card" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(62, 207, 142, 0.1)', borderRadius: '10px', color: 'var(--color-primary)' }}>
                        <Lock size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center' }}>
                            Change Password
                            <SettingInfoTooltip
                                title="Change Password"
                                description="Update your developer account password. You'll need to enter your current password to confirm the change. Use a strong, unique password to protect your account and all associated projects."
                                docsUrl="https://docs.ub.bitbros.in/security"
                            />
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Secure your account with a strong password.</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} style={{ maxWidth: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontSize: '0.9rem' }}>Current Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={passData.currentPassword}
                                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontSize: '0.9rem' }}>New Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={passData.newPassword}
                                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                required
                                minLength={6}
                                style={{ width: '100%', padding: '12px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={loadingPass} style={{ padding: '10px 20px' }}>
                            {loadingPass ? 'Updating...' : <><Save size={18} /> Update Password</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* AI Integration (BYOK) */}
            <div className="card" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px', color: '#a855f7' }}>
                        <Cpu size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center' }}>
                            AI Integration (BYOK)
                            <SettingInfoTooltip
                                title="AI Integration — Bring Your Own Key"
                                description="Connect your personal Groq API key (starts with gsk_) to bypass platform session limits across your projects. With BYOK, all AI queries are billed directly to your Groq account rather than urBackend's plan quotas. Keys are encrypted at rest and never returned by the API."
                                docsUrl="https://docs.ub.bitbros.in/guides/ai-byok"
                            />
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Bring Your Own Key to bypass platform rate limits for AI queries.</p>
                    </div>
                </div>

                <div style={{ maxWidth: '100%' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Your Groq API key is encrypted at rest. When set, all your AI queries use your key directly.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-bg-input)', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '4px' }}>Platform Quota</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user?.hasGroqKey ? "You are using BYOK (Unlimited)." : "Free tier AI queries reset monthly."}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: user?.hasGroqKey ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                                {user?.hasGroqKey ? "Unlimited" : `${user?.aiUsage ?? 0} / ${user?.aiLimit ?? 20}`}
                            </span>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            Groq API Key
                            {user?.hasGroqKey && (
                                <span style={{ fontSize: '0.75rem', background: 'rgba(62, 207, 142, 0.1)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                    • Configured
                                </span>
                            )}
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type={showGroqKey ? "text" : "password"}
                                    className="input-field"
                                    placeholder={user?.hasGroqKey ? "gsk_••••••••••••••••" : "Enter your Groq API key"}
                                    value={groqKeyValue}
                                    onChange={(e) => setGroqKeyValue(e.target.value)}
                                    style={{ width: '100%', padding: '12px', paddingRight: '40px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowGroqKey(!showGroqKey)}
                                    aria-label={showGroqKey ? "Hide Groq API key" : "Show Groq API key"}
                                    aria-pressed={showGroqKey}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                >
                                    {showGroqKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <button 
                                onClick={() => handleByokUpdate(false)}
                                className="btn btn-primary" 
                                disabled={loadingByok || !groqKeyValue} 
                                style={{ padding: '0 20px', whiteSpace: 'nowrap' }}
                            >
                                {loadingByok ? 'Saving...' : 'Save Key'}
                            </button>
                            {user?.hasGroqKey && (
                                <button 
                                    onClick={() => handleByokUpdate(true)}
                                    className="btn" 
                                    disabled={loadingByok} 
                                    style={{ padding: '0 20px', background: 'rgba(234, 84, 85, 0.1)', color: '#ea5455', border: '1px solid rgba(234, 84, 85, 0.2)' }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PAT Visual */}
            {user?.isVerified && <PATManager />}

            {/* Danger Zone */}
            <div className="card" style={{ border: '1px solid rgba(234, 84, 85, 0.3)', background: 'rgba(234, 84, 85, 0.02)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1.5rem', color: '#ea5455' }}>
                    <div style={{ padding: '10px', background: 'rgba(234, 84, 85, 0.1)', borderRadius: '10px' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center' }}>
                            Danger Zone
                            <SettingInfoTooltip
                                title="Delete Account"
                                description="Permanently and irreversibly deletes your developer account. All projects, API keys, collections, storage files, and team memberships will be immediately erased. This action cannot be undone — make sure you've exported any data you need before proceeding."
                                docsUrl="https://docs.ub.bitbros.in/security"
                            />
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#ea5455', opacity: 0.8 }}>Irreversible account actions.</p>
                    </div>
                </div>

                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Deleting your account is irreversible. All your projects, API keys, and stored data will be permanently removed.
                </p>

                <div style={{ maxWidth: '400px' }}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ color: '#ea5455', fontWeight: 500, marginBottom: '8px', display: 'block' }}>Confirm Password to Delete</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Enter your password"
                            value={deletePass}
                            onChange={(e) => setDeletePass(e.target.value)}
                            style={{ width: '100%', padding: '12px', background: 'var(--color-bg-input)', border: '1px solid rgba(234, 84, 85, 0.3)', borderRadius: '8px', color: '#fff' }}
                        />
                    </div>
                    <button
                        onClick={handleDeleteClick}
                        className="btn btn-danger"
                        disabled={loadingDelete || !deletePass}
                        style={{ width: '100%', justifyContent: 'center', background: '#ea5455', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px' }}
                    >
                        {loadingDelete ? 'Deleting Account...' : <><Trash2 size={18} /> Delete My Account</>}
                    </button>

                    <ConfirmationModal
                        open={showDeleteModal}
                        title="Delete Your Account?"
                        message="This action is irreversible. All your projects, data, and API keys will be permanently erased."
                        onConfirm={executeDeleteAccount}
                        onCancel={() => setShowDeleteModal(false)}
                    />
                </div>
            </div>
        </div>
    );
}

const SettingsSkeleton = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="skeleton" style={{ width: '140px', height: '28px' }} />
        {[1, 2].map(i => (
            <div key={i} className="glass-card" style={{ borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="skeleton" style={{ width: '160px', height: '20px' }} />
                <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '100px', height: '34px', borderRadius: '6px' }} />
            </div>
        ))}
    </div>
);
