import React, { useState } from 'react';
import { ArrowUpDown, Filter, Trash2, Plus, X, Search } from 'lucide-react';

const DatabaseFilter = ({ 
  queryParams, setQueryParams, activeCollection, onClose 
}) => {
  // Use local state for filters to avoid triggering parent fetches on every keystroke
  const [localFilters, setLocalFilters] = useState(queryParams.filters || []);

  const handleApply = () => {
    setQueryParams(p => ({ 
      ...p, 
      filters: localFilters.filter(f => f.field && f.value !== ''),
      page: 1 
    }));
    onClose();
  };

  const handleClearAll = () => {
    setLocalFilters([]);
    setQueryParams(p => ({ ...p, filters: [], page: 1 }));
    onClose();
  };

  return (
    <>
      <div className="fixed-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={onClose} />
      <div className="filter-menu glass-panel" style={{ 
        position: 'absolute', right: '1.5rem', top: '0.5rem', width: '320px', 
        zIndex: 1001, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: '12px'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={14} color="var(--color-primary)" /> Queries & Filters
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={16} />
            </button>
        </div>

        {/* Sort Section */}
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             Sort Result By
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              className="input-field" 
              value={queryParams.sort.replace('-', '')}
              onChange={(e) => {
                const isDesc = queryParams.sort.startsWith('-');
                setQueryParams(p => ({ ...p, sort: `${isDesc ? '-' : ''}${e.target.value}` }));
              }}
              style={{ flex: 1, height: '34px', padding: '0 10px', fontSize: '0.75rem' }}
            >
              <option value="createdAt">Created At</option>
              {activeCollection?.model?.map(f => (
                <option key={f.key} value={f.key}>{f.key}</option>
              ))}
            </select>
            <button 
              className="btn btn-secondary"
              style={{ width: '40px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                const isDesc = queryParams.sort.startsWith('-');
                const field = queryParams.sort.replace('-', '');
                setQueryParams(p => ({ ...p, sort: isDesc ? field : `-${field}` }));
              }}
            >
              <ArrowUpDown size={14} style={{ transform: queryParams.sort.startsWith('-') ? 'none' : 'rotate(180deg)' }} />
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Dynamic Filters
            </div>
            {localFilters.length > 0 && (
                <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}>
                    Clear All
                </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHieght: '200px', overflowY: 'auto' }}>
            {localFilters.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    No active filters.
                </div>
            ) : localFilters.map((filter, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <select 
                  className="input-field"
                  value={filter.field}
                  onChange={e => {
                    const next = [...localFilters];
                    next[idx].field = e.target.value;
                    setLocalFilters(next);
                  }}
                  style={{ width: '35%', height: '30px', padding: '0 6px', fontSize: '0.7rem' }}
                >
                  <option value="" disabled>Field</option>
                  <option value="_id">_id</option>
                  <option value="createdAt">createdAt</option>
                  <option value="updatedAt">updatedAt</option>
                  {activeCollection?.model?.map(f => (
                    <option key={f.key} value={f.key}>{f.key}</option>
                  ))}
                </select>
                
                <select 
                  className="input-field"
                  value={filter.operator}
                  onChange={e => {
                    const next = [...localFilters];
                    next[idx].operator = e.target.value;
                    setLocalFilters(next);
                  }}
                  style={{ width: '22%', height: '30px', padding: '0 4px', fontSize: '0.7rem' }}
                >
                  <option value="=">=</option>
                  <option value="_gt">&gt;</option>
                  <option value="_lt">&lt;</option>
                </select>
                
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Value..."
                  value={filter.value}
                  onChange={e => {
                    const next = [...localFilters];
                    next[idx].value = e.target.value;
                    setLocalFilters(next);
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleApply()}
                  style={{ width: '33%', height: '30px', padding: '0 8px', fontSize: '0.7rem' }}
                />
                
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                  onClick={() => {
                    setLocalFilters(localFilters.filter((_, i) => i !== idx));
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <button 
            className="btn btn-ghost"
            style={{ width: '100%', fontSize: '0.7rem', marginTop: '10px', height: '32px', gap: '6px', background: 'rgba(255,255,255,0.03)' }}
            onClick={() => {
              setLocalFilters([...localFilters, { field: '', operator: '=', value: '' }]);
            }}
          >
            <Plus size={12} /> Add Condition
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, height: '36px', fontSize: '0.8rem', gap: '8px' }}
              onClick={handleApply}
            >
              <Search size={14} /> Apply Queries
            </button>
        </div>
      </div>
    </>
  );
};

export default DatabaseFilter;
