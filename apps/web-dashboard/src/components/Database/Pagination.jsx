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
      padding: '0.75rem 1.5rem',
      background: 'rgba(10, 10, 10, 0.4)',
      borderTop: '1px solid var(--color-border)',
      fontSize: '0.8rem',
      color: 'var(--color-text-muted)',
      zIndex: 10
    }}>
      <div className="pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>
          Showing <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{start}-{end}</span> of <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{total}</span> records
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '1rem' }}>
          <span>Rows per page:</span>
          <select 
            value={limit} 
            onChange={(e) => onLimitChange(Number(e.target.value))}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text-main)',
              fontSize: '0.75rem',
              padding: '2px 4px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {[10, 20, 50, 100].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button 
          className="btn-icon" 
          disabled={page === 1} 
          onClick={() => onPageChange(1)}
          title="First Page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button 
          className="btn-icon" 
          disabled={page === 1} 
          onClick={() => onPageChange(page - 1)}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>
        
        <span style={{ padding: '0 10px', minWidth: '80px', textAlign: 'center' }}>
          Page <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{page}</span> of <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{totalPages || 1}</span>
        </span>

        <button 
          className="btn-icon" 
          disabled={page >= totalPages} 
          onClick={() => onPageChange(page + 1)}
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
        <button 
          className="btn-icon" 
          disabled={page >= totalPages} 
          onClick={() => onPageChange(totalPages)}
          title="Last Page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      <style>{`
        .pagination-bar .btn-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: var(--color-text-main);
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-bar .btn-icon:hover:not(:disabled) {
          background: rgba(255,255,255,0.05);
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
