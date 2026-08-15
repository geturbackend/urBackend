import React, { useState, useEffect } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

const formatDate = (val) => {
    if (!val || typeof val !== 'string') return val;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) return val;
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).toLowerCase();
};

export default function RecordList({ data, activeCollection, onView, onRecover, recoveringIds, isViewer }) {
    const [now, setNow] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setNow(Date.now()), 0);
        return () => clearTimeout(timer);
    }, []);

    const getPreviewFields = (record) => {
        if (!activeCollection?.model) return [];
        return activeCollection.model.slice(0, 3).map(field => {
            const val = record[field.key];
            return {
                key: field.key,
                value: field.type === 'Date' ? formatDate(val) : (typeof val === 'string' ? formatDate(val) : val),
                type: field.type
            };
        });
    };

    const getDeletionTooltip = (deletedAt) => {
        if (!deletedAt || !now) return "";
        const daysRemaining = Math.max(0, 30 - Math.floor((now - new Date(deletedAt).getTime()) / (1000 * 60 * 60 * 24)));
        return `Deleted on: ${formatDate(deletedAt)} (${daysRemaining} days until permanent deletion)`;
    };

    return (
        <div className="record-list-container custom-scrollbar">
            <div className="record-list-wrapper">
                {data.map((record, index) => {
                    const previewFields = getPreviewFields(record);

                    return (
                        <div
                            key={record._id}
                            className={`record-card ${record.isDeleted ? 'record-deleted' : ''}`}
                            aria-label={`View details for record ${record._id}`}
                            onClick={() => onView(record)}
                            style={{
                                opacity: record.isDeleted ? 0.6 : 1,
                                background: record.isDeleted ? 'rgba(234, 84, 85, 0.04)' : 'var(--color-bg-card)',
                                borderLeft: record.isDeleted ? '3px solid var(--color-danger)' : '1px solid var(--color-border)'
                            }}
                        >
                            <div className="record-main-info">
                                <div className="record-header">
                                    <span className="record-index">#{index + 1}</span>
                                    <span className="record-id font-mono">{record._id.substring(0, 8)}...</span>
                                    {record.isDeleted && (
                                        <span className="badge badge-danger" 
                                              title={getDeletionTooltip(record.deletedAt)}
                                              style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', cursor: 'default' }}>
                                            DELETED
                                        </span>
                                    )}
                                </div>

                                <div className="record-preview-grid">
                                    {previewFields.map((field) => (
                                        <div key={field.key} className="preview-field">
                                            <span className="field-label">{field.key}</span>
                                            <span className="field-value truncate">
                                                {field.value !== null && typeof field.value === 'object' && !Array.isArray(field.value)
                                                    ? `{${Object.keys(field.value).filter(k => !k.startsWith('_')).slice(0, 2).join(', ')}...}`
                                                    : Array.isArray(field.value)
                                                        ? `[${field.value.length} item${field.value.length !== 1 ? 's' : ''}]`
                                                        : String(field.value ?? '')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="record-actions">
                                {(!isViewer && (record.isDeleted || recoveringIds.has(record._id))) ? (
                                    <button 
                                        className={`btn-icon ${recoveringIds.has(record._id) ? 'loading' : ''}`}
                                        title={getDeletionTooltip(record.deletedAt)}
                                        aria-label={`Recover record ${record._id}`}
                                        disabled={recoveringIds.has(record._id)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRecover(record._id);
                                        }}
                                    >
                                        {recoveringIds.has(record._id) ? (
                                            <div className="spinner-small"></div>
                                        ) : (
                                            <RotateCcw size={15} color="var(--color-primary)" />
                                        )}
                                    </button>
                                ) : (
                                    <button className="btn-icon" aria-label={`Open record ${record._id}`}>
                                        <ArrowRight size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .record-list-container {
                    height: 100%;
                    overflow-y: auto;
                    padding: 0.85rem;
                    background: var(--color-bg-main);
                }
                
                .record-list-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .record-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.65rem 1rem;
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    background: var(--color-bg-card);
                }
                
                .record-card:hover {
                    background: var(--color-surface-hover);
                    border-color: var(--color-primary);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .record-main-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .record-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 0.4rem;
                }
                
                .record-index {
                    font-size: 0.725rem;
                    color: var(--color-text-muted);
                    font-weight: 600;
                    background: var(--color-bg-input);
                    padding: 1px 5px;
                    border-radius: 4px;
                }
                
                .record-id {
                    font-size: 0.75rem;
                    color: var(--color-primary);
                }
                
                .record-preview-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
                    gap: 0.65rem;
                }
                
                .preview-field {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                
                .field-label {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-text-muted);
                    font-weight: 600;
                }
                
                .field-value {
                    font-size: 0.8125rem;
                    color: var(--color-text-main);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .record-actions {
                    padding-left: 1rem;
                    border-left: 1px solid var(--color-border);
                    margin-left: 1rem;
                    color: var(--color-text-muted);
                }
                
                .record-card:hover .record-actions {
                    color: var(--color-text-main);
                }
                
                .spinner-small {
                    width: 13px;
                    height: 13px;
                    border: 2px solid var(--color-border);
                    border-top: 2px solid var(--color-primary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .btn-icon.loading {
                    pointer-events: none;
                    opacity: 0.7;
                }
                
                @media (max-width: 600px) {
                    .record-card {
                        flex-direction: column;
                        align-items: flex-start;
                        padding: 0.75rem;
                    }
                    .record-actions {
                        display: none;
                    }
                    .record-preview-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
