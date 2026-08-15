import React, { useMemo, useState, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Settings2, Check, GripVertical, Eye, Pencil, RotateCcw } from "lucide-react";

/* Resizer Component */
const Resizer = ({ header }) => {
    return (
        <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className={`resizer ${header.column.getIsResizing() ? "isResizing" : ""}`}
            onPointerDown={(e) => e.stopPropagation()}
        />
    );
};

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

const getDeletionTooltip = (deletedAt, now) => {
    if (!deletedAt || !now) return "";
    const daysRemaining = Math.max(0, 30 - Math.floor((now - new Date(deletedAt).getTime()) / (1000 * 60 * 60 * 24)));
    return `Deleted on: ${formatDate(deletedAt)} (${daysRemaining} days until permanent deletion)`;
};

/* Draggable Header Component */
const DraggableColumnHeader = ({ header, children, style: propStyle, className }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: header.id,
        disabled: header.id === 'rowNumber' || header.id === 'actions' || header.id === '_id'
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 100 : propStyle.zIndex,
        ...propStyle,
        cursor: isDragging ? 'grabbing' : (header.column.getCanSort() ? 'grab' : 'default'),
    };

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={`${className} ${isDragging ? 'dragging' : ''}`}
            {...attributes}
            {...listeners}
        >
            {children}
        </th>
    );
};

export default function CollectionTable({ data, activeCollection, onDelete, onView, onEdit, onRecover, recoveringIds, isViewer }) {
    const [now, setNow] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setNow(Date.now()), 0);
        return () => clearTimeout(timer);
    }, []);

    // 1. Column Definitions
    const columns = useMemo(() => {
        if (!activeCollection) return [];

        const SYSTEM_FIELDS = ['_id', '__v', 'createdAt', 'updatedAt', 'isDeleted', 'deletedAt'];

        const inferType = (value) => {
            if (typeof value === 'boolean') return 'BOOLEAN';
            if (typeof value === 'number') return 'NUMBER';
            if (Array.isArray(value)) return 'ARRAY';
            return 'STRING';
        };

        const baseColumns = activeCollection.model?.length > 0
            ? activeCollection.model.map(field => ({
                key: field.key,
                type: field.type
            }))
            : data?.length > 0
                ? Object.entries(data[0])
                    .filter(([key]) => !SYSTEM_FIELDS.includes(key))
                    .map(([key, value]) => ({
                        key,
                        type: inferType(value)
                    }))
                : [];

        return [
            {
                id: "rowNumber",
                header: "#",
                cell: (info) => <span className="text-muted" style={{ fontSize: '0.725rem' }}>{info.row.index + 1}</span>,
                size: 38,
                enableResizing: false,
                enableHiding: false,
            },
            ...baseColumns.map((field) => ({
                id: field.key,
                header: () => (
                    <div className="th-content">
                        <GripVertical size={11} className="drag-handle" style={{ marginRight: 4, opacity: 0.4 }} />
                        <span>{field.key}</span>
                        <span className="type-badge">{field.type}</span>
                    </div>
                ),
                accessorKey: field.key,
                size: 150,
                minSize: 70,
                maxSize: 400,
                cell: (info) => {
                    const value = info.getValue();
                    if (value === null || value === undefined) return <span className="text-muted">—</span>;
                    if (typeof value === "boolean") {
                        return (
                            <span className={`status-badge ${value ? "success" : "danger"}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                                {String(value)}
                            </span>
                        );
                    }
                    if (typeof value === "object" && !Array.isArray(value)) {
                        const keys = Object.keys(value).filter(k => !k.startsWith('_'));
                        return (
                            <div className="cell-content" title={JSON.stringify(value, null, 2)}
                                style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {`{${keys.slice(0, 2).join(', ')}${keys.length > 2 ? ', ...' : ''}}`}
                            </div>
                        );
                    }
                    if (Array.isArray(value)) {
                        return (
                            <div className="cell-content" title={JSON.stringify(value, null, 2)}
                                style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                [{value.length} item{value.length !== 1 ? 's' : ''}]
                            </div>
                        );
                    }
                    return (
                        <div className="cell-content">
                            {String(value)}
                        </div>
                    );
                },
            })),
            {
                id: "_id",
                header: "ID",
                accessorKey: "_id",
                size: 110,
                cell: (info) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="font-mono text-muted" style={{ fontSize: '0.725rem' }}>
                            {String(info.getValue()).substring(0, 8)}...
                        </span>
                        {info.row.original?.isDeleted && (
                            <span className="badge badge-danger" 
                                  title={getDeletionTooltip(info.row.original.deletedAt, now)}
                                  style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px', cursor: 'default' }}>
                                DEL
                            </span>
                        )}
                    </div>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                size: 78,
                enableResizing: false,
                enableHiding: false,
                cell: (info) => {
                    const record = info.row.original;
                    return (
                        <div className="flex gap-1" style={{ display: 'flex', gap: '2px' }}>
                            <button
                                className="btn-icon"
                                onClick={() => onView(record)}
                                onPointerDown={e => e.stopPropagation()}
                                aria-label="View Details"
                                title="View Details"
                                style={{ width: '22px', height: '22px', padding: 0 }}
                            >
                                <Eye size={12} />
                            </button>
                            {activeCollection?.name !== 'users' && !isViewer && (
                                (record.isDeleted || recoveringIds.has(record._id)) ? (
                                    <button
                                        className={`btn-icon ${recoveringIds.has(record._id) ? 'loading' : ''}`}
                                        onClick={() => onRecover(record._id)}
                                        onPointerDown={e => e.stopPropagation()}
                                        aria-label={`Restore record ${record._id}`}
                                        disabled={recoveringIds.has(record._id)}
                                        title={getDeletionTooltip(record.deletedAt, now)}
                                        style={{ width: '22px', height: '22px', padding: 0 }}
                                    >
                                        {recoveringIds.has(record._id) ? (
                                            <div className="spinner-small" style={{ width: '11px', height: '11px' }}></div>
                                        ) : (
                                            <RotateCcw size={12} color="var(--color-primary)" />
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="btn-icon"
                                            onClick={() => onEdit(record)}
                                            onPointerDown={e => e.stopPropagation()}
                                            aria-label="Edit Record"
                                            title="Edit"
                                            style={{ width: '22px', height: '22px', padding: 0 }}
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            className="btn-icon danger-hover"
                                            onClick={() => onDelete(record._id)}
                                            onPointerDown={e => e.stopPropagation()}
                                            aria-label="Delete Record"
                                            title="Delete"
                                            style={{ width: '22px', height: '22px', padding: 0 }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </>
                                )
                            )}
                        </div>
                    );
                },
            },
        ];
    }, [activeCollection, data, onDelete, onView, onEdit, onRecover, recoveringIds, now, isViewer]);

    // 2. Load Persisted State
    const storageKey = `table-settings-${activeCollection?._id}`;

    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnOrder, setColumnOrder] = useState([]);

    useEffect(() => {
        if (!activeCollection) return;

        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setColumnVisibility(parsed.columnVisibility || {});
                const savedOrder = parsed.columnOrder || [];
                const currentIds = columns.map(c => c.id);
                if (savedOrder.length > 0) {
                    const missing = currentIds.filter(id => !savedOrder.includes(id));
                    setColumnOrder([...savedOrder, ...missing]);
                } else {
                    setColumnOrder(currentIds);
                }
            } catch (e) {
                console.error("Failed to load table settings", e);
                setColumnOrder(columns.map(c => c.id));
            }
        } else {
            setColumnOrder(columns.map(c => c.id));
        }
    }, [activeCollection, columns, storageKey]);

    // 3. Persist State Changes
    useEffect(() => {
        if (!activeCollection || columnOrder.length === 0) return;
        const settings = {
            columnVisibility,
            columnOrder
        };
        localStorage.setItem(storageKey, JSON.stringify(settings));
    }, [columnVisibility, columnOrder, activeCollection, storageKey]);

    // 4. DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    // 5. Table Instance
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        state: {
            columnVisibility,
            columnOrder,
        },
        onColumnVisibilityChange: setColumnVisibility,
        onColumnOrderChange: setColumnOrder,
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
    });

    // 6. DnD Handler
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setColumnOrder((order) => {
                const oldIndex = order.indexOf(active.id);
                const newIndex = order.indexOf(over.id);
                return arrayMove(order, oldIndex, newIndex);
            });
        }
    };

    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // 7. Scroll Sync Slider
    const tableContainerRef = React.useRef(null);
    const [scrollState, setScrollState] = useState({
        scrollLeft: 0,
        scrollWidth: 0,
        clientWidth: 0
    });

    const updateScrollState = React.useCallback(() => {
        if (tableContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
            setScrollState({ scrollLeft, scrollWidth, clientWidth });
        }
    }, []);

    useEffect(() => {
        const el = tableContainerRef.current;
        if (!el) return;

        el.addEventListener('scroll', updateScrollState, { passive: true });
        updateScrollState();

        const observer = new ResizeObserver(updateScrollState);
        observer.observe(el);

        return () => {
            el.removeEventListener('scroll', updateScrollState);
            observer.disconnect();
        };
    }, [updateScrollState]);

    const handleSliderChange = (e) => {
        const value = Number(e.target.value);
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollLeft = value;
        }
    };

    const showSlider = scrollState.scrollWidth > scrollState.clientWidth;

    return (
        <div className="table-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
            {/* Slim Table Topbar */}
            <div className="table-toolbar" style={{
                position: 'relative',
                zIndex: 25,
                padding: '3px 8px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                background: 'var(--color-bg-card)',
                minHeight: '28px',
                height: '28px',
                flexShrink: 0
            }}>
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        aria-label={showColumnMenu ? "Close column menu" : "Open column menu"}
                        aria-haspopup="menu"
                        aria-expanded={showColumnMenu}
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            height: '22px',
                            background: showColumnMenu ? 'var(--color-surface-hover-strong)' : 'transparent',
                            borderRadius: '4px'
                        }}
                    >
                        <Settings2 size={12} />
                        <span>Columns</span>
                    </button>
                    {showColumnMenu && (
                        <>
                            <div
                                className="fixed-backdrop"
                                style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
                                onClick={() => setShowColumnMenu(false)}
                            />
                            <div
                                className="column-menu"
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 'calc(100% + 4px)',
                                    width: '180px',
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                    zIndex: 1001,
                                    background: 'var(--color-bg-card)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                                    padding: '4px'
                                }}
                            >
                                <div style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: 'var(--color-text-muted)',
                                    marginBottom: '4px',
                                    padding: '3px 6px',
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase'
                                }}>
                                    Toggle Columns
                                </div>
                                {table.getAllLeafColumns().map(column => {
                                    if (!column.getCanHide()) return null;
                                    return (
                                        <div
                                            key={column.id}
                                            className="column-toggle-item"
                                            onClick={column.getToggleVisibilityHandler()}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '4px 6px',
                                                cursor: 'pointer',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                color: column.getIsVisible() ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                                                transition: 'background 0.15s'
                                            }}
                                        >
                                            <div style={{
                                                width: '14px',
                                                height: '14px',
                                                border: `1px solid ${column.getIsVisible() ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                borderRadius: '3px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: column.getIsVisible() ? 'var(--color-primary)' : 'transparent',
                                                transition: 'all 0.15s'
                                            }}>
                                                {column.getIsVisible() && <Check size={10} color="#000" strokeWidth={3} />}
                                            </div>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {column.columnDef.header && typeof column.columnDef.header === 'string'
                                                    ? column.columnDef.header
                                                    : column.id === '_id' ? 'ID' : column.id}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div
                ref={tableContainerRef}
                className="table-container fade-in custom-scrollbar"
                style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, position: 'relative' }}
            >
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                >
                    <table className="tanstack-table" style={{ width: table.getTotalSize(), minWidth: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    <SortableContext
                                        items={columnOrder}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {headerGroup.headers.map((header) => {
                                            const isStickyLeft = header.id === 'rowNumber';
                                            const isStickyRight = header.id === 'actions';

                                            const style = {
                                                width: header.getSize(),
                                                position: (isStickyLeft || isStickyRight) ? "sticky" : "relative",
                                                left: isStickyLeft ? 0 : 'auto',
                                                right: isStickyRight ? 0 : 'auto',
                                                zIndex: (isStickyLeft || isStickyRight) ? 5 : 3,
                                                background: 'var(--color-bg-input)',
                                                borderRight: (isStickyLeft || isStickyRight) ? '1px solid var(--color-border)' : 'none',
                                                borderLeft: isStickyRight ? '1px solid var(--color-border)' : 'none'
                                            };

                                            return (
                                                <DraggableColumnHeader
                                                    key={header.id}
                                                    header={header}
                                                    style={style}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    {header.column.getCanResize() && (
                                                        <Resizer header={header} />
                                                    )}
                                                </DraggableColumnHeader>
                                            );
                                        })}
                                    </SortableContext>
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => {
                                const record = row.original;
                                return (
                                    <tr 
                                        key={row.id} 
                                        className={`table-row ${record.isDeleted ? 'row-deleted' : ''}`}
                                        style={{
                                            opacity: record.isDeleted ? 0.6 : 1,
                                            background: record.isDeleted ? 'rgba(234, 84, 85, 0.04)' : 'transparent',
                                            borderLeft: record.isDeleted ? '2px solid var(--color-danger)' : 'none'
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const columnId = cell.column.id;
                                            const isStickyLeft = columnId === 'rowNumber';
                                            const isStickyRight = columnId === 'actions';

                                            const style = {
                                                width: cell.column.getSize(),
                                                position: (isStickyLeft || isStickyRight) ? "sticky" : "relative",
                                                left: isStickyLeft ? 0 : 'auto',
                                                right: isStickyRight ? 0 : 'auto',
                                                zIndex: (isStickyLeft || isStickyRight) ? 2 : 1,
                                                borderRight: (isStickyLeft || isStickyRight) ? '1px solid var(--color-border)' : 'none',
                                                borderLeft: isStickyRight ? '1px solid var(--color-border)' : 'none'
                                            };

                                            return (
                                                <td key={cell.id} style={style} className={isStickyLeft || isStickyRight ? 'sticky-cell' : ''}>
                                                    <div 
                                                       className="cell-wrapper" 
                                                       title={typeof cell.getValue() === 'object' ? JSON.stringify(cell.getValue(), null, 2) : String(cell.getValue() ?? '')}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </DndContext>
            </div>

            {/* Slider Control */}
            {showSlider && (
                <div style={{ padding: '4px 12px', background: 'var(--color-bg-card)', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
                    <input
                        type="range"
                        min={0}
                        max={scrollState.scrollWidth - scrollState.clientWidth}
                        value={scrollState.scrollLeft}
                        onChange={handleSliderChange}
                        onInput={handleSliderChange}
                        aria-label="Scroll table horizontally"
                        style={{ width: '100%', cursor: 'ew-resize' }}
                        className="column-slider"
                    />
                </div>
            )}

            <style>{`
                /* Slider Styling */
                .column-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    background: var(--color-bg-input);
                    height: 3px;
                    border-radius: 2px;
                    outline: none;
                    display: block;
                }
                .column-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 40px;
                    height: 5px;
                    background: var(--color-text-muted);
                    border-radius: 3px;
                    cursor: ew-resize;
                    transition: background 0.15s, height 0.15s;
                }
                .column-slider::-webkit-slider-thumb:hover,
                .column-slider:active::-webkit-slider-thumb {
                    background: var(--color-primary);
                    height: 6px;
                }

                .table-container {
                     background: var(--color-bg-card);
                }
                .tanstack-table th {
                    text-transform: uppercase;
                    font-size: 0.675rem;
                    letter-spacing: 0.05em;
                    color: var(--color-text-muted);
                    font-weight: 600;
                    padding: 5px 8px;
                    text-align: left;
                    border-bottom: 1px solid var(--color-border);
                    background: var(--color-bg-input);
                    user-select: none;
                    touch-action: none;
                }
                .th-content {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .type-badge {
                    font-size: 0.6rem;
                    color: var(--color-primary);
                    background: rgba(62, 207, 142, 0.1);
                    border: 1px solid rgba(62, 207, 142, 0.2);
                    padding: 0 4px;
                    border-radius: 3px;
                    font-weight: 500;
                    margin-left: 2px;
                }
                .tanstack-table th.dragging {
                    z-index: 100 !important;
                    background: var(--color-bg-card);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                    opacity: 0.9;
                }
                
                .tanstack-table td {
                    font-size: 0.8125rem;
                    color: var(--color-text-main);
                    border-bottom: 1px solid var(--color-border);
                    transition: background-color 0.12s ease;
                }
                .cell-wrapper {
                    padding: 4px 8px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .table-row:hover {
                    background: var(--color-surface-hover);
                }
                .sticky-cell {
                    background: var(--color-bg-card);
                    transition: background-color 0.12s ease;
                }
                .table-row:hover .sticky-cell {
                    background: var(--color-surface-hover);
                }
                .column-toggle-item:hover {
                    background: var(--color-surface-hover);
                }
                .danger-hover:hover {
                    color: var(--color-danger);
                }
                .resizer {
                    position: absolute;
                    right: 0;
                    top: 0;
                    height: 100%;
                    width: 4px;
                    background: transparent;
                    cursor: col-resize;
                    user-select: none;
                    touch-action: none;
                }
                .resizer:hover, .resizer.isResizing {
                    background: var(--color-primary);
                }
                .drag-handle {
                    cursor: grab;
                }
                .drag-handle:active {
                    cursor: grabbing;
                }
            `}</style>
        </div>
    );
}
