import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ total, page, limit, onPageChange, onLimitChange }) => {
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <div className="pagination-bar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.35rem 0.85rem',
      background: 'var(--color-bg-card)',
      borderTop: '1px solid var(--color-border)',
      fontSize: '0.75rem',
      color: 'var(--color-text-muted)',
      zIndex: 10,
      minHeight: '36px',
      flexShrink: 0
    }}>
      <div className="pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span>
          Showing <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{start}-{end}</span> of <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{total}</span>
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Rows:</span>
          <select 
            value={limit} 
            onChange={(e) => onLimitChange(Number(e.target.value))}
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text-main)',
              fontSize: '0.7rem',
              padding: '1px 4px',
              outline: 'none',
              cursor: 'pointer',
              height: '22px'
            }}
          >
            {[10, 20, 50, 100].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button 
          className="btn-icon" 
          disabled={page === 1} 
          onClick={() => onPageChange(1)}
          title="First Page"
          style={{ width: '24px', height: '24px', padding: 0 }}
        >
          <ChevronsLeft size={13} />
        </button>
        <button 
          className="btn-icon" 
          disabled={page === 1} 
          onClick={() => onPageChange(page - 1)}
          title="Previous Page"
          style={{ width: '24px', height: '24px', padding: 0 }}
        >
          <ChevronLeft size={13} />
        </button>
        
        <span style={{ padding: '0 6px', minWidth: '60px', textAlign: 'center', fontSize: '0.725rem' }}>
          <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{page}</span> / <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{totalPages || 1}</span>
        </span>

        <button 
          className="btn-icon" 
          disabled={page >= totalPages} 
          onClick={() => onPageChange(page + 1)}
          title="Next Page"
          style={{ width: '24px', height: '24px', padding: 0 }}
        >
          <ChevronRight size={13} />
        </button>
        <button 
          className="btn-icon" 
          disabled={page >= totalPages} 
          onClick={() => onPageChange(totalPages)}
          title="Last Page"
          style={{ width: '24px', height: '24px', padding: 0 }}
        >
          <ChevronsRight size={13} />
        </button>
      </div>

      <style>{`
        .pagination-bar .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        .pagination-bar .btn-icon:hover:not(:disabled) {
          background: var(--color-surface-hover);
          color: var(--color-text-main);
          border-color: var(--color-border);
        }
        .pagination-bar .btn-icon:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Pagination;
