import React, { useState } from 'react';
import { ArrowUpDown, Filter, Plus, X, Search } from 'lucide-react';

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
      <div className="filter-menu" style={{ 
        position: 'absolute', right: '1rem', top: '0.4rem', width: '300px', 
        zIndex: 1001, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem',
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', 
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)', borderRadius: '8px'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-main)' }}>
                <Filter size={13} color="var(--color-primary)" /> Queries & Filters
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px' }}>
                <X size={14} />
            </button>
        </div>

        {/* Sort Section */}
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             Sort Result By
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select 
              className="input-field" 
              value={queryParams.sort.replace('-', '')}
              onChange={(e) => {
                const isDesc = queryParams.sort.startsWith('-');
                setQueryParams(p => ({ ...p, sort: `${isDesc ? '-' : ''}${e.target.value}` }));
              }}
              style={{ flex: 1, height: '30px', padding: '0 8px', fontSize: '0.75rem' }}
            >
              <option value="createdAt">Created At</option>
              {activeCollection?.model?.map(f => (
                <option key={f.key} value={f.key}>{f.key}</option>
              ))}
            </select>
            <button 
              className="btn btn-secondary"
              style={{ width: '32px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                const isDesc = queryParams.sort.startsWith('-');
                const field = queryParams.sort.replace('-', '');
                setQueryParams(p => ({ ...p, sort: isDesc ? field : `-${field}` }));
              }}
            >
              <ArrowUpDown size={13} style={{ transform: queryParams.sort.startsWith('-') ? 'none' : 'rotate(180deg)' }} />
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Dynamic Filters
            </div>
            {localFilters.length > 0 && (
                <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}>
                    Clear All
                </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
            {localFilters.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '6px', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    No active filters.
                </div>
            ) : localFilters.map((filter, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'var(--color-bg-input)', padding: '4px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <select 
                  className="input-field"
                  value={filter.field}
                  onChange={e => {
                    const next = [...localFilters];
                    next[idx].field = e.target.value;
                    setLocalFilters(next);
                  }}
                  style={{ width: '35%', height: '26px', padding: '0 4px', fontSize: '0.7rem' }}
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
                  style={{ width: '22%', height: '26px', padding: '0 2px', fontSize: '0.7rem' }}
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
                  style={{ width: '35%', height: '26px', padding: '0 6px', fontSize: '0.7rem' }}
                />
                
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px' }}
                  onClick={() => {
                    setLocalFilters(localFilters.filter((_, i) => i !== idx));
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          
          <button 
            className="btn btn-ghost"
            style={{ width: '100%', fontSize: '0.7rem', marginTop: '6px', height: '28px', gap: '4px', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)' }}
            onClick={() => {
              setLocalFilters([...localFilters, { field: '', operator: '=', value: '' }]);
            }}
          >
            <Plus size={11} /> Add Condition
          </button>
        </div>
        
        <div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', height: '30px', fontSize: '0.75rem', gap: '6px', fontWeight: 600 }}
              onClick={handleApply}
            >
              <Search size={13} /> Apply Queries
            </button>
        </div>
      </div>
    </>
  );
};

export default DatabaseFilter;
