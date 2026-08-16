import React from 'react';
import { 
  Menu, List as ListIcon, Table as TableIcon, Code, 
  Filter, RefreshCw, Shield, Plus, Download, Workflow
} from 'lucide-react';
import AiQueryBar from './AiQueryBar';

const DatabaseHeader = ({ 
  project, activeCollection, dataLength, viewMode, setViewMode, 
  showFilterMenu, setShowFilterMenu, filtersCount, 
  onRefresh, onRlsClick, onEditSchemaClick, onAddRecord, onOpenSidebar,
  showDeleted, setShowDeleted, onFiltersGenerated, onExport, isExporting, isViewer
}) => {
  return (
    <header className="db-header" style={{ 
      padding: '0.4rem 0.85rem', 
      display: 'flex', 
      flexWrap: 'nowrap',
      gap: '0.75rem',
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-bg-card)',
      minHeight: '44px',
      height: '44px',
      flexShrink: 0
    }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
        <button
          className="btn-icon hide-desktop menu-trigger"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          style={{ padding: '4px', color: 'var(--color-text-main)', cursor: 'pointer' }}
        >
          <Menu size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'none' }} className="sm-show">
            {project?.name} /
          </span>
          <h1 style={{ fontSize: '0.925rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-main)' }}>
            {activeCollection?.name}
          </h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-input)', padding: '1px 6px', borderRadius: '10px', border: '1px solid var(--color-border)', marginLeft: '4px', whiteSpace: 'nowrap' }}>
            {dataLength} rows
          </span>
        </div>
      </div>
 
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {activeCollection?.name !== 'users' && (
          <AiQueryBar 
            projectId={project?._id} 
            activeCollection={activeCollection} 
            onFiltersGenerated={onFiltersGenerated} 
          />
        )}

        {/* Soft Delete Toggle */}
        <label style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none', marginLeft: '2px', marginRight: '4px' }}>
            <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} style={{ cursor: 'pointer' }} />
            Trash
        </label>

        {/* View Toggles */}
        <div className="view-toggle" style={{ display: 'flex', background: 'var(--color-bg-input)', padding: '2px', borderRadius: '6px', border: '1px solid var(--color-border)', gap: '1px' }}>
          {[
            { id: 'table', icon: TableIcon, title: 'Table' },
            { id: 'list', icon: ListIcon, title: 'List' },
            { id: 'json', icon: Code, title: 'JSON' },
            { id: 'canvas', icon: Workflow, title: 'Schema Graph' }
          ].map(mode => (
            <button
              key={mode.id}
              className={`toggle-btn ${viewMode === mode.id ? 'active' : ''}`}
              onClick={() => setViewMode(mode.id)}
              title={mode.title}
              style={{ 
                padding: '3px 6px', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                background: viewMode === mode.id ? 'var(--color-bg-card)' : 'transparent',
                color: viewMode === mode.id ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                boxShadow: viewMode === mode.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <mode.icon size={13} />
            </button>
          ))}
        </div>

        {/* Filter Button */}
        <button
          className={`btn ${showFilterMenu ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          style={{ padding: '4px 8px', height: '28px', position: 'relative', fontSize: '0.75rem' }}
          title="Filter & Sort"
        >
          <Filter size={13} />
          {filtersCount > 0 && (
            <span style={{ 
              position: 'absolute', top: '-4px', right: '-4px', background: 'var(--color-primary)', 
              color: '#000', fontSize: '0.55rem', fontWeight: 800, width: '13px', height: '13px', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>{filtersCount}</span>
          )}
        </button>

        <button onClick={onRefresh} className="btn btn-secondary" style={{ padding: '4px 8px', height: '28px' }} title="Refresh">
          <RefreshCw size={13} />
        </button>

        {activeCollection?.name !== 'users' && !isViewer && (
          <>
            <button onClick={onEditSchemaClick} className="btn btn-secondary" style={{ padding: '4px 8px', height: '28px', fontSize: '0.75rem' }}>
              Schema
            </button>
            <button onClick={onRlsClick} className="btn btn-secondary" style={{ padding: '4px 8px', height: '28px', gap: '4px', fontSize: '0.75rem' }}>
              <Shield size={13} /> RLS
            </button>
          </>
        )}

        {activeCollection?.name !== 'users' && (
          <button onClick={onExport} disabled={isExporting} className="btn btn-secondary" style={{ padding: '4px 8px', height: '28px', gap: '4px', fontSize: '0.75rem' }} title="Export Data">
            <Download size={13} />
          </button>
        )}

        {activeCollection?.name !== 'users' && !isViewer && (
          <button onClick={onAddRecord} className="btn btn-primary" style={{ padding: '4px 10px', height: '28px', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            <Plus size={13} /> Insert
          </button>
        )}
      </div>
    </header>
  );
};

export default DatabaseHeader;
