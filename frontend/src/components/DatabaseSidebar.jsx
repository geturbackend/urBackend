import {
    Plus,
    X,
    Database as DbIcon,
    ChevronRight,
    Trash2,
} from "lucide-react";

export default function DatabaseSidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    collections,
    activeCollection,
    setActiveCollection,
    project,
    navigate,
    projectId,
    onRequestDelete
}) {
    return (
        <aside className={`db-sidebar ${isSidebarOpen ? "open" : ""}`}>
            <div className="sidebar-header-area">
                <h3 className="section-title">
                    COLLECTIONS
                    <span className="badge">{collections.length}</span>
                </h3>
                <div className="sidebar-actions">
                    <button
                        className="btn-icon hide-desktop"
                        onClick={() => setIsSidebarOpen(false)}
                    >
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
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                                navigate(`/project/${projectId}/create-collection`)
                            }
                        >
                            Create One
                        </button>
                    </div>
                ) : (
                    collections.map((c) => (
                        <div
                            key={c._id}
                            onClick={() => setActiveCollection(c)}
                            className={`collection-item ${activeCollection?._id === c._id ? "active" : ""
                                }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden" style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                <DbIcon size={16} className="col-icon shrink-0" />
                                <span className="col-name truncate" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                                <button
                                    className="btn-icon delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onRequestDelete) onRequestDelete(c);
                                    }}
                                    title="Delete Collection"
                                >
                                    <Trash2 size={14} />
                                </button>
                                {activeCollection?._id === c._id && (
                                    <ChevronRight size={14} className="active-indicator shrink-0" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="sidebar-footer">
                <div className="project-info">
                    <div className="dot"></div> {project?.name || "Project"}
                </div>
            </div>

            <style>{`
                /* Sidebar Styles - Scoped */
                .db-sidebar {
                    width: 280px;
                    background: transparent; 
                    border-right: none;
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
                    padding: 8px 12px;
                    margin-bottom: 4px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    color: var(--color-text-muted);
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }

                .collection-item:hover {
                    background: rgba(255,255,255,0.03);
                    color: var(--color-text-main);
                }

                .collection-item:hover .delete-btn {
                    opacity: 1;
                }

                .delete-btn {
                    opacity: 0;
                    padding: 4px;
                    color: var(--color-text-muted);
                    transition: all 0.2s;
                }

                .delete-btn:hover {
                    color: #ef4444; /* Red-500 */
                    background: rgba(239, 68, 68, 0.1);
                }

                .collection-item.active {
                    background: rgba(62, 207, 142, 0.1);
                    color: var(--color-primary);
                    border-color: rgba(62, 207, 142, 0.2);
                }

                .sidebar-footer {
                    padding: 1rem;
                    border-top: 1px solid var(--color-border);
                }

                .project-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: var(--color-text-muted);
                    font-weight: 500;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    background: #3ECF8E; /* Success/Brand color */
                    border-radius: 50%;
                    box-shadow: 0 0 8px rgba(62, 207, 142, 0.4);
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
                }
            `}</style>
        </aside>
    );
}
