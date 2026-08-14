import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
    Trash2, AlertTriangle, Settings, Database, Sliders
} from "lucide-react";
import SettingInfoTooltip from "../components/Settings/SettingInfoTooltip";
import ConfirmationModal from "./ConfirmationModal";
import SectionHeader from "../components/Dashboard/SectionHeader";
import IntegrationsSettings from "../components/Settings/IntegrationsSettings";
import AllowedDomainsForm from "../components/Settings/AllowedDomainsForm";
import { FormField, SettingsCard } from "../components/Settings/formPrimitives";
import { inputStyle } from "../utils/styles";

export default function ProjectSettings() {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [activeTab, setActiveTab] = useState(tabParam === 'integrations' ? 'integrations' : 'general');
    const [showModal, setShowModal] = useState(false);

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [hasResendKey, setHasResendKey] = useState(false);
    const [resendKeyValue, setResendKeyValue] = useState("");
    const [resendFromEmailValue, setResendFromEmailValue] = useState("");
    const [resendKeyLoading, setResendKeyLoading] = useState(false);

    const [newName, setNewName] = useState("");
    const [siteUrl, setSiteUrl] = useState("");
    const [renaming, setRenaming] = useState(false);

    useEffect(() => {
        if (tabParam === 'integrations' || tabParam === 'general') {
            Promise.resolve().then(() => setActiveTab(tabParam));
        }
    }, [tabParam]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('tab', tab);
            return next;
        }, { replace: true });
    };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await api.get(`/api/projects/${projectId}`);
                const projectData = res.data?.data || res.data;
                const myMember = projectData?.members?.find(m => {
                    const memberId = typeof m.user === 'object' ? m.user?._id : m.user;
                    return memberId?.toString() === user?._id?.toString() || m.email === user?.email;
                });
                const isViewer = projectData?.owner?.toString() !== user?._id?.toString() && (myMember?.role === 'viewer');
                
                if (isViewer) {
                    toast.error("Viewers cannot access project settings");
                    navigate(`/project/${projectId}/database`);
                    return;
                }

                setProject(projectData);
                setHasResendKey(!!projectData?.hasResendApiKey);
                setResendFromEmailValue(projectData.resendFromEmail || "");
                setNewName(projectData.name);
                setSiteUrl(projectData.siteUrl || "");
            } catch {
                toast.error("Failed to load project");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId, user, navigate]);

    const handleRename = async () => {
        if (!newName.trim()) return toast.error("Project name cannot be empty");
        setRenaming(true);
        try {
            await api.patch(`/api/projects/${projectId}`, { name: newName, siteUrl });
            toast.success("Project settings saved!");
            setProject((prev) => ({ ...prev, name: newName, siteUrl }));
        } catch {
            toast.error("Failed to save project settings");
        } finally {
            setRenaming(false);
        }
    };

    const handleResendKeySave = async () => {
        const trimmedKey = resendKeyValue.trim();
        const trimmedEmail = resendFromEmailValue.trim();
        const payload = {};
        if (trimmedKey) payload.resendApiKey = trimmedKey;
        if (trimmedEmail !== project?.resendFromEmail) payload.resendFromEmail = trimmedEmail;
        if (Object.keys(payload).length === 0) return toast.error("Nothing to update.");

        setResendKeyLoading(true);
        try {
            await api.patch(`/api/projects/${projectId}`, payload);
            toast.success("Mail settings saved.");
            const updates = {};
            if (payload.resendApiKey) { setResendKeyValue(""); setHasResendKey(true); updates.hasResendApiKey = true; }
            if (payload.resendFromEmail !== undefined) updates.resendFromEmail = payload.resendFromEmail;
            setProject((prev) => (prev ? { ...prev, ...updates } : prev));
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to save mail settings");
        } finally {
            setResendKeyLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        if (deleteConfirm !== project.name) return toast.error("Project name does not match");
        try {
            await api.delete(`/api/projects/${projectId}`);
            toast.success("Project deleted");
            navigate("/dashboard");
        } catch {
            toast.error("Failed to delete project");
        }
    };

    if (loading) return (
        <div className="container" style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                <div>
                    <div className="skeleton" style={{ width: '150px', height: '20px', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ width: '220px', height: '12px', marginTop: '4px', borderRadius: '4px' }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="card" style={{ padding: '1.5rem' }}>
                        <div className="skeleton" style={{ width: '150px', height: '18px', marginBottom: '1.25rem', borderRadius: '4px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const userId = user?._id || user?.id;
    const isOwner = project?.owner === userId || project?.owner?._id === userId;
    const memberObj = project?.members?.find(m => m.user === userId || m.user?._id === userId);
    const role = isOwner ? 'owner' : (memberObj?.role || 'viewer');
    const isViewer = role === 'viewer';

    return (
        <div className="container" style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem' }}>

            {/* Page header */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(62, 207, 142, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(62, 207, 142, 0.15)' }}>
                    <Settings size={16} color="var(--color-primary)" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Project Settings</h1>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        Configuration for <strong style={{ color: 'var(--color-text-main)' }}>{project?.name}</strong>
                    </p>
                </div>
            </div>

            {/* Top Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => handleTabChange('general')}
                    style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'general' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'general' ? '#fff' : 'var(--color-text-muted)',
                        fontSize: '0.82rem',
                        fontWeight: activeTab === 'general' ? 600 : 400,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Sliders size={14} /> General
                </button>

                <button
                    onClick={() => handleTabChange('integrations')}
                    style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'integrations' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'integrations' ? '#fff' : 'var(--color-text-muted)',
                        fontSize: '0.82rem',
                        fontWeight: activeTab === 'integrations' ? 600 : 400,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Database size={14} /> Integrations & Services
                </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'general' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* General Information */}
                    <div>
                        <SectionHeader title="General" />
                        <SettingsCard title="Project Info" icon={Settings} iconColor="var(--color-primary)">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'end' }}>
                                <FormField
                                    label="Project Name"
                                    info={{
                                        title: 'Project Name',
                                        description: 'The display name for this project shown across the dashboard and SDKs. Renaming does not affect your API keys or existing data.',
                                        docsUrl: 'https://docs.ub.bitbros.in/introduction'
                                    }}
                                >
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        style={inputStyle}
                                        disabled={isViewer}
                                    />
                                </FormField>
                                <FormField
                                    label="Site URL"
                                    hint={<>Used by Social Auth to redirect to <code>/auth/callback</code></>}
                                    info={{
                                        title: 'Site URL',
                                        description: 'The root URL of your frontend application (e.g. https://myapp.com). After a successful social login (GitHub/Google), urBackend redirects users to your Site URL at /auth/callback. Leave blank if you are not using Social Auth.',
                                        docsUrl: 'https://docs.ub.bitbros.in/guides/social-auth'
                                    }}
                                >
                                    <input
                                        type="url"
                                        className="input-field"
                                        value={siteUrl}
                                        onChange={(e) => setSiteUrl(e.target.value)}
                                        placeholder="https://your-app.com"
                                        style={inputStyle}
                                        disabled={isViewer}
                                    />
                                </FormField>
                            </div>
                            {!isViewer && (
                                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleRename}
                                        className="btn btn-primary"
                                        disabled={renaming || (newName === project?.name && siteUrl === (project?.siteUrl || ""))}
                                        style={{ height: '30px', fontSize: '0.75rem', padding: '0 14px' }}
                                    >
                                        {renaming ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            )}
                        </SettingsCard>
                    </div>

                    {/* Allowed Domains (CORS) */}
                    <div>
                        <SectionHeader title="Security & Access" />
                        <AllowedDomainsForm project={project} projectId={projectId} onProjectUpdate={setProject} role={role} />
                    </div>

                    {/* Danger Zone */}
                    {isOwner && (
                        <div>
                            <SectionHeader title="Danger Zone" />
                            <div className="glass-card" style={{ borderRadius: '8px', border: '1px solid rgba(234,84,85,0.25)', background: 'rgba(234,84,85,0.02)', padding: '1rem' }}>
                                <div style={{ display: 'flex', gap: '7px', alignItems: 'center', marginBottom: '0.75rem', color: '#ea5455' }}>
                                    <AlertTriangle size={14} />
                                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                        Delete Project
                                        <SettingInfoTooltip
                                            title="Delete Project"
                                            description="Permanently deletes this project and ALL associated data: every collection, every document, all uploaded files, auth users, API keys, and team memberships. This cannot be undone. Export your data before proceeding."
                                        />
                                    </h3>
                                </div>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.75rem', lineHeight: 1.5 }}>
                                    This will permanently delete <strong style={{ color: '#fff' }}>{project?.name}</strong> and all associated data including collections, files, and users. This action cannot be undone.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end', maxWidth: '480px' }}>
                                    <FormField label={<>Type <strong style={{ textDecoration: 'underline', color: '#ea5455' }}>{project?.name}</strong> to confirm</>}>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder={project?.name}
                                            value={deleteConfirm}
                                            onChange={(e) => setDeleteConfirm(e.target.value)}
                                            style={{ ...inputStyle, border: '1px solid rgba(234,84,85,0.3)' }}
                                        />
                                    </FormField>
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="btn"
                                        disabled={deleteConfirm !== project?.name}
                                        style={{ height: '30px', fontSize: '0.75rem', padding: '0 12px', background: '#ea5455', color: '#fff', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: '0' }}
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* INTEGRATIONS TAB */
                <IntegrationsSettings
                    project={project}
                    projectId={projectId}
                    onProjectUpdate={setProject}
                    role={role}
                    hasResendKey={hasResendKey}
                    resendKeyValue={resendKeyValue}
                    setResendKeyValue={setResendKeyValue}
                    resendFromEmailValue={resendFromEmailValue}
                    setResendFromEmailValue={setResendFromEmailValue}
                    resendKeyLoading={resendKeyLoading}
                    handleResendKeySave={handleResendKeySave}
                />
            )}

            {showModal && (
                <ConfirmationModal
                    open={showModal}
                    title="Delete Project"
                    message="Are you sure you want to delete this project? This action cannot be undone."
                    onConfirm={() => { handleDeleteProject(); setShowModal(false); }}
                    onCancel={() => setShowModal(false)}
                />
            )}

            <style>{`
                .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-left-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
