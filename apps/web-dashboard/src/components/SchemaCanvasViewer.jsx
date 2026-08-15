import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  LayoutGrid, 
  List, 
  Key, 
  ArrowRight,
  Database
} from 'lucide-react';

const TYPE_COLORS = {
  String: { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
  Number: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
  Boolean: { bg: 'rgba(20, 184, 166, 0.12)', text: '#2dd4bf', border: 'rgba(20, 184, 166, 0.25)' },
  Date: { bg: 'rgba(168, 85, 247, 0.12)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.25)' },
  Ref: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  Array: { bg: 'rgba(14, 165, 233, 0.12)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.25)' },
  Object: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.25)' },
};

export default function SchemaCanvasViewer({
  schema,
  messages,
  insertResults,
  isInserting,
  onInsertAll,
  onResetChat,
  onNavigateToDb
}) {
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'list'
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredRef, setHoveredRef] = useState(null);
  
  const containerRef = useRef(null);

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(1.6, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoom(z => Math.max(0.45, Math.round((z - 0.15) * 100) / 100));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 30, y: 30 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.canvas-node') || e.target.closest('button')) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isPanning, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Wheel zoom handler
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(z => Math.min(1.6, Math.max(0.45, Math.round((z + delta) * 100) / 100)));
    }
  };

  const renderTypeBadge = (field) => {
    const typeKey = field.type || 'String';
    const styling = TYPE_COLORS[typeKey] || TYPE_COLORS.String;

    let displayLabel = field.type;
    if (field.type === 'Array' && field.items?.type) {
      displayLabel = `Array<${field.items.type}>`;
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: styling.bg,
          color: styling.text,
          border: `1px solid ${styling.border}`,
          borderRadius: '5px',
          padding: '2px 7px',
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.02em',
          fontFamily: 'monospace'
        }}
      >
        {displayLabel}
      </span>
    );
  };

  /**
   * Unified recursive field renderer for both Canvas and Table views.
   * Handles nested Object fields at every depth with consistent styling and badges.
   */
  const renderFieldTree = (field, depth = 0, isLast = false, viewType = 'canvas', keyPrefix = '') => {
    const isTable = viewType === 'list';
    const indentPadding = isTable ? 18 + depth * 16 : 16 + depth * 14;
    const nodeKey = `${keyPrefix}_${depth}_${field.name || 'field'}`;

    return (
      <React.Fragment key={nodeKey}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isTable ? `10px 18px 10px ${indentPadding}px` : `7px 16px 7px ${indentPadding}px`,
            borderBottom: isTable || !isLast ? '1px solid var(--color-border)' : 'none',
            fontSize: '0.8rem',
            borderLeft: depth > 0 ? '2px solid rgba(62, 207, 142, 0.35)' : 'none',
            backgroundColor: depth > 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
            transition: 'background-color 0.15s ease'
          }}
        >
          {/* Field Name & Required/Unique Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
            <span
              style={{
                fontFamily: 'monospace',
                color: depth > 0 ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                fontWeight: field.required ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {field.name}
            </span>
            {field.required && (
              <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.85rem' }} title="Required">*</span>
            )}
            {field.unique && (
              <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '0 3px', borderRadius: '2px', fontWeight: 700 }}>U</span>
            )}
          </div>

          {/* Type Badge & Ref Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderTypeBadge(field)}
            {field.type === 'Ref' && field.ref && (
              <span
                onMouseEnter={() => setHoveredRef(field.ref)}
                onMouseLeave={() => setHoveredRef(null)}
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
                title={`References collection '${field.ref}'`}
              >
                → {field.ref}
              </span>
            )}
          </div>
        </div>

        {/* Recurse through nested Object fields at every depth */}
        {field.fields && field.fields.length > 0 && (
          field.fields.map((subField, subIdx) => 
            renderFieldTree(
              subField, 
              depth + 1, 
              isLast && subIdx === field.fields.length - 1, 
              viewType,
              `${nodeKey}_${subIdx}`
            )
          )
        )}
      </React.Fragment>
    );
  };

  return (
    <div 
      className="flex flex-col w-full lg:w-[48%] h-full rounded-2xl overflow-hidden shadow-sm transition-all" 
      style={{ 
        backgroundColor: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)',
        display: 'flex',
        position: 'relative'
      }}
    >
      {/* Top Header & Toolbar */}
      <div 
        style={{ 
          padding: '0.85rem 1.25rem', 
          borderBottom: '1px solid var(--color-border)', 
          backgroundColor: 'var(--color-bg-card)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexShrink: 0,
          gap: '12px',
          flexWrap: 'wrap',
          zIndex: 10
        }}
      >
        {/* Left: Title & Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '7px', margin: 0 }}>
            <Sparkles size={15} style={{ color: 'var(--color-primary)' }} /> Schema Visualizer
          </h3>
          
          {schema && schema.length > 0 && (
            <div style={{ display: 'inline-flex', padding: '2px', background: 'var(--color-bg-input)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: viewMode === 'canvas' ? 'var(--color-primary)' : 'transparent',
                  color: viewMode === 'canvas' ? '#000' : 'var(--color-text-muted)',
                  transition: 'all 0.15s ease'
                }}
                title="Canvas ERD Graph"
              >
                <LayoutGrid size={12} /> Canvas
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: viewMode === 'list' ? 'var(--color-primary)' : 'transparent',
                  color: viewMode === 'list' ? '#000' : 'var(--color-text-muted)',
                  transition: 'all 0.15s ease'
                }}
                title="Table List View"
              >
                <List size={12} /> Table
              </button>
            </div>
          )}

          {messages.length > 1 && (
            <button
              type="button"
              onClick={onResetChat}
              className="btn btn-ghost"
              style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', borderRadius: '6px' }}
              title="Reset conversation"
            >
              <RotateCcw size={12} /> New Chat
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {schema && schema.length > 0 && (
            <button
              onClick={onInsertAll}
              disabled={isInserting}
              className="btn btn-primary"
              style={{ opacity: isInserting ? 0.7 : 1, padding: '5px 16px', fontSize: '0.825rem', borderRadius: '8px', fontWeight: 600 }}
            >
              {isInserting ? (
                <>
                  <div className="spinner-small" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: '#000', width: '12px', height: '12px' }}></div>
                  Inserting...
                </>
              ) : `✓ Insert All (${schema.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!schema || schema.length === 0 ? (
        <div 
          className="flex-1 flex flex-col items-center justify-center text-center transition-all" 
          style={{ 
            color: 'var(--color-text-muted)', 
            minHeight: '340px',
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundColor: 'var(--color-bg-card)'
          }}
        >
          <div style={{ padding: '20px', borderRadius: '50%', backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', marginBottom: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
            <Database className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          </div>
          <p style={{ fontSize: '0.925rem', color: 'var(--color-text-main)', fontWeight: 600, margin: 0 }}>Interactive Schema Canvas</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '6px', margin: 0, maxWidth: '280px' }}>
            Chat with the AI on the left to design and visualize your collections here in real-time.
          </p>
        </div>
      ) : viewMode === 'canvas' ? (
        /* ── Canvas ERD View ── */
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          style={{ 
            flex: 1, 
            position: 'relative', 
            overflow: 'hidden', 
            cursor: isPanning ? 'grabbing' : 'grab',
            backgroundColor: 'var(--color-bg-card)',
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1.2px, transparent 1.2px)',
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          {/* Insert Results Alert (Pinned on Top) */}
          {insertResults && (
            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 20, padding: '1rem 1.25rem', backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>Creation Results</p>
                <button
                  type="button"
                  onClick={onNavigateToDb}
                  className="btn btn-primary"
                  style={{ padding: '3px 10px', fontSize: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Continue to Database <ArrowRight size={12} />
                </button>
              </div>
              <ul className="space-y-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {insertResults.map((r, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: r.success ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    <span>{r.success ? '✓' : '✗'}</span>
                    <strong style={{ color: 'var(--color-text-main)' }}>{r.collection}</strong>
                    {!r.success && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>({r.error})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Floating Zoom & Canvas Controls */}
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '16px', 
              right: '16px', 
              zIndex: 15, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              backgroundColor: 'var(--color-bg-card)',
              padding: '4px 6px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              style={{ padding: '4px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-main)', minWidth: '38px', textAlign: 'center', userSelect: 'none' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              style={{ padding: '4px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border)', margin: '0 2px' }} />
            <button
              type="button"
              onClick={handleResetView}
              style={{ padding: '4px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              title="Reset view (1:1)"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Transformable Canvas Surface */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '32px',
              alignItems: 'flex-start',
              padding: '24px',
              minWidth: '1200px'
            }}
          >
            {schema.map((col, idx) => {
              const isTargetedByRef = hoveredRef === col.collection;
              return (
                <div
                  key={idx}
                  className="canvas-node"
                  style={{
                    width: '320px',
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid',
                    borderColor: isTargetedByRef ? 'var(--color-primary)' : 'var(--color-border)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: isTargetedByRef 
                      ? '0 0 24px rgba(62, 207, 142, 0.35)' 
                      : '0 12px 32px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    userSelect: 'text'
                  }}
                >
                  {/* Node Header */}
                  <div 
                    style={{ 
                      padding: '12px 16px', 
                      backgroundColor: 'var(--color-bg-input)', 
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div 
                        style={{ 
                          width: '26px', 
                          height: '26px', 
                          borderRadius: '6px', 
                          backgroundColor: 'rgba(62, 207, 142, 0.15)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--color-primary)'
                        }}
                      >
                        <Database size={14} />
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', fontFamily: 'monospace' }}>
                        {col.collection}
                      </span>
                    </div>

                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 600, 
                        color: 'var(--color-text-muted)',
                        backgroundColor: 'var(--color-bg-card)',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      {(col.fields?.length || 0) + 1} fields
                    </span>
                  </div>

                  {/* Node Fields List */}
                  <div style={{ padding: '4px 0', backgroundColor: 'var(--color-bg-card)' }}>
                    {/* Implicit _id Primary Key */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '7px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Key size={11} style={{ color: '#fbbf24' }} title="Primary Key" />
                        <span style={{ fontFamily: 'monospace', color: 'var(--color-text-main)', fontWeight: 600 }}>
                          _id
                        </span>
                      </div>
                      <span
                        style={{
                          backgroundColor: 'rgba(251, 191, 36, 0.12)',
                          color: '#fbbf24',
                          border: '1px solid rgba(251, 191, 36, 0.25)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '0.65rem',
                          fontFamily: 'monospace',
                          fontWeight: 600
                        }}
                      >
                        ObjectId
                      </span>
                    </div>

                    {/* Explicit Collection Fields (Recursive) */}
                    {col.fields?.map((f, fIdx) => 
                      renderFieldTree(f, 0, fIdx === col.fields.length - 1, 'canvas', `canvas_${col.collection}_${fIdx}`)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── List / Table View ── */
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-card)' }}>
          {insertResults && (
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>Insert Results</p>
                <button
                  type="button"
                  onClick={onNavigateToDb}
                  className="btn btn-primary"
                  style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Continue to Database <ArrowRight size={12} />
                </button>
              </div>
              <ul className="space-y-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {insertResults.map((r, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px', fontSize: '0.8rem', color: r.success ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    <span style={{ marginTop: '1px', fontWeight: 700 }}>{r.success ? '✓' : '✗'}</span>
                    <span style={{ color: 'var(--color-text-main)' }}>
                      <strong style={{ fontWeight: 600 }}>{r.collection}</strong>
                      {!r.success && <span style={{ display: 'block', color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '4px' }}>{r.error}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {schema.map((col, idx) => (
              <div key={idx} style={{ backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', animation: 'fadeIn 0.4s ease-out' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-primary)', marginRight: '10px', fontSize: '1.1rem' }}>⛁</span>
                  {col.collection}
                </div>
                <div>
                  <div style={{ width: '100%' }}>
                    {/* Implicit _id Primary Key */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        width: '100%',
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '10px 18px',
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Key size={11} style={{ color: '#fbbf24' }} title="Primary Key" />
                        <span style={{ fontFamily: 'monospace', color: 'var(--color-text-main)', fontWeight: 600 }}>
                          _id
                        </span>
                      </div>
                      <span
                        style={{
                          backgroundColor: 'rgba(251, 191, 36, 0.12)',
                          color: '#fbbf24',
                          border: '1px solid rgba(251, 191, 36, 0.25)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '0.65rem',
                          fontFamily: 'monospace',
                          fontWeight: 600
                        }}
                      >
                        ObjectId
                      </span>
                    </div>

                    {/* Explicit Collection Fields (Recursive) */}
                    {col.fields?.map((f, fIdx) => 
                      renderFieldTree(f, 0, fIdx === col.fields.length - 1, 'list', `list_${col.collection}_${fIdx}`)
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
