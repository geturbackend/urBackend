import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UploadCloud, Trash2, File, ExternalLink, HardDrive, AlertTriangle, Copy, Grid, List } from 'lucide-react';
import SectionHeader from '../components/Dashboard/SectionHeader';

export default function Storage() {
    const { projectId } = useParams();
    const { user } = useAuth();

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [project, setProject] = useState(null);
    const fileInputRef = useRef(null);

    const fetchFiles = useCallback(async () => {
        try {
            const [projRes, filesRes] = await Promise.all([
                api.get(`/api/projects/${projectId}`),
                api.get(`/api/projects/${projectId}/storage/files`)
            ]);
            setProject(projRes.data);
            setFiles(filesRes.data);
        } catch {
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const myMember = project?.members?.find(m => {
        const memberId = typeof m.user === 'object' ? m.user?._id : m.user;
        return memberId?.toString() === user?._id?.toString() || m.email === user?.email;
    });
    const myRole = project?.owner?.toString() === user?._id?.toString() ? 'owner' : (myMember?.role || 'viewer');
    const isViewer = myRole === 'viewer';

    useEffect(() => {
        let isMounted = true;
        Promise.resolve().then(() => {
            if (isMounted) fetchFiles();
        });
        return () => { isMounted = false; };
    }, [fetchFiles]);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!user?.isVerified) {
            toast.error("Account Verification Required. Please verify in Settings.");
            return;
        }

        setUploading(true);
        const toastId = toast.loading("Uploading...");

        try {
            const requestRes = await api.post(`/api/projects/${projectId}/storage/upload-request`, {
                filename: file.name,
                contentType: file.type || 'application/octet-stream',
                size: file.size,
            });

            const signedUrl = requestRes?.data?.data?.signedUrl;
            const filePath = requestRes?.data?.data?.filePath;

            if (!signedUrl || !filePath) {
                throw new Error('Could not get upload URL');
            }

            const uploadRes = await fetch(signedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type || 'application/octet-stream',
                },
                body: file,
            });

            if (!uploadRes.ok) {
                throw new Error('Direct upload failed');
            }

            await api.post(`/api/projects/${projectId}/storage/upload-confirm`, {
                filePath,
                size: file.size,
            });

            toast.success("File uploaded!", { id: toastId });
            fetchFiles();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Upload failed", { id: toastId });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (path) => {
        if (!user?.isVerified) { toast.error("Account Verification Required."); return; }
        if (!confirm("Delete this file permanently?")) return;
        try {
            await api.post(`/api/projects/${projectId}/storage/delete`, { path });
            setFiles(files.filter(f => f.path !== path));
            toast.success("File deleted");
        } catch {
            toast.error("Failed to delete file");
        }
    };

    const handleDeleteAll = async () => {
        if (!user?.isVerified) { toast.error("Account Verification Required."); return; }
        const confirmMsg = prompt(`Type "DELETE" to confirm wiping all ${files.length} files.`);
        if (confirmMsg !== "DELETE") return;
        setDeletingAll(true);
        try {
            await api.delete(`/api/projects/${projectId}/storage/files`);
            setFiles([]);
            toast.success("All files deleted.");
        } catch {
            toast.error("Failed to clear storage");
        } finally {
            setDeletingAll(false);
        }
    };

    const copyUrl = (url) => {
        navigator.clipboard.writeText(url);
        toast.success("URL copied!");
    };

    const formatBytes = (bytes, decimals = 1) => {
        if (!+bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
    };

    const totalSize = files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
    
    // Skeleton Component for better UX


    if (loading) return <StorageSkeleton viewMode={viewMode} />;

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(62, 207, 142, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(62, 207, 142, 0.15)' }}>
                        <HardDrive size={16} color="var(--color-primary)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Storage</h1>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            {files.length} file{files.length !== 1 ? 's' : ''} · {formatBytes(totalSize)} used
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* View toggle */}
                    <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <button onClick={() => setViewMode('grid')} style={{ padding: '5px 8px', background: viewMode === 'grid' ? 'rgba(62,207,142,0.1)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-muted)', borderRight: '1px solid var(--color-border)' }}>
                            <Grid size={13} />
                        </button>
                        <button onClick={() => setViewMode('list')} style={{ padding: '5px 8px', background: viewMode === 'list' ? 'rgba(62,207,142,0.1)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                            <List size={13} />
                        </button>
                    </div>

                    {files.length > 0 && !isViewer && (
                        <button
                            onClick={handleDeleteAll}
                            className="btn btn-danger"
                            disabled={deletingAll}
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0 10px', gap: '5px' }}
                        >
                            <AlertTriangle size={12} />
                            {deletingAll ? 'Deleting...' : 'Delete All'}
                        </button>
                    )}
                    {!isViewer && (
                        <>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="btn btn-primary"
                                disabled={uploading}
                                style={{ height: '30px', fontSize: '0.75rem', padding: '0 12px', gap: '5px' }}
                            >
                                <UploadCloud size={13} />
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {files.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 2rem', borderStyle: 'dashed', borderRadius: '8px', borderColor: 'var(--color-border)' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', border: '1px solid var(--color-border)' }}>
                        <HardDrive size={22} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', fontWeight: 600 }}>No files uploaded</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginBottom: '1.5rem', maxWidth: '320px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                        Upload images, documents, or any assets to your storage bucket.
                    </p>
                    {isViewer ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginBottom: '1.5rem' }}>
                            Storage is empty.
                        </p>
                    ) : (
                        <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary" style={{ fontSize: '0.78rem', height: '30px' }}>
                            Upload your first file
                        </button>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <>
                    <SectionHeader title={`Files (${files.length})`} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                        {files.map((file) => {
                            const isImage = file.metadata?.mimetype?.startsWith('image/');
                            const ext = file.metadata?.mimetype?.split('/')[1]?.toUpperCase() || 'FILE';
                            const displayName = file.name.split('_').slice(1).join('_') || file.name;
                            return (
                                <div key={file.id} className="glass-card" style={{ borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'default' }}>
                                    {/* Preview */}
                                    <div className="file-preview" style={{ height: '120px', backgroundColor: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
                                        {isImage ? (
                                            <img src={file.publicUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                                        ) : (
                                            <File size={36} style={{ opacity: 0.15, color: '#fff' }} />
                                        )}
                                        <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(0,0,0,0.7)', color: 'var(--color-text-muted)', padding: '2px 5px', borderRadius: '3px' }}>{ext}</span>
                                    </div>
                                    {/* Info */}
                                    <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem', color: 'var(--color-text-main)' }} title={displayName}>
                                            {displayName}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                                            {formatBytes(file.metadata?.size)}
                                        </div>
                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '5px', marginTop: 'auto' }}>
                                            <button onClick={() => copyUrl(file.publicUrl)} title="Copy URL" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-muted)', gap: '3px', fontSize: '0.65rem' }}>
                                                <Copy size={11} /> Copy
                                            </button>
                                            <a href={file.publicUrl} target="_blank" rel="noreferrer" title="View file" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-muted)', gap: '3px', fontSize: '0.65rem', textDecoration: 'none' }}>
                                                <ExternalLink size={11} /> View
                                            </a>
                                            {!isViewer && (
                                                <button onClick={() => handleDelete(file.path)} title="Delete" style={{ padding: '4px 6px', background: 'rgba(234,84,85,0.08)', border: '1px solid rgba(234,84,85,0.2)', borderRadius: '4px', cursor: 'pointer', color: '#ea5455', display: 'flex', alignItems: 'center' }}>
                                                    <Trash2 size={11} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                /* List View */
                <>
                    <SectionHeader title={`Files (${files.length})`} />
                    <div className="glass-card" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Type</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Size</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((file) => {
                                    const isImage = file.metadata?.mimetype?.startsWith('image/');
                                    const ext = file.metadata?.mimetype?.split('/')[1]?.toUpperCase() || 'FILE';
                                    const displayName = file.name.split('_').slice(1).join('_') || file.name;
                                    return (
                                        <tr key={file.id} style={{ borderTop: '1px solid var(--color-border)', transition: 'background 0.15s' }} className="storage-row">
                                            <td style={{ padding: '8px 12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', background: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                                                        {isImage ? (
                                                            <img src={file.publicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <File size={12} style={{ opacity: 0.4 }} />
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }} title={displayName}>{displayName}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', background: 'var(--color-bg-input)', color: 'var(--color-text-muted)', padding: '2px 6px', borderRadius: '3px' }}>{ext}</span>
                                            </td>
                                            <td style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {formatBytes(file.metadata?.size)}
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => copyUrl(file.publicUrl)} title="Copy URL" style={{ padding: '4px 7px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem' }}>
                                                        <Copy size={11} /> Copy URL
                                                    </button>
                                                    <a href={file.publicUrl} target="_blank" rel="noreferrer" style={{ padding: '4px 7px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', textDecoration: 'none' }}>
                                                        <ExternalLink size={11} /> View
                                                    </a>
                                                    {!isViewer && (
                                                        <button onClick={() => handleDelete(file.path)} title="Delete" style={{ padding: '4px 7px', background: 'rgba(234,84,85,0.08)', border: '1px solid rgba(234,84,85,0.2)', borderRadius: '4px', cursor: 'pointer', color: '#ea5455', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem' }}>
                                                            <Trash2 size={11} /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <style>{`
                .file-preview:hover img { transform: scale(1.05); }
                .storage-row:hover { background: rgba(255,255,255,0.015); }
                .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-left-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

const StorageSkeleton = ({ viewMode }) => (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton" style={{ width: '120px', height: '18px' }} />
                    <div className="skeleton" style={{ width: '180px', height: '12px' }} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <div className="skeleton" style={{ width: '60px', height: '30px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '100px', height: '30px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '90px', height: '30px', borderRadius: '4px' }} />
            </div>
        </div>

        <div className="skeleton" style={{ width: '100px', height: '16px', marginBottom: '1rem' }} />

        {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="glass-card" style={{ borderRadius: '8px', overflow: 'hidden', height: '210px' }}>
                        <div className="skeleton" style={{ height: '120px', borderRadius: 0 }} />
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="skeleton" style={{ width: '80%', height: '14px' }} />
                            <div className="skeleton" style={{ width: '40%', height: '10px' }} />
                            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                <div className="skeleton" style={{ flex: 1, height: '20px' }} />
                                <div className="skeleton" style={{ flex: 1, height: '20px' }} />
                                <div className="skeleton" style={{ width: '25px', height: '20px' }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="glass-card" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ flex: 2, height: '14px' }} />
                            <div className="skeleton" style={{ flex: 1, height: '14px' }} />
                            <div className="skeleton" style={{ flex: 1, height: '14px' }} />
                            <div className="skeleton" style={{ width: '180px', height: '24px' }} />
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);