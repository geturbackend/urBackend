import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Database as DbIcon, Plus, Trash2, RefreshCw,
    Code, Table as TableIcon, Search, Menu, X,
    ChevronRight, MoreVertical, FileText
} from 'lucide-react';
import { API_URL } from '../config';

export default function Database() {
    const { projectId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [project, setProject] = useState(null);
    const [collections, setCollections] = useState([]);
    const [activeCollection, setActiveCollection] = useState(null);
    const [data, setData] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newData, setNewData] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fetch Project & Collections
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/projects/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProject(res.data);
                setCollections(res.data.collections || []);

                const queryCollection = searchParams.get('collection');
                if (queryCollection) {
                    const found = res.data.collections.find(c => c.name === queryCollection);
                    if (found) setActiveCollection(found);
                } else if (res.data.collections.length > 0) {
                    setActiveCollection(res.data.collections[0]);
                }
            } catch {
                toast.error("Failed to load project");
            }
        };
        fetchProject();
    }, [projectId, token, searchParams]);

    const fetchData = useCallback(async () => {
        if (!activeCollection) return;
        setLoadingData(true);
        try {
            const res = await axios.get(`${API_URL}/api/projects/${projectId}/collections/${activeCollection.name}/data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load data");
        } finally {
            setLoadingData(false);
        }
    }, [activeCollection, projectId, token]);

    // Fetch Data on Collection Change
    useEffect(() => {
        if (!activeCollection) return;
        setSearchParams({ collection: activeCollection.name });
        fetchData();
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
    }, [activeCollection, fetchData, setSearchParams]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await axios.delete(`${API_URL}/api/projects/${projectId}/collections/${activeCollection.name}/data/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(prev => prev.filter(item => item._id !== id));
            toast.success("Document deleted");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete document");
        }
    };

    const handleAddDocument = async (e) => {
        e.preventDefault();
        try {
            const formattedData = { ...newData };
            (activeCollection.model || []).forEach(field => {
                if (field.type === 'Number') formattedData[field.key] = Number(formattedData[field.key]);
                if (field.type === 'Boolean') formattedData[field.key] = formattedData[field.key] === 'true';
            });

            await axios.post(`${API_URL}/api/projects/${projectId}/collections/${activeCollection.name}/data`, formattedData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Document added successfully");
            setIsAddModalOpen(false);
            setNewData({});
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to add data");
        }
    };

    const renderInput = (field) => {
        const val = newData[field.key] || '';
        if (field.type === 'Boolean') {
            return (
                <div className="select-wrapper">
                    <select
                        className="input-field"
                        value={val}
                        onChange={e => setNewData({ ...newData, [field.key]: e.target.value })}
                        required={field.required}
                    >
                        <option value="">Select Boolean...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
            );
        }
        return (
            <input
                type={field.type === 'Number' ? 'number' : field.type === 'Date' ? 'datetime-local' : 'text'}
                className="input-field"
                placeholder={`Enter ${field.key}`}
                value={val}
                onChange={e => setNewData({ ...newData, [field.key]: e.target.value })}
                required={field.required}
            />
        );
    };

    // --- SUB-COMPONENTS --- //

    const Sidebar = () => (
        <aside className={`db-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header-area">
                <h3 className="section-title">
                    COLLECTIONS
                    <span className="badge">{collections.length}</span>
                </h3>
                <div className="sidebar-actions">
                    <button className="btn-icon hide-desktop" onClick={() => setIsSidebarOpen(false)}>
                        <X size={18} />
                    </button>
                    <button
                        className="btn-icon add-col-btn"
                        onClick={() => navigate(`/project/${projectId}/create-collection`)}
                        title="New Collection"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            <div className="collection-list">
                {collections.length === 0 ? (
                    <div className="empty-sidebar">
                        <p>No collections yet.</p>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/project/${projectId}/create-collection`)}>
                            Create One
                        </button>
                    </div>
                ) : (
                    collections.map(c => (
                        <div
                            key={c._id}
                            onClick={() => setActiveCollection(c)}
                            className={`collection-item ${activeCollection?._id === c._id ? 'active' : ''}`}
                        >
                            <DbIcon size={16} className="col-icon" />
                            <span className="col-name">{c.name}</span>
                            {activeCollection?._id === c._id && <ChevronRight size={14} className="active-indicator" />}
                        </div>
                    ))
                )}
            </div>

            <div className="sidebar-footer">
                <div className="project-info">
                    <div className="dot"></div> {project?.name || 'Project'}
                </div>
            </div>
        </aside>
    );

    const TableView = () => (
        <div className="table-container fade-in">
            <table className="modern-table">
                <thead>
                    <tr>
                        <th className="w-12">#</th>
                        {(activeCollection.model || []).map(field => (
                            <th key={field.key}>
                                <div className="th-content">
                                    {field.key}
                                    <span className="type-badge">{field.type}</span>
                                </div>
                            </th>
                        ))}
                        <th>ID</th>
                        <th className="w-10">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={row._id} className="table-row">
                            <td className="text-muted">{i + 1}</td>
                            {(activeCollection.model || []).map(field => (
                                <td key={field.key}>
                                    {typeof row[field.key] === 'boolean' ? (
                                        <span className={`status-badge ${row[field.key] ? 'success' : 'danger'}`}>
                                            {String(row[field.key])}
                                        </span>
                                    ) : (
                                        <span className="cell-text">{String(row[field.key])}</span>
                                    )}
                                </td>
                            ))}
                            <td className="font-mono text-xs text-muted">
                                {row._id.substring(0, 8)}...
                            </td>
                            <td>
                                <button className="btn-icon danger-hover" onClick={() => handleDelete(row._id)}>
                                    <Trash2 size={15} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const JsonView = () => (
        <div className="json-container fade-in" style={{ height: '100%', overflowY: 'auto' }}>
            <pre className="json-pre">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );

    const SkeletonLoader = () => (
        <div className="skeleton-container">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-row">
                    <div className="skeleton skeleton-text w-full"></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="db-layout">
            {/* Mobile Overlay */}
            <div
                className={`sidebar-backdrop ${isSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <Sidebar />

            <main className="db-main">
                {activeCollection ? (
                    <>
                        <header className="db-header glass-panel">
                            <div className="header-left">
                                <button className="btn-icon hide-desktop menu-trigger" onClick={() => setIsSidebarOpen(true)}>
                                    <Menu size={20} />
                                </button>
                                <div>
                                    <div className="breadcrumbs">
                                        <span className="crumb-project">{project?.name}</span>
                                        <span className="crumb-sep">/</span>
                                        <span className="crumb-col">{activeCollection.name}</span>
                                    </div>
                                    <h1 className="header-title">{activeCollection.name}</h1>
                                </div>
                            </div>

                            <div className="header-actions">
                                <span className="record-count">{data.length} Records</span>

                                <div className="view-toggle">
                                    <button
                                        className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                                        onClick={() => setViewMode('table')}
                                        title="Table View"
                                    >
                                        <TableIcon size={16} />
                                    </button>
                                    <button
                                        className={`toggle-btn ${viewMode === 'json' ? 'active' : ''}`}
                                        onClick={() => setViewMode('json')}
                                        title="JSON View"
                                    >
                                        <Code size={16} />
                                    </button>
                                </div>

                                <button onClick={fetchData} className="btn btn-secondary btn-icon-only">
                                    <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''} />
                                </button>

                                <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
                                    <Plus size={18} />
                                    <span className="hide-mobile">Add Record</span>
                                </button>
                            </div>
                        </header>

                        <div className="db-content">
                            {loadingData ? (
                                <SkeletonLoader />
                            ) : data.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon-wrapper">
                                        <FileText size={40} />
                                    </div>
                                    <h3>No data found</h3>
                                    <p>Start by adding your first document to this collection.</p>
                                    <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary mt-4">
                                        Add Document
                                    </button>
                                </div>
                            ) : (
                                viewMode === 'table' ? <TableView /> : <JsonView />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="no-collection-state">
                        <button className="btn-icon hide-desktop menu-trigger absolute-trigger" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="center-content">
                            <DbIcon size={48} className="text-muted mb-4 opacity-20" />
                            <h2>Select a Collection</h2>
                            <p className="text-muted">Choose a collection from the sidebar to manage your data.</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Add Document Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel slide-up">
                        <div className="modal-header">
                            <h3>Add New Document</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="btn-icon">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddDocument} className="modal-body">
                            {(activeCollection.model || []).map(field => (
                                <div key={field.key} className="form-group">
                                    <label className="form-label">
                                        {field.key}
                                        {field.required && <span className="text-danger">*</span>}
                                        <span className="field-type-hint">{field.type}</span>
                                    </label>
                                    {renderInput(field)}
                                </div>
                            ))}
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-ghost">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Document</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                /* Component Specific Styles */
                .db-layout {
                    display: flex;
                    height: 100%; /* Fill the proper container */
                    overflow: hidden;
                    background: var(--color-bg-main);
                    position: relative;
                }

                /* Sidebar */
                .db-sidebar {
                    width: 280px;
                    background: var(--color-bg-sidebar);
                    border-right: 1px solid var(--color-border);
                    display: flex;
                    flex-direction: column;
                    z-index: 100;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .sidebar-header-area {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .section-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .badge {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                    color: white;
                    font-size: 0.7rem;
                }
                
                .collection-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                }

                .collection-item {
                    padding: 10px 12px;
                    margin-bottom: 4px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--color-text-muted);
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }

                .collection-item:hover {
                    background: rgba(255,255,255,0.03);
                    color: var(--color-text-main);
                }

                .collection-item.active {
                    background: rgba(62, 207, 142, 0.1);
                    color: var(--color-primary);
                    border-color: rgba(62, 207, 142, 0.2);
                }

                /* Main Content Area */
                .db-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                }

                .db-header {
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--color-border);
                    z-index: 10;
                    flex-shrink: 0; /* Prevent header from collapsing */
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .breadcrumbs {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: var(--color-text-muted);
                    margin-bottom: 4px;
                }
                
                .header-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                    line-height: 1.2;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .db-content {
                    flex: 1;
                    overflow: hidden; /* For table scroll */
                    padding: 0;
                    position: relative;
                }

                /* Table Styling */
                .table-container {
                    height: 100%;
                    overflow: auto;
                }

                .modern-table {
                    width: 100%;
                    min-width: 800px;
                    border-collapse: collapse;
                }

                .modern-table th {
                    background: var(--color-bg-card);
                    position: sticky;
                    top: 0;
                    z-index: 5;
                    padding: 12px 24px;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-text-muted);
                    border-bottom: 1px solid var(--color-border);
                }

                .modern-table td {
                    padding: 16px 24px;
                    background: transparent;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    font-size: 0.9rem;
                    transition: background 0.2s;
                }

                .table-row:hover td {
                    background: rgba(255,255,255,0.02);
                }
                
                .type-badge {
                    font-size: 0.65rem;
                    background: rgba(255,255,255,0.08);
                    padding: 2px 5px;
                    border-radius: 3px;
                    margin-left: 8px;
                    color: #aaa;
                    text-transform: none;
                }

                /* View Toggle */
                .view-toggle {
                    background: rgba(255,255,255,0.05);
                    padding: 3px;
                    border-radius: 6px;
                    display: flex;
                    gap: 2px;
                }

                .toggle-btn {
                    padding: 6px;
                    border: none;
                    background: transparent;
                    color: var(--color-text-muted);
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                }

                .toggle-btn.active {
                    background: var(--color-bg-card);
                    color: white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }

                /* Empty & Loading States */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--color-text-muted);
                }

                .empty-icon-wrapper {
                    background: rgba(255,255,255,0.03);
                    padding: 2rem;
                    border-radius: 50%;
                    margin-bottom: 1.5rem;
                }

                .skeleton-container {
                    padding: 2rem;
                }
                .skeleton-row {
                    height: 48px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                }
                .skeleton-text {
                    height: 20px;
                    border-radius: 4px;
                }
                
                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    z-index: 200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }

                .modal-content {
                    width: 100%;
                    max-width: 450px;
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 8px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    overflow: hidden;
                }

                .modal-header {
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #222;
                }

                .modal-body {
                    padding: 1.5rem;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 2rem;
                }
                
                .field-type-hint {
                    float: right;
                    font-size: 0.7rem;
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 3px;
                }

                /* Mobile Response */
                @media (max-width: 768px) {
                    .db-sidebar {
                        position: absolute;
                        height: 100%;
                        transform: translateX(-100%);
                        box-shadow: 5px 0 15px rgba(0,0,0,0.5);
                    }
                    .db-sidebar.open {
                        transform: translateX(0);
                    }
                    .sidebar-backdrop.active {
                        position: absolute;
                        inset: 0;
                        background: rgba(0,0,0,0.5);
                        z-index: 50;
                        backdrop-filter: blur(2px);
                    }
                    .db-header {
                        padding: 1rem;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .header-left {
                        width: 100%;
                    }
                    .header-actions {
                        width: 100%;
                        justify-content: space-between;
                    }
                    .record-count {
                        display: none;
                    }
                }
                
                .json-pre {
                    padding: 1.5rem;
                    color: #3ECF8E;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.85rem;
                    overflow: auto;
                    height: 100%;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                .slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .no-collection-state {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .absolute-trigger {
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    z-index: 20;
                }
                .center-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .opacity-20 { opacity: 0.2; }
                .text-muted { color: var(--color-text-muted); }
                .mb-4 { margin-bottom: 1rem; }
            `}</style>
        </div>
    );
}