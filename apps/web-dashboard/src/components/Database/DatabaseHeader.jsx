import React from 'react';
import { 
  Menu, List as ListIcon, Table as TableIcon, Code, 
  Filter, RefreshCw, Shield, Plus, Download
} from 'lucide-react';
import AiQueryBar from './AiQueryBar';

const DatabaseHeader = ({ 
  project, activeCollection, dataLength, viewMode, setViewMode, 
  showFilterMenu, setShowFilterMenu, filtersCount, 
  onRefresh, onRlsClick, onAddRecord, onOpenSidebar,
  showDeleted, setShowDeleted, onFiltersGenerated, onExport, isExporting
}) => {
  return (
    <header className="db-header glass-panel" style={{ 
      padding: '0.75rem 1.5rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderBottom: '1px solid var(--color-border)',
      height: 'var(--header-height)'
    }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn-icon hide-desktop menu-trigger"
          onClick={onOpenSidebar}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer' }}
        >
          <Menu size={18} />
        </button>
        <div>
          <div className="breadcrumbs" style={{ display: 'flex', gap: '6px', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>{project?.name}</span>
            <span>/</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{activeCollection?.name}</span>
          </div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{activeCollection?.name}</h1>
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {activeCollection?.name !== 'users' && (
          <div style={{ marginRight: '10px' }}>
            <AiQueryBar 
              projectId={project?._id} 
              activeCollection={activeCollection} 
              onFiltersGenerated={onFiltersGenerated} 
            />
          </div>
        )}
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: '10px' }}>{dataLength} Records</span>

        {/* Soft Delete Toggle */}
        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginRight: '10px' }}>
            <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
            Show Deleted
        </label>

        {/* View Toggles */}
        <div className="view-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px', gap: '2px' }}>
          {[
            { id: 'list', icon: ListIcon, title: 'List' },
            { id: 'table', icon: TableIcon, title: 'Table' },
            { id: 'json', icon: Code, title: 'JSON' }
          ].map(mode => (
            <button
              key={mode.id}
              className={`toggle-btn ${viewMode === mode.id ? 'active' : ''}`}
              onClick={() => setViewMode(mode.id)}
              style={{ 
                padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                background: viewMode === mode.id ? 'var(--color-bg-card)' : 'transparent',
                color: viewMode === mode.id ? '#fff' : 'var(--color-text-muted)',
                display: 'flex'
              }}
            >
              <mode.icon size={14} />
            </button>
          ))}
        </div>

        {/* Filter Button */}
        <button
          className={`btn ${showFilterMenu ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          style={{ padding: '6px 10px', height: '32px', position: 'relative' }}
        >
          <Filter size={14} />
          {filtersCount > 0 && (
            <span style={{ 
              position: 'absolute', top: '-5px', right: '-5px', background: 'var(--color-primary)', 
              color: '#000', fontSize: '0.6rem', fontWeight: 800, width: '14px', height: '14px', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>{filtersCount}</span>
          )}
        </button>

        <button onClick={onRefresh} className="btn btn-secondary" style={{ padding: '6px 10px', height: '32px' }}>
          <RefreshCw size={14} />
        </button>

        {activeCollection?.name !== 'users' && (
          <button onClick={onRlsClick} className="btn btn-secondary" style={{ padding: '6px 12px', height: '32px', gap: '6px', fontSize: '0.75rem' }}>
            <Shield size={14} /> RLS
          </button>
        )}

        
        {activeCollection?.name !== 'users' && (
          <button onClick={onExport} disabled={isExporting} className="btn btn-secondary" style={{ padding: '6px 12px', height: '32px', gap: '6px', fontSize: '0.75rem' }}>
            <Download size={14} /> Export
          </button>
      
        )}

        

        {activeCollection?.name !== 'users' && (
          <button onClick={onAddRecord} className="btn btn-primary" style={{ padding: '6px 12px', height: '32px', gap: '6px', fontSize: '0.75rem' }}>
            <Plus size={14} /> Add Record
          </button>
        )}
      </div>
    </header>
  );
};

export default DatabaseHeader;
