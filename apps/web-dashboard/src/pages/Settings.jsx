import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Trash2, AlertTriangle, Save, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';
import ConfirmationModal from './ConfirmationModal';

export default function Settings() {
    const { logout, user, isLoading } = useAuth();

    // Password State
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
    const [loadingPass, setLoadingPass] = useState(false);

    // Delete Account State
    const [deletePass, setDeletePass] = useState('');
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const pageLoading = isLoading;

    // Handle Password Change
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoadingPass(true);
        try {
            await api.put(`/api/auth/change-password`, passData);
            toast.success("Password updated!");
            setPassData({ currentPassword: '', newPassword: '' });
        } catch (err) {
            toast.error(err.response?.data || "Failed to update password");
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
            toast.error(err.response?.data || "Failed to delete account");
            setShowDeleteModal(false); // Close modal on error so user can retry
        } finally {
            setLoadingDelete(false);
        }
    };

    // Open Modal
    const handleDeleteClick = () => {
        if (!deletePass) return toast.error("Please enter your password to confirm.");
        setShowDeleteModal(true);
    };

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
                                onClick={() => window.location.href = '/verify-otp'}
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

            {/* Change Password Section */}
            <div className="card" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(62, 207, 142, 0.1)', borderRadius: '10px', color: 'var(--color-primary)' }}>
                        <Lock size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '2px' }}>Change Password</h3>
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

            {/* Danger Zone */}
            <div className="card" style={{ border: '1px solid rgba(234, 84, 85, 0.3)', background: 'rgba(234, 84, 85, 0.02)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1.5rem', color: '#ea5455' }}>
                    <div style={{ padding: '10px', background: 'rgba(234, 84, 85, 0.1)', borderRadius: '10px' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '2px' }}>Danger Zone</h3>
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