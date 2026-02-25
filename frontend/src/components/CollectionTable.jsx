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
import { Trash2, Settings2, Check, GripVertical, Eye, Pencil } from "lucide-react";

/* Resizer Component - kept simple */
const Resizer = ({ header }) => {
    return (
        <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className={`resizer ${header.column.getIsResizing() ? "isResizing" : ""}`}
            // Stop propagation to prevent drag start when resizing
            onPointerDown={(e) => e.stopPropagation()}
        />
    );
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
        // Disable drag for sticky/pinned columns if desired, effectively pinning them
        disabled: header.id === 'rowNumber' || header.id === 'actions' || header.id === '_id'
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        // Ensure dragging item is on top
        zIndex: isDragging ? 100 : propStyle.zIndex,
        ...propStyle,
        cursor: isDragging ? 'grabbing' : (header.column.getCanSort() ? 'grab' : 'default'),
    };

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={`${className} ${isDragging ? 'dragging' : ''}`}
            // Listeners applied to the whole header for easier grabbing, 
            // or we could apply to a specific handle
            {...attributes}
            {...listeners}
        >
            {children}
        </th>
    );
};

export default function CollectionTable({ data, activeCollection, onDelete, onView, onEdit }) {
    // 1. Column Definitions
    const columns = useMemo(() => {
        if (!activeCollection?.model) return [];
        return [
            {
                id: "rowNumber",
                header: "#",
                cell: (info) => <span className="text-muted">{info.row.index + 1}</span>,
                size: 50,
                enableResizing: false,
                enableHiding: false,
            },
            ...activeCollection.model.map((field) => ({
                id: field.key, // Explicit ID matches accessorKey usually
                header: () => (
                    <div className="th-content">
                        {/* Drag Handle Indicator (Visual only, whole header is draggable) */}
                        <GripVertical size={12} className="drag-handle" style={{ marginRight: 6, opacity: 0.5 }} />
                        {field.key}
                        <span className="type-badge">{field.type}</span>
                    </div>
                ),
                accessorKey: field.key,
                size: 200,
                minSize: 100,
                maxSize: 500,
                cell: (info) => {
                    const value = info.getValue();
                    if (typeof value === "boolean") {
                        return (
                            <span className={`status-badge ${value ? "success" : "danger"}`}>
                                {String(value)}
                            </span>
                        );
                    }
                    return (
                        <div className="cell-content" title={String(value)}>
                            {String(value)}
                        </div>
                    );
                },
            })),
            {
                id: "_id",
                header: "ID",
                accessorKey: "_id",
                size: 150,
                cell: (info) => (
                    <span className="font-mono text-xs text-muted">
                        {String(info.getValue()).substring(0, 8)}...
                    </span>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                size: 120,
                enableResizing: false,
                enableHiding: false,
                cell: (info) => (
                    <div className="flex gap-1">
                        <button
                            className="btn-icon"
                            onClick={() => onView(info.row.original)}
                            onPointerDown={e => e.stopPropagation()}
                            title="View Details"
                        >
                            <Eye size={15} />
                        </button>
                        <button
                            className="btn-icon"
                            onClick={() => onEdit(info.row.original)}
                            onPointerDown={e => e.stopPropagation()}
                            title="Edit"
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            className="btn-icon danger-hover"
                            onClick={() => onDelete(info.row.original._id)}
                            onPointerDown={e => e.stopPropagation()}
                            title="Delete"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                ),
            },
        ];
    }, [activeCollection, onDelete, onView, onEdit]);

    // 2. Load Persisted State
    const storageKey = `table-settings-${activeCollection?._id}`;

    // Initial State Loaders
    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnOrder, setColumnOrder] = useState([]);

    useEffect(() => {
        if (!activeCollection) return;

        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setColumnVisibility(parsed.columnVisibility || {});
                // Verify saved order matches current columns (reconcile)
                const savedOrder = parsed.columnOrder || [];
                const currentIds = columns.map(c => c.id);
                // Simple reconciliation: use saved if it contains all current, otherwise append new
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
    }, [activeCollection, columns, storageKey]); // Re-run when collection changes (or columns def changes)

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
                distance: 8, // Requires 8px movement to start drag (prevents accidental clicks)
            },
        }),
        useSensor(KeyboardSensor)
    );

    // 5. Table Instance
    // eslint-disable-next-line
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

    // Filter out pinned columns from SortableContext if we want to lock them
    // actually, allowing them to be in the list is fine, DraggableColumnHeader 'disabled' prop handles the interaction.
    // However, if we move 'rowNumber' it might look weird. 
    // Let's just pass the whole order.

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

    // Listen to scroll events on the table container
    useEffect(() => {
        const el = tableContainerRef.current;
        if (!el) return;

        el.addEventListener('scroll', updateScrollState, { passive: true });
        // Initial check
        updateScrollState();

        // ResizeObserver to handle window/container resizing
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
            // Update state manually locally to keep slider smooth, 
            // though the scroll listener will also fire.
            // setScrollState(prev => ({ ...prev, scrollLeft: value }));
        }
    };

    const showSlider = scrollState.scrollWidth > scrollState.clientWidth;

    return (
        <div className="table-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'visible' }}>
            {/* Toolbar Area */}
            <div className="table-toolbar glass-panel" style={{
                overflow: 'visible',
                position: 'relative',
                zIndex: 50,
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                background: 'rgba(10, 10, 10, 0.4)',
                backdropFilter: 'blur(10px)',
                marginBottom: '1px',
                
            }}>
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.8rem',
                            padding: '6px 12px',
                            background: showColumnMenu ? 'rgba(255,255,255,0.08)' : 'transparent'
                        }}
                    >
                        <Settings2 size={14} />
                        COLUMNS
                    </button>
   {showColumnMenu && (
                        <>
                            <div
                                className="fixed-backdrop"
                                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                                onClick={() => setShowColumnMenu(false)}
                            />
                            <div
                     className="column-menu glass-panel"
                 style={{
                       position: 'absolute',
                         right: 0,
                        top: 'calc(100% + 6px)',
                        width: '220px',
                         maxHeight: '320px',
                          overflowY: 'auto',
                           zIndex: 1000,
                        }}
                         >


                                <div style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: '#666',
                                    marginBottom: '8px',
                                    padding: '4px 8px',
                                    letterSpacing: '0.05em'
                                }}>
                                    TOGGLE COLUMNS
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
                                                gap: '10px',
                                                padding: '8px 10px',
                                                cursor: 'pointer',
                                                borderRadius: '6px',
                                                fontSize: '0.9rem',
                                                color: column.getIsVisible() ? 'white' : '#888',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                border: `1px solid ${column.getIsVisible() ? 'var(--color-primary)' : '#444'}`,
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: column.getIsVisible() ? 'var(--color-primary)' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}>
                                                {column.getIsVisible() && <Check size={12} color="black" strokeWidth={3} />}
                                            </div>
                                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {column.columnDef.header && typeof column.columnDef.header === 'string'
                                                    ? column.columnDef.header
                                                    : column.id === '_id' ? 'ID' : column.id}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                 
                </div>
            </div>

            <div
                ref={tableContainerRef}
                className="table-container fade-in custom-scrollbar"
                style={{ overflowX: 'auto', flex: 1 }}
            >
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                >
                    <table className="tanstack-table" style={{ width: table.getTotalSize(), minWidth: '100%' }}>
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    <SortableContext
                                        items={columnOrder}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {headerGroup.headers.map((header) => {
                                            /* Handle Sticky Columns */
                                            const isStickyLeft = header.id === 'rowNumber';
                                            const isStickyRight = header.id === 'actions';
                                            // _id is semi-sticky or just pinned

                                            const style = {
                                                width: header.getSize(),
                                                position: (isStickyLeft || isStickyRight) ? "sticky" : "relative",
                                                left: isStickyLeft ? 0 : 'auto',
                                                right: isStickyRight ? 0 : 'auto',
                                               zIndex: (isStickyLeft || isStickyRight) ? 5 : 3,

                                                background: 'rgba(10, 10, 10, 0.85)',
                                                backdropFilter: 'blur(8px)',
                                                boxShadow: isStickyRight ? '-5px 0 15px rgba(0,0,0,0.3)' : 'none'
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
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="table-row">
                                    {row.getVisibleCells().map((cell) => {
                                        /* Handle Sticky Cells */
                                        const columnId = cell.column.id;
                                        const isStickyLeft = columnId === 'rowNumber';
                                        const isStickyRight = columnId === 'actions';

                                        const style = {
                                            width: cell.column.getSize(),
                                            position: (isStickyLeft || isStickyRight) ? "sticky" : "relative",
                                            left: isStickyLeft ? 0 : 'auto',
                                            right: isStickyRight ? 0 : 'auto',
                                          zIndex: (isStickyLeft || isStickyRight) ? 2 : 1,

                                            boxShadow: isStickyRight ? '-5px 0 15px rgba(0,0,0,0.2)' : 'none'
                                        };

                                        return (
                                            <td key={cell.id} style={style} className={isStickyLeft || isStickyRight ? 'sticky-cell' : ''}>
                                                <div className="cell-wrapper">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Overlay for smoother drag visualization (optional, but good) */}
                    {/* <DragOverlay> ... </DragOverlay> */}
                </DndContext>
            </div>

            {/* Slider Control */}
            {showSlider && (
                <div style={{ padding: '8px 16px', background: 'var(--color-bg-card)', borderTop: '1px solid var(--color-border)' }}>
                    <input
                        type="range"
                        min={0}
                        max={scrollState.scrollWidth - scrollState.clientWidth}
                        value={scrollState.scrollLeft}
                        onChange={handleSliderChange}
                        onInput={handleSliderChange}
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
                    background: #222;
                    height: 4px;
                    border-radius: 2px;
                    outline: none;
                    display: block;
                }
                .column-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 60px;
                    height: 6px;
                    background: #555;
                    border-radius: 3px;
                    cursor: ew-resize;
                    transition: background 0.2s, height 0.2s;
                    box-shadow: 0 0 0 2px #111;
                }
                .column-slider::-webkit-slider-thumb:hover,
                .column-slider:active::-webkit-slider-thumb {
                    background: var(--color-primary);
                    height: 8px;
                }

                .table-container {
                     background: var(--color-bg-main);
                }
                .tanstack-table th {
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                    color: #888;
                    font-weight: 600;
                    padding: 0.75rem 1rem;
                    text-align: left;
                    border-bottom: 1px solid var(--color-border);
                    background: rgba(10, 10, 10, 0.95);
                    user-select: none; /* Important for dragging */
                    touch-action: none;
                }
                .tanstack-table th.dragging {
                    z-index: 100 !important;
                    background: #111;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
                    opacity: 0.9;
                }
                
                .tanstack-table td {
                    font-size: 0.9rem;
                    color: #ededed;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                    transition: background 0.15s ease;
                }
                .cell-wrapper {
                    padding: 0.75rem 1rem;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .table-row:hover {
                    background: rgba(255,255,255,0.03);
                }
                .sticky-cell {
                    background: var(--color-bg-main);
                    transition: background 0.15s ease;
                }
                .table-row:hover .sticky-cell {
                    background: #111;
                }
                .column-toggle-item:hover {
                    background: rgba(255,255,255,0.05);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #050505;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #222;
                    border-radius: 5px;
                    border: 2px solid #050505;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #444;
                }
                
                /* Drag Handle */
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


