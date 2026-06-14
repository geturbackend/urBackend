import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Shield, X, AlertCircle, Monitor, LogOut, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import AuthHeader from '../components/Auth/AuthHeader';
import SocialAuthConfig from '../components/Auth/SocialAuthConfig';
import SocialAuthModal from '../components/Auth/SocialAuthModal';
import UserTable from '../components/Auth/UserTable';
import Pagination from '../components/Database/Pagination';
import SectionHeader from '../components/Dashboard/SectionHeader';
import AddRecordDrawer from '../components/AddRecordDrawer';
import { PUBLIC_API_URL } from '../config';

export default function Auth() {
    const normalizeUsersResponse = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.items)) return payload.items;
        if (Array.isArray(payload?.data?.items)) return payload.data.items;
        return [];
    };

    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [project, setProject] = useState(null);
    const [isEnabling, setIsEnabling] = useState(false);
    const [isSavingProviders, setIsSavingProviders] = useState(false);
    const [isSocialAuthModalOpen, setIsSocialAuthModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // user being edited
    const latestUsersRequestId = useRef(0);
    const [selectedProvider, setSelectedProvider] = useState('github');
    const [authProviders, setAuthProviders] = useState({
        github: { enabled: false, clientId: '', clientSecret: '', hasClientSecret: false },
        google: { enabled: false, clientId: '', clientSecret: '', hasClientSecret: false }
    });

    const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
    const [sessionsTargetUser, setSessionsTargetUser] = useState(null);
    const [userSessions, setUserSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // Reset password modal state
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [isResetLoading, setIsResetLoading] = useState(false);

    // Config
    const siteUrl = project?.siteUrl || '';
    const githubCallbackUrl = `${PUBLIC_API_URL}/api/userAuth/social/github/callback`;
    const googleCallbackUrl = `${PUBLIC_API_URL}/api/userAuth/social/google/callback`;

    // Flow Logic
    const usersCollection = project?.collections?.find(c => c.name === 'users');
    const hasUserCollection = !!usersCollection;
    
    const normalizedUsersFields = (usersCollection?.model || []).map((f) => ({
        key: String(f?.key || '').replace(/\uFEFF/g, '').trim().toLowerCase(),
        type: String(f?.type || '').trim().toLowerCase(),
        required: f?.required === true
    }));
    const hasHiddenPasswordField = !normalizedUsersFields.some((f) => f.key === 'password');
    const hasRequiredUsersSchema =
        normalizedUsersFields.some((f) => f.key === 'email' && f.type === 'string' && f.required) &&
        (hasHiddenPasswordField || normalizedUsersFields.some((f) => f.key === 'password' && f.type === 'string' && f.required));

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const projRes = await api.get(`/api/projects/${projectId}`);
                if (isMounted) {
                    setProject(projRes.data);
                    if (projRes.data.authProviders) setAuthProviders(projRes.data.authProviders);
                    if (projRes.data.isAuthEnabled) {
                        const requestId = ++latestUsersRequestId.current;
                        const usersRes = await api.get(
                            `/api/projects/${projectId}/admin/users?page=${page}&limit=${limit}`
                        );

                        if (!isMounted || requestId !== latestUsersRequestId.current) return;
                        setUsers(normalizeUsersResponse(usersRes.data));
                        setTotalRecords(
                            usersRes.data?.data?.total ||
                            usersRes.data?.total ||
                            normalizeUsersResponse(usersRes.data).length
                        );
                    }
                }
            } catch { toast.error("Failed to load auth details"); }
            finally { if (isMounted) setLoading(false); }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [projectId, page, limit]);

    const handleEnableAuth = async () => {
        if (!hasUserCollection) return toast.error("Please create a 'users' collection first.");
        if (!hasRequiredUsersSchema) return toast.error("Your 'users' collection needs email and password fields.");

        setIsEnabling(true);
        try {
            const res = await api.patch(`/api/projects/${projectId}/auth/toggle`, { enable: true });
            setProject(res.data.project);
            toast.success("Authentication Enabled!");
        } catch (err) { 
            toast.error(err.response?.data?.message || "Failed to enable auth"); 
        } finally { setIsEnabling(false); }
    };

    const handleProviderFieldChange = (provider, field, value) => {
        setAuthProviders((prev) => ({
            ...prev,
            [provider]: { ...prev[provider], [field]: value }
        }));
    };

    const handleSaveProviders = async () => {
        setIsSavingProviders(true);
        try {
            const payload = {
                github: {
                    enabled: !!authProviders.github.enabled,
                    clientId: authProviders.github.clientId,
                    ...(authProviders.github.clientSecret ? { clientSecret: authProviders.github.clientSecret } : {})
                },
                google: {
                    enabled: !!authProviders.google.enabled,
                    clientId: authProviders.google.clientId,
                    ...(authProviders.google.clientSecret ? { clientSecret: authProviders.google.clientSecret } : {})
                }
            };
            const res = await api.patch(`/api/projects/${projectId}/auth/providers`, payload);
            setAuthProviders(res.data.authProviders);
            toast.success('Social auth saved');
            setIsSocialAuthModalOpen(false);
        } catch { toast.error('Failed to save settings'); }
        finally { setIsSavingProviders(false); }
    };

    const goToUsersSchemaPreset = () => {
        navigate(`/project/${projectId}/create-collection?name=users&preset=auth-users`);
    };

    const handleOpenSessions = async (user) => {
        setSessionsTargetUser(user);
        setIsSessionsModalOpen(true);
        setLoadingSessions(true);
        try {
            const res = await api.get(`/api/projects/${projectId}/admin/users/${user._id}/sessions`);
            setUserSessions(res.data?.sessions || []);
        } catch { toast.error("Failed to load sessions"); }
        finally { setLoadingSessions(false); }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsAddModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        try {
            await api.delete(`/api/projects/${projectId}/admin/users/${userId}`);
            setUsers(prevUsers => {
                const nextUsers = normalizeUsersResponse(prevUsers).filter(
                    u => u._id !== userId
                );

                if (nextUsers.length === 0) {
                    setPage(prevPage => (prevPage > 1 ? prevPage - 1 : prevPage));
                }

                return nextUsers;
            });

            setTotalRecords(prev => Math.max(prev - 1, 0));
            toast.success('User deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
        setIsResetLoading(true);
        try {
            await api.patch(`/api/projects/${projectId}/admin/users/${resetPasswordUser._id}/password`, { newPassword });
            toast.success('Password updated successfully');
            setResetPasswordUser(null);
            setNewPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to reset password');
        } finally {
            setIsResetLoading(false);
        }
    };

    const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="container spinner"></div>;

    const myMember = project?.members?.find(m => {
        const memberId = typeof m.user === 'object' ? m.user?._id : m.user;
        return memberId?.toString() === user?._id?.toString() || m.email === user?.email;
    });
    const myRole = project?.owner?.toString() === user?._id?.toString() ? 'owner' : (myMember?.role || 'viewer');
    const isViewer = myRole === 'viewer';

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            <AuthHeader 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isAuthEnabled={project?.isAuthEnabled}
                hasUserCollection={hasUserCollection}
                onConfigureFields={() => navigate(`/project/${projectId}/database?collection=users`)}
                onAddUser={isViewer ? null : () => setIsAddModalOpen(true)}
            />

            {/* Social Auth Modal */}
            <SocialAuthModal 
                isOpen={isSocialAuthModalOpen}
                onClose={() => setIsSocialAuthModalOpen(false)}
                selectedProvider={selectedProvider}
                setSelectedProvider={setSelectedProvider}
                authProviders={authProviders}
                handleProviderFieldChange={handleProviderFieldChange}
                handleSaveProviders={handleSaveProviders}
                isSavingProviders={isSavingProviders}
                siteUrl={siteUrl}
                githubCallbackUrl={githubCallbackUrl}
                googleCallbackUrl={googleCallbackUrl}
            />

            {/* Add / Edit User Drawer */}
            <AddRecordDrawer
                key={editingUser?._id || 'new'}
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setEditingUser(null); }}
                onSubmit={async (userData) => {
                    try {
                        if (editingUser) {
                            // Edit: use admin PUT, backend strips password from updateAdminUser
                            await api.put(`/api/projects/${projectId}/admin/users/${editingUser._id}`, userData);
                            toast.success('User updated successfully');
                            setUsers(prev => normalizeUsersResponse(prev).map(u => u._id === editingUser._id ? { ...u, ...userData, password: undefined } : u));
                        } else {
                            await api.post(`/api/projects/${projectId}/admin/users`, userData);
                            toast.success('User created successfully');
                            const requestId = ++latestUsersRequestId.current;
                            const usersRes = await api.get(
                                `/api/projects/${projectId}/admin/users?page=${page}&limit=${limit}`
                            );

                            if (requestId !== latestUsersRequestId.current) return;
                            setUsers(normalizeUsersResponse(usersRes.data));
                            setTotalRecords(
                                usersRes.data?.data?.total ||
                                usersRes.data?.total ||
                                normalizeUsersResponse(usersRes.data).length
                            );
                        }
                        setIsAddModalOpen(false);
                        setEditingUser(null);
                    } catch (err) {
                        toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to save user');
                    }
                }}
                fields={[
                    ...(usersCollection?.model || []),
                    // Always ensure password is present for creation; hidden for edit
                    ...(!editingUser ? [{ key: 'password', type: 'String', required: true }] : [])
                ].filter((f, i, self) => i === self.findIndex(t => t.key === f.key))}
                initialData={editingUser}
            />

            {!project?.isAuthEnabled ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                    {/* Schema Warnings */}
                    {!hasUserCollection ? (
                        <div className="glass-card" style={{ padding: '1rem 1.25rem', border: '1px solid rgba(255, 189, 46, 0.2)', background: 'rgba(255, 189, 46, 0.05)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <AlertCircle color="#FFBD2E" size={18} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ color: '#FFBD2E', fontSize: '0.85rem', fontWeight: 600 }}>Users Collection Required</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>You must create a "users" collection before enabling Auth.</p>
                                    <button className="btn btn-primary" style={{ height: '28px', fontSize: '0.7rem', padding: '0 10px' }} onClick={goToUsersSchemaPreset}>Create Users Collection</button>
                                </div>
                            </div>
                        </div>
                    ) : !hasRequiredUsersSchema ? (
                        <div className="glass-card" style={{ padding: '1rem 1.25rem', border: '1px solid rgba(255, 189, 46, 0.2)', background: 'rgba(255, 189, 46, 0.05)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <AlertCircle color="#FFBD2E" size={18} />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ color: '#FFBD2E', fontSize: '0.85rem', fontWeight: 600 }}>Incomplete Schema</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Missing required email or password fields in your users collection.</p>
                                    <button className="btn btn-primary" style={{ height: '28px', fontSize: '0.7rem', padding: '0 10px' }} onClick={goToUsersSchemaPreset}>Fix Users Schema</button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Main Enable Card */}
                    <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '12px' }}>
                        <Shield size={40} color="var(--color-primary)" style={{ marginBottom: '1.25rem', opacity: 0.5 }} />
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 700 }}>Ready to Enable?</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Activating Auth will allow you to manage user sessions and securely authenticate requests via your API.
                        </p>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleEnableAuth} 
                            disabled={isEnabling || !hasRequiredUsersSchema}
                            style={{ height: '36px', padding: '0 20px', fontSize: '0.85rem', opacity: !hasRequiredUsersSchema ? 0.5 : 1 }}
                        >
                            {isEnabling ? 'Enabling...' : 'Enable Authentication'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="pro-grid">
                    <div>
                        <SectionHeader title="User Management" />
                        <div className="glass-card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <UserTable 
                                users={filteredUsers}
                                isViewer={isViewer}
                                onOpenSessions={handleOpenSessions}
                                onEdit={handleEditUser}
                                onResetPassword={(u) => { setResetPasswordUser(u); setNewPassword(''); }}
                                onDelete={handleDeleteUser}
                            />
                            <Pagination
                                total={totalRecords}
                                page={page}
                                limit={limit}
                                onPageChange={(p) => setPage(p)}
                                onLimitChange={(newLimit) => {
                                    setLimit(newLimit);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <SectionHeader title="Settings" />
                        <SocialAuthConfig 
                            authProviders={authProviders}
                            onOpenModal={() => setIsSocialAuthModalOpen(true)}
                            setSelectedProvider={setSelectedProvider}
                        />
                        
                        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Security Policy</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                JWT tokens are signed using your secret key. If you suspect a breach, roll your key in Project Settings to force all users to log in again.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Sessions Modal */}
            {isSessionsModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="glass-card" style={{ width: '450px', padding: '1.25rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Sessions — {sessionsTargetUser?.email}</h3>
                            <X size={16} style={{ cursor: 'pointer' }} onClick={() => setIsSessionsModalOpen(false)} />
                        </div>
                        <div className="custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {loadingSessions ? <div className="spinner" /> : userSessions.length === 0 ? (
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>No active sessions found.</p>
                            ) : (
                                userSessions.map(s => (
                                    <div key={s.tokenId} style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '0.7rem' }}>
                                            <div style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{s.ip || 'Unknown IP'}</div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>{new Date(s.lastUsedAt).toLocaleString()}</div>
                                        </div>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ color: '#ef4444', padding: '4px' }}
                                            onClick={async () => {
                                                try {
                                                    await api.delete(`/api/projects/${projectId}/admin/users/${sessionsTargetUser._id}/sessions/${s.tokenId}`);
                                                    setUserSessions(prev => prev.filter(x => x.tokenId !== s.tokenId));
                                                    toast.success('Session revoked');
                                                } catch { toast.error('Failed to revoke session'); }
                                            }}
                                        >
                                            <LogOut size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPasswordUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="glass-card" style={{ width: '380px', padding: '1.25rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <Key size={14} color="var(--color-primary)" />
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Reset Password</h3>
                            </div>
                            <X size={16} style={{ cursor: 'pointer' }} onClick={() => setResetPasswordUser(null)} />
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Set a new password for <strong style={{ color: 'var(--color-text-main)' }}>{resetPasswordUser.email}</strong>.</p>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="New password (min 6 chars)"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', marginBottom: '1rem', fontSize: '0.8rem' }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setResetPasswordUser(null)} style={{ height: '30px', fontSize: '0.75rem' }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleResetPassword} disabled={isResetLoading} style={{ height: '30px', fontSize: '0.75rem' }}>
                                {isResetLoading ? 'Saving...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-left-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
