import React from "react";
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
    showUsers = false,
    onRequestDelete,
    isViewer
}) {
    const visibleCollections = collections.filter(c => c.name !== 'users' || showUsers);

    return (
        <aside className={`db-sidebar ${isSidebarOpen ? "open" : ""}`}>
            <div className="sidebar-header-area">
                <h3 className="section-title">
                    COLLECTIONS
                    <span className="badge">{visibleCollections.length}</span>
                </h3>
                <div className="sidebar-actions">
                    <button
                        className="btn-icon hide-desktop"
                        aria-label="Close sidebar"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={16} />
                    </button>
                    {!isViewer && (
                        <button
                            className="btn-icon add-col-btn"
                            aria-label="New collection"
                            onClick={() => navigate(`/project/${projectId}/create-collection`)}
                            title="New Collection"
                        >
                            <Plus size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="collection-list custom-scrollbar">
                {visibleCollections.length === 0 ? (
                    <div className="empty-sidebar">
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>No collections yet.</p>
                        {!isViewer && (
                            <button
                                className="btn btn-secondary btn-sm"
                                aria-label="Create your first collection"
                                onClick={() =>
                                    navigate(`/project/${projectId}/create-collection`)
                                }
                                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            >
                                Create One
                            </button>
                        )}
                    </div>
                ) : (
                    visibleCollections.map((c) => (
                        <div
                            key={c._id}
                            onClick={() => setActiveCollection(c)}
                            className={`collection-item ${activeCollection?._id === c._id ? "active" : ""}`}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
                                <DbIcon size={14} className="col-icon" style={{ flexShrink: 0, opacity: activeCollection?._id === c._id ? 1 : 0.6 }} />
                                <span className="col-name truncate" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8125rem' }}>{c.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', flexShrink: 0 }}>
                                {!isViewer && (
                                    <button
                                        className="btn-icon delete-btn"
                                        aria-label="Delete Collection"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onRequestDelete) onRequestDelete(c);
                                        }}
                                        title="Delete Collection"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                                {activeCollection?._id === c._id && (
                                    <ChevronRight size={13} className="active-indicator" style={{ color: 'var(--color-primary)' }} />
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
                /* Sidebar Styles - Scoped & Compact */
                .db-sidebar {
                    width: 230px;
                    min-width: 230px;
                    background: var(--color-bg-sidebar); 
                    border-right: 1px solid var(--color-border);
                    display: flex;
                    flex-direction: column;
                    z-index: 100;
                    height: 100%;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .sidebar-header-area {
                    padding: 0.65rem 0.85rem;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    min-height: 42px;
                }

                .section-title {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin: 0;
                }

                .badge {
                    background: var(--color-surface-hover-strong);
                    border: 1px solid var(--color-border);
                    padding: 1px 5px;
                    border-radius: 10px;
                    color: var(--color-text-main);
                    font-size: 0.65rem;
                    font-weight: 600;
                }
                
                .collection-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0.4rem;
                }

                .collection-item {
                    padding: 5px 8px;
                    margin-bottom: 2px;
                    border-radius: 5px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    color: var(--color-text-muted);
                    transition: background-color 0.15s, color 0.15s;
                    border: 1px solid transparent;
                }

                .collection-item:hover {
                    background: var(--color-surface-hover);
                    color: var(--color-text-main);
                }

                .collection-item:hover .delete-btn {
                    opacity: 1;
                }

                .delete-btn {
                    opacity: 0;
                    padding: 3px;
                    color: var(--color-text-muted);
                    border-radius: 4px;
                    transition: opacity 0.15s, color 0.15s, background-color 0.15s;
                }

                .delete-btn:hover {
                    color: var(--color-danger);
                    background: rgba(234, 84, 85, 0.12);
                }

                .collection-item.active {
                    background: rgba(62, 207, 142, 0.08);
                    color: var(--color-primary);
                    border-color: rgba(62, 207, 142, 0.2);
                    font-weight: 500;
                }

                .sidebar-footer {
                    padding: 0.65rem 0.85rem;
                    border-top: 1px solid var(--color-border);
                    background: var(--color-bg-sidebar);
                }

                .project-info {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .dot {
                    width: 7px;
                    height: 7px;
                    background: var(--color-primary);
                    border-radius: 50%;
                    flex-shrink: 0;
                    box-shadow: 0 0 6px rgba(62, 207, 142, 0.4);
                }

                .empty-sidebar {
                    padding: 1.5rem 0.5rem;
                    text-align: center;
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
