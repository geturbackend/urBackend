import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Shield, Trash2, User, Search, Mail, UserPlus, Key, X, AlertCircle, Edit2, Save, Settings, Monitor, LogOut } from 'lucide-react';
import { PUBLIC_API_URL } from '../config';

// FUNCTION - DYNAMIC USER FORM
const DynamicUserForm = ({ schema, formData, onChange, isEdit = false }) => {
    if (!schema) return null;

    const baseFields = isEdit ? [] : [
        { key: 'email', type: 'String', required: true },
        { key: 'username', type: 'String', required: false },
        { key: 'password', type: 'String', required: true }
    ];

    // Filter out base fields from schema if they already exist to avoid duplicates
    const dynamicFields = (schema || []).filter(f => !baseFields.find(b => b.key === f.key));
    const allFields = [...baseFields, ...dynamicFields];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {allFields.map((field) => {
                // Skip password in edit mode (we have a separate reset)
                if (isEdit && field.key === 'password') return null;
                // Skip internal fields if any
                if (field.key === '_id' || field.key === 'createdAt' || field.key === 'updatedAt' || field.key === 'emailVerified') return null;

                return (
                    <div key={field.key} className="input-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px', display: 'block' }}>
                            {field.key.charAt(0).toUpperCase() + field.key.slice(1)} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>
                        {field.type === 'Boolean' ? (
                            <select 
                                className="input-field"
                                value={formData[field.key] || false}
                                onChange={(e) => onChange(field.key, e.target.value === 'true')}
                            >
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        ) : field.type === 'Number' ? (
                            <input
                                type="number"
                                className="input-field"
                                required={field.required}
                                value={formData[field.key] ?? ''}
                                onChange={(e) => onChange(field.key, Number(e.target.value))}
                            />
                        ) : field.type === 'Date' ? (
                            <input
                                type="date"
                                className="input-field"
                                required={field.required}
                                value={formData[field.key] ? new Date(formData[field.key]).toISOString().split('T')[0] : ''}
                                onChange={(e) => onChange(field.key, e.target.value)}
                            />
                        ) : (field.type === 'Object' || field.type === 'Array') ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <textarea
                                    className="input-field"
                                    style={{ 
                                        minHeight: '100px', 
                                        fontFamily: 'monospace', 
                                        fontSize: '0.85rem',
                                        resize: 'vertical',
                                        borderColor: formData[`_error_${field.key}`] ? '#ef4444' : 'var(--color-border)'
                                    }}
                                    placeholder={field.type === 'Object' ? '{ "key": "value" }' : '[ "item1", "item2" ]'}
                                    value={typeof formData[field.key] === 'string' ? formData[field.key] : JSON.stringify(formData[field.key] ?? (field.type === 'Object' ? {} : []), null, 2)}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        onChange(field.key, val); // Store raw string during edit
                                        try {
                                            const parsed = JSON.parse(val);
                                            onChange(`_error_${field.key}`, null);
                                            onChange(field.key, parsed); // Store parsed value if valid
                                        } catch {
                                            onChange(`_error_${field.key}`, "Invalid JSON format");
                                        }
                                    }}
                                />
                                {formData[`_error_${field.key}`] && (
                                    <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{formData[`_error_${field.key}`]}</span>
                                )}
                            </div>
                        ) : field.type === 'Ref' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter reference document ID"
                                    value={formData[field.key] || ''}
                                    onChange={(e) => onChange(field.key, e.target.value)}
                                />
                                <small style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    Enter the <code>_id</code> of the document you want to reference.
                                </small>
                            </div>
                        ) : (
                            <input
                                type={field.key === 'password' ? 'password' : 'text'}
                                className="input-field"
                                required={field.required}
                                placeholder={field.key === 'password' ? 'Min 6 characters' : `Enter ${field.key}`}
                                value={formData[field.key] || ''}
                                onChange={(e) => onChange(field.key, e.target.value)}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// FUNCTION - AUTH COMPONENT
export default function Auth() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [project, setProject] = useState(null);
    const [isEnabling, setIsEnabling] = useState(false);
    const [isSavingProviders, setIsSavingProviders] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSocialAuthModalOpen, setIsSocialAuthModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('github');
    const [authProviders, setAuthProviders] = useState({
        github: { enabled: false, clientId: '', clientSecret: '', hasClientSecret: false },
        google: { enabled: false, clientId: '', clientSecret: '', hasClientSecret: false }
    });
    
    const [addFormData, setAddFormData] = useState({ email: '', password: '', username: '' });
    const [isAdding, setIsAdding] = useState(false);

    const [editingUser, setEditingUser] = useState(null);
    const [isUpdatingUser, setIsUpdatingUser] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetTargetUser, setResetTargetUser] = useState(null);
    const [newPassVal, setNewPassVal] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
    const [sessionsTargetUser, setSessionsTargetUser] = useState(null);
    const [userSessions, setUserSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [revokingSessionId, setRevokingSessionId] = useState(null);

    const siteUrl = project?.siteUrl || '';
    const githubCallbackUrl = `${PUBLIC_API_URL}/api/userAuth/social/github/callback`;
    const googleCallbackUrl = `${PUBLIC_API_URL}/api/userAuth/social/google/callback`;
    const activeProvider = selectedProvider === 'google' ? authProviders.google : authProviders.github;
    const activeCallbackUrl = selectedProvider === 'google' ? googleCallbackUrl : githubCallbackUrl;

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

    const getApiErrorMessage = (err, fallback) => {
        const data = err?.response?.data;
        if (!data) return fallback;
        if (typeof data.message === 'string' && data.message.trim()) return data.message;
        if (typeof data.error === 'string' && data.error.trim()) return data.error;
        return fallback;
    };

    const normalizeAuthProviders = (providers = {}) => ({
        github: {
            enabled: !!providers?.github?.enabled,
            clientId: providers?.github?.clientId || '',
            clientSecret: '',
            hasClientSecret: !!providers?.github?.hasClientSecret,
        },
        google: {
            enabled: !!providers?.google?.enabled,
            clientId: providers?.google?.clientId || '',
            clientSecret: '',
            hasClientSecret: !!providers?.google?.hasClientSecret,
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const projRes = await api.get(`/api/projects/${projectId}`);
                
                setProject(projRes.data);
                setAuthProviders(normalizeAuthProviders(projRes.data.authProviders));

                if (projRes.data.isAuthEnabled) {
                    try {
                        const usersRes = await api.get(
                            `/api/projects/${projectId}/collections/users/data`
                        );
                        setUsers(usersRes.data);
                    } catch {
                         // If users collection doesn't exist yet but auth is enabled, just show empty
                         setUsers([ ]);
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load project details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

// PATCH REQ FOR TOGGLE AUTH
    const handleEnableAuth = async () => {
        setIsEnabling(true);
        try {
            const res = await api.patch(
                `/api/projects/${projectId}/auth/toggle`,
                { enable: true }
            );
            
            setProject(res.data.project);
            toast.success("Authentication enabled for this project!");
            
            // Re-fetch users (should be empty now)
            try {
                const usersRes = await api.get(
                    `/api/projects/${projectId}/collections/users/data`
                );
                setUsers(usersRes.data);
            } catch {
                 setUsers([]);
            }

        } catch (err) {
            console.error(err);
            toast.error(getApiErrorMessage(err, "Failed to enable authentication"));
        } finally {
            setIsEnabling(false);
        }
    };

    const goToUsersSchemaPreset = () => {
        navigate(`/project/${projectId}/create-collection?name=users&preset=auth-users`);
    };

    const handleProviderFieldChange = (provider, field, value) => {
        setAuthProviders((prev) => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [field]: value,
            }
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
            const nextProviders = normalizeAuthProviders(res.data.authProviders);
            setAuthProviders(nextProviders);
            setProject((prev) => prev ? { ...prev, authProviders: res.data.authProviders } : prev);
            toast.success('Social auth settings saved');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to save social auth settings'));
        } finally {
            setIsSavingProviders(false);
        }
    };

// POST REQ FOR ADD USER (ADMIN)
    const handleAddUser = async (e) => {
        if (e) e.preventDefault();
        setIsAdding(true);
        try {
            const res = await api.post(
                `/api/projects/${projectId}/admin/users`,
                addFormData
            );
            setUsers([res.data.user, ...users]);
            setIsAddModalOpen(false);
            setAddFormData({ email: '', password: '', username: '' });
            toast.success("User created successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to create user");
        } finally {
            setIsAdding(false);
        }
    };

// FUNCTION - TRIGGER RESET MODAL
    const handleResetClick = (user) => {
        setResetTargetUser(user);
        setNewPassVal('');
        setIsResetModalOpen(true);
    };

// PATCH REQ FOR CONFIRM RESET PASSWORD
    const confirmResetPassword = async (e) => {
        if (e) e.preventDefault();
        if (!newPassVal || newPassVal.length < 6) return toast.error("Password must be at least 6 characters");

        setIsResetting(true);
        try {
            await api.patch(
                `/api/projects/${projectId}/admin/users/${resetTargetUser._id}/password`,
                { newPassword: newPassVal }
            );
            toast.success("Password reset successfully!");
            setIsResetModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to reset password");
        } finally {
            setIsResetting(false);
        }
    };

// FUNCTION - FETCH USER FOR EDIT
    const handleEditClick = async (userId) => {
        try {
            const res = await api.get(
                `/api/projects/${projectId}/admin/users/${userId}`
            );
            setEditingUser(res.data);
            const customFields = { ...res.data };
            ['_id', 'password', 'emailVerified', 'createdAt', 'updatedAt'].forEach(key => { delete customFields[key]; });
            setEditFormData(customFields);
        } catch {
            toast.error("Failed to fetch user details");
        }
    };

// PUT REQ FOR UPDATE USER (ADMIN)
    const handleUpdateUser = async () => {
        setIsUpdatingUser(true);
        try {
            await api.put(
                `/api/projects/${projectId}/admin/users/${editingUser._id}`,
                editFormData
            );
            
            toast.success("User updated successfully!");
            setEditingUser(null);
            
            // Refresh list
            const usersRes = await api.get(
                `/api/projects/${projectId}/collections/users/data`
            );
            setUsers(usersRes.data);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update user");
        } finally {
            setIsUpdatingUser(false);
        }
    };

// DELETE REQ FOR USER
    const handleDelete = async (id) => {
        if (!confirm("Delete this user permanently? They won't be able to login.")) return;

        try {
            await api.delete(
                `/api/projects/${projectId}/collections/users/data/${id}`
            );
            setUsers(users.filter(user => user._id !== id));
            toast.success("User deleted");
        } catch {
            toast.error("Failed to delete user");
        }
    };

// GET REQ FOR LIST USER SESSIONS
    const handleOpenSessions = async (user) => {
        setSessionsTargetUser(user);
        setIsSessionsModalOpen(true);
        setLoadingSessions(true);
        try {
            const res = await api.get(
                `/api/projects/${projectId}/admin/users/${user._id}/sessions`
            );
            setUserSessions(res.data?.sessions || []);
        } catch (err) {
            console.error(err);
            toast.error(getApiErrorMessage(err, "Failed to load user sessions"));
            setUserSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

// DELETE REQ FOR REVOKE USER SESSION
    const handleRevokeSession = async (tokenId) => {
        if (!sessionsTargetUser?._id) return;
        setRevokingSessionId(tokenId);
        try {
            await api.delete(
                `/api/projects/${projectId}/admin/users/${sessionsTargetUser._id}/sessions/${tokenId}`
            );
            setUserSessions((prev) => prev.filter((session) => session.tokenId !== tokenId));
            toast.success("Session revoked");
        } catch (err) {
            console.error(err);
            toast.error(getApiErrorMessage(err, "Failed to revoke session"));
        } finally {
            setRevokingSessionId(null);
        }
    };

    // FUNCTION - FILTER USERS
    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user._id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="container">Loading Users...</div>;

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '2.5rem', borderBottom: 'none' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={28} color="var(--color-primary)" /> Authentication
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Manage users who have signed up for your project.</p>
                </div>
                {/* Search Bar & Actions */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by email or ID"
                            className="input-field"
                            style={{ paddingLeft: '40px', background: 'var(--color-bg-input)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {project?.isAuthEnabled && hasUserCollection && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                className="btn btn-secondary" 
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 500, borderColor: 'var(--color-border)' }}
                                onClick={() => navigate(`/project/${projectId}/database?collection=users`)}
                            >
                                <Settings size={18} /> Configure Fields
                            </button>
                            <button 
                                className="btn btn-primary" 
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 500 }}
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                <UserPlus size={18} /> Add User
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Schema Missing Warning */}
            {project?.isAuthEnabled && !hasUserCollection && (
                <div style={{ 
                    background: 'rgba(255, 189, 46, 0.1)', 
                    border: '1px solid rgba(255, 189, 46, 0.2)', 
                    borderRadius: '12px', 
                    padding: '1.5rem', 
                    marginBottom: '2rem', 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center' 
                }}>
                    <AlertCircle color="#FFBD2E" size={24} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#FFBD2E', margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 600 }}>User Schema Required</h4>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                            Auth is enabled, but you haven't defined a <strong>"users"</strong> collection. Your Auth API will return errors until you create this collection in the Dashboard to define your user fields.
                        </p>
                        <button 
                            className="btn btn-primary" 
                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            onClick={() => navigate(`/project/${projectId}/create-collection?name=users`)}
                        >
                            Create "users" collection now
                        </button>
                    </div>
                </div>
            )}

            {project?.isAuthEnabled && hasUserCollection && !hasRequiredUsersSchema && (
                <div style={{
                    background: 'rgba(255, 189, 46, 0.1)',
                    border: '1px solid rgba(255, 189, 46, 0.2)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                }}>
                    <AlertCircle color="#FFBD2E" size={24} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#FFBD2E', margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 600 }}>Users Schema Needs Required Fields</h4>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                            Your <strong>"users"</strong> collection exists, but Auth needs <code>email</code> and <code>password</code> as required <code>String</code> fields.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            onClick={goToUsersSchemaPreset}
                        >
                            Open Prefilled Users Schema
                        </button>
                    </div>
                </div>
            )}

            {project?.isAuthEnabled && hasUserCollection && hasRequiredUsersSchema && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={18} color="var(--color-primary)" /> Social Auth
                            </h3>
                            <p style={{ margin: '8px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                Keep provider setup hidden by default. Open the Social Auth settings modal, choose GitHub or Google, then configure just that provider.
                            </p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setIsSocialAuthModalOpen(true)} style={{ whiteSpace: 'nowrap' }}>
                            Open Social Auth
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '0.85rem' }}>
                        {[
                            { key: 'github', label: 'GitHub', enabled: authProviders.github.enabled, secret: authProviders.github.hasClientSecret },
                            { key: 'google', label: 'Google', enabled: authProviders.google.enabled, secret: authProviders.google.hasClientSecret }
                        ].map((provider) => (
                            <button
                                key={provider.key}
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    setSelectedProvider(provider.key);
                                    setIsSocialAuthModalOpen(true);
                                }}
                                style={{
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                    <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{provider.label}</span>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                                        {provider.enabled ? 'Enabled' : 'Disabled'} {provider.secret ? '• Secret saved' : '• Secret missing'}
                                    </span>
                                </span>
                                <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>Configure</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isSocialAuthModalOpen && (
                <div
                    className="modal-overlay"
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setIsSocialAuthModalOpen(false)}
                >
                    <div
                        className="card modal-content"
                        style={{ width: '100%', maxWidth: '720px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={() => setIsSocialAuthModalOpen(false)}>
                            <X size={20} />
                        </button>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} color="var(--color-primary)" /> Social Auth Settings
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                                Select one provider, configure it, then save. Keep the main Auth page clean and only dive into details when needed.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className={`btn ${selectedProvider === 'github' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSelectedProvider('github')}
                            >
                                GitHub
                            </button>
                            <button
                                type="button"
                                className={`btn ${selectedProvider === 'google' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSelectedProvider('google')}
                            >
                                Google
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{selectedProvider === 'google' ? 'Google' : 'GitHub'}</h3>
                                    <p style={{ margin: '6px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                        {selectedProvider === 'google'
                                            ? 'Use Google Cloud Console, then paste only the client credentials here.'
                                            : 'Use GitHub OAuth Apps, then paste only the client credentials here.'}
                                    </p>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={!!activeProvider.enabled}
                                        onChange={(e) => handleProviderFieldChange(selectedProvider, 'enabled', e.target.checked)}
                                        style={{ accentColor: 'var(--color-primary)' }}
                                    />
                                    Enable {selectedProvider === 'google' ? 'Google' : 'GitHub'}
                                </label>
                            </div>

                            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.18)', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>SETUP FLOW</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                    {selectedProvider === 'google' ? (
                                        <>
                                            1. Set your Project <strong>Site URL</strong> in Project Settings.<br />
                                            2. Google Cloud Console: create a project and configure the OAuth consent screen.<br />
                                            3. Create OAuth Client ID as <strong>Web application</strong>.<br />
                                            4. Authorized JavaScript origins: <code>{siteUrl || 'Set Project Site URL first in Project Settings'}</code><br />
                                            5. Authorized redirect URI: <code>{activeCallbackUrl}</code><br />
                                            6. Paste Client ID and Client Secret here, enable Google, then save.
                                        </>
                                    ) : (
                                        <>
                                            1. Set your Project <strong>Site URL</strong> in Project Settings.<br />
                                            2. GitHub: Settings → Developer settings → OAuth Apps → Register a new application.<br />
                                            3. Homepage URL: <code>{siteUrl || 'Set Project Site URL first in Project Settings'}</code><br />
                                            4. Authorization callback URL: <code>{activeCallbackUrl}</code><br />
                                            5. Paste Client ID and Client Secret here, enable GitHub, then save.
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Client ID</label>
                                <input
                                    className="input-field"
                                    value={activeProvider.clientId}
                                    onChange={(e) => handleProviderFieldChange(selectedProvider, 'clientId', e.target.value)}
                                    placeholder={selectedProvider === 'google' ? 'Google OAuth client ID' : 'GitHub OAuth app client ID'}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Client Secret</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={activeProvider.clientSecret}
                                    onChange={(e) => handleProviderFieldChange(selectedProvider, 'clientSecret', e.target.value)}
                                    placeholder={activeProvider.hasClientSecret ? 'Saved. Enter to replace.' : 'Provider client secret'}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Callback URL</label>
                                <div className="input-field" style={{ display: 'flex', alignItems: 'center', minHeight: '46px', color: 'var(--color-text-main)' }}>
                                    <code style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeCallbackUrl}</code>
                                </div>
                                <p style={{ margin: '8px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                    Read-only. Paste this exact URL into the provider console.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '2rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsSocialAuthModalOpen(false)}>
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSaveProviders}
                                disabled={isSavingProviders}
                            >
                                {isSavingProviders ? 'Saving...' : 'Save Social Auth'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table or Enable UI */}
            {!project?.isAuthEnabled ? (
                <div className="card" style={{ padding: '6rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(62, 207, 142, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(62, 207, 142, 0.2)' }}>
                        <Shield size={40} color="var(--color-primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Enable Authentication</h2>
                    <p style={{ maxWidth: '400px', margin: '0 auto 2rem auto', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                        Activate the built-in authentication system to manage users, handle signups, and securely generate JWT tokens via your API.
                    </p>
                    {!hasUserCollection && (
                        <button
                            className="btn btn-secondary"
                            onClick={goToUsersSchemaPreset}
                            style={{ padding: '10px 20px', fontSize: '0.9rem', marginBottom: '0.85rem' }}
                        >
                            Setup Users Schema (Prefilled)
                        </button>
                    )}
                    <button 
                        className="btn btn-primary" 
                        onClick={handleEnableAuth} 
                        disabled={isEnabling}
                        style={{ padding: '12px 24px', fontSize: '1rem' }}
                    >
                        {isEnabling ? 'Enabling...' : 'Enable Authentication Now'}
                    </button>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                    {users.length === 0 ? (
                        <div style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
                                <Shield size={32} style={{ opacity: 0.5, color: 'var(--color-text-muted)' }} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>No users found</h3>
                            <p style={{ maxWidth: '300px', margin: '0 auto' }}>Users will appear here once they register via your API.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--color-bg-input)', borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ padding: '16px', textAlign: 'center', width: '60px' }}></th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>Email</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>User ID</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>Created At</th>
                                        <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="user-row" style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #333, #111)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '1px solid var(--color-border)' }}>
                                                    <User size={16} color="#aaa" />
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: 500, color: 'var(--color-text-main)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Mail size={14} color="var(--color-text-muted)" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-input)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                                    {user._id}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleOpenSessions(user)}
                                                    className="btn btn-ghost"
                                                    style={{ color: 'var(--color-text-muted)', padding: '8px', borderRadius: '6px', marginRight: '4px' }}
                                                    title="Manage Sessions"
                                                >
                                                    <Monitor size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(user._id)}
                                                    className="btn btn-ghost"
                                                    style={{ color: 'var(--color-text-muted)', padding: '8px', borderRadius: '6px', marginRight: '4px' }}
                                                    title="Edit Custom Fields"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                 <button
                                                    onClick={() => handleResetClick(user)}
                                                    className="btn btn-ghost"
                                                    style={{ color: 'var(--color-primary)', padding: '8px', borderRadius: '6px', marginRight: '4px' }}
                                                    title="Reset Password"
                                                    disabled={isResetting && resetTargetUser?._id === user._id}
                                                >
                                                    <Key size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="btn btn-ghost"
                                                    style={{ color: '#ef4444', padding: '8px', borderRadius: '6px' }}
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsAddModalOpen(false)}>
                    <div className="card modal-content" style={{ width: '100%', maxWidth: '450px', position: 'relative', animation: 'fadeInUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={() => setIsAddModalOpen(false)}>
                            <X size={20} />
                        </button>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserPlus size={24} color="var(--color-primary)" /> Add User
                        </h2>
                        <form onSubmit={handleAddUser}>
                            <DynamicUserForm 
                                schema={usersCollection?.model} 
                                formData={addFormData} 
                                onChange={(key, val) => setAddFormData({ ...addFormData, [key]: val })} 
                            />
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                                    {isAdding ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingUser(null)}>
                    <div className="card modal-content" style={{ width: '100%', maxWidth: '600px', padding: '2rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" style={{ position: 'absolute', top: '20px', right: '20px' }} onClick={() => setEditingUser(null)}>
                            <X size={20} />
                        </button>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Edit2 size={24} color="var(--color-primary)" /> Edit User Data
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Modifying profile for: <strong>{editingUser.email}</strong></p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <DynamicUserForm 
                                isEdit={true}
                                schema={usersCollection?.model}
                                formData={editFormData}
                                onChange={(key, val) => setEditFormData({ ...editFormData, [key]: val })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
                            <button 
                                className="btn btn-primary" 
                                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                                onClick={handleUpdateUser}
                                disabled={isUpdatingUser}
                            >
                                <Save size={18} /> {isUpdatingUser ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {isResetModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsResetModalOpen(false)}>
                    <div className="card modal-content" style={{ width: '100%', maxWidth: '400px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={() => setIsResetModalOpen(false)}>
                            <X size={20} />
                        </button>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Key size={24} color="var(--color-primary)" /> Reset Password
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Enter a new password for <strong>{resetTargetUser?.email}</strong>
                        </p>
                        
                        <form onSubmit={confirmResetPassword}>
                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Min 6 characters"
                                    required
                                    autoFocus
                                    value={newPassVal}
                                    onChange={(e) => setNewPassVal(e.target.value)}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsResetModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isResetting}>
                                    {isResetting ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isSessionsModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsSessionsModalOpen(false)}>
                    <div className="card modal-content" style={{ width: '100%', maxWidth: '760px', position: 'relative', maxHeight: '75vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={() => setIsSessionsModalOpen(false)}>
                            <X size={20} />
                        </button>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Monitor size={22} color="var(--color-primary)" /> User Sessions
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                            Active sessions for <strong>{sessionsTargetUser?.email}</strong>
                        </p>

                        {loadingSessions ? (
                            <p style={{ color: 'var(--color-text-muted)' }}>Loading sessions...</p>
                        ) : userSessions.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)' }}>No active sessions found.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {userSessions.map((session) => (
                                    <div key={session.tokenId} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginBottom: '4px' }}>
                                                {session.userAgent || 'unknown'}
                                                {session.isCurrent ? <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--color-primary)' }}>(Current)</span> : null}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                IP: {session.ip || 'unknown'} • Last used: {session.lastUsedAt ? new Date(session.lastUsedAt).toLocaleString() : 'N/A'}
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-ghost"
                                            style={{ color: '#ef4444', padding: '8px', borderRadius: '6px', flexShrink: 0 }}
                                            onClick={() => handleRevokeSession(session.tokenId)}
                                            disabled={revokingSessionId === session.tokenId}
                                            title="Revoke session"
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .user-row:hover {
                    background-color: var(--color-bg-input);
                }
                .user-row:last-child {
                    border-bottom: none;
                }
            `}</style>
        </div>
    );
}
