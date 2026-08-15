import React, { useEffect, useState } from "react";
import { X, FileText, Edit2, ChevronDown, ChevronRight } from "lucide-react";

// Clean JSON tree viewer for nested data
const JsonViewer = ({ data, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);

  if (data === null) return <span style={{ color: 'var(--color-danger)' }}>null</span>;
  if (data === undefined) return <span style={{ color: 'var(--color-text-muted)' }}>undefined</span>;
  if (typeof data === 'boolean') return <span style={{ color: '#eab308' }}>{String(data)}</span>;
  if (typeof data === 'number') return <span style={{ color: '#3b82f6' }}>{data}</span>;
  if (typeof data === 'string') return <span style={{ color: 'var(--color-primary)', wordBreak: 'break-all' }}>"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span style={{ color: 'var(--color-text-muted)' }}>[]</span>;
    return (
      <div style={{ marginLeft: level > 0 ? '10px' : '0' }}>
        <span 
          onClick={() => setExpanded(!expanded)} 
          style={{ cursor: 'pointer', color: 'var(--color-text-muted)', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />} Array({data.length}) [
        </span>
        {expanded && (
          <div style={{ marginLeft: '10px', borderLeft: '1px solid var(--color-border)', paddingLeft: '6px' }}>
            {data.map((item, i) => (
              <div key={i} style={{ padding: '1px 0', display: 'flex' }}>
                <span style={{ color: 'var(--color-text-muted)', marginRight: '4px', paddingTop: '1px', fontSize: '0.75rem' }}>{i}:</span>
                <div style={{ flex: 1 }}><JsonViewer data={item} level={level + 1} /></div>
                {i < data.length - 1 && <span style={{ color: 'var(--color-text-muted)' }}>,</span>}
              </div>
            ))}
          </div>
        )}
        <span style={{ color: 'var(--color-text-muted)', marginLeft: '12px' }}>]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return <span style={{ color: 'var(--color-text-muted)' }}>{`{}`}</span>;
    return (
      <div style={{ marginLeft: level > 0 ? '10px' : '0' }}>
        <span 
          onClick={() => setExpanded(!expanded)} 
          style={{ cursor: 'pointer', color: 'var(--color-text-muted)', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />} {'{'}
        </span>
        {expanded && (
          <div style={{ marginLeft: '10px', borderLeft: '1px solid var(--color-border)', paddingLeft: '6px' }}>
            {keys.map((key, i) => (
              <div key={key} style={{ padding: '1px 0', display: 'flex' }}>
                <span style={{ color: '#a855f7', marginRight: '4px', paddingTop: '1px', fontSize: '0.75rem' }}>"{key}"</span>
                <span style={{ color: 'var(--color-text-muted)', marginRight: '4px', paddingTop: '1px' }}>:</span>
                <div style={{ flex: 1 }}><JsonViewer data={data[key]} level={level + 1} /></div>
                {i < keys.length - 1 && <span style={{ color: 'var(--color-text-muted)' }}>,</span>}
              </div>
            ))}
          </div>
        )}
        <span style={{ color: 'var(--color-text-muted)', marginLeft: '12px' }}>{'}'}</span>
      </div>
    );
  }

  return <span>{String(data)}</span>;
};

export default function RowDetailDrawer({ isOpen, onClose, record, fields = [], onEdit }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const isWideForm = fields.length > 8;

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--color-overlay)",
          zIndex: 999,
          animation: "fadeIn 0.15s ease-out"
        }}
      />

      {/* Drawer Panel */}
      <div
        className="drawer-panel"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: isWideForm ? "520px" : "400px",
          maxWidth: "100%",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          borderLeft: "1px solid var(--color-border)",
          background: "var(--color-bg-card)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.25)"
        }}
      >
        {/* Header */}
        <div className="drawer-header" style={{
          padding: "0.85rem 1.15rem",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--color-bg-card)",
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-main)" }}>
                <FileText size={16} className="text-primary" />
                Record Details
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "2px 0 0 0", fontFamily: "monospace" }}>
              {record._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: "var(--color-text-muted)", padding: "4px" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body custom-scrollbar" style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 1.15rem"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isWideForm ? "repeat(2, 1fr)" : "1fr",
            gap: "0.85rem",
          }}>
            {Object.entries(record)
              .filter(([key]) => !['_id', '__v', 'createdAt', 'updatedAt', 'isDeleted', 'deletedAt'].includes(key))
              .map(([key, value]) => (
              <div
                key={key}
                className="form-group"
                style={{
                  gridColumn: (isWideForm && typeof value === 'string' && value.length > 20) ? "span 2" : "auto"
                }}
              >
                <label className="form-label" style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.3rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em"
                }}>
                  <span>{key}</span>
                </label>

                {typeof value === 'object' && value !== null ? (
                   <div className="form-input custom-scrollbar" style={{ 
                       padding: "8px 10px", 
                       fontSize: "0.775rem", 
                       fontFamily: "monospace",
                       background: "var(--color-bg-input)",
                       border: "1px solid var(--color-border)",
                       borderRadius: "5px",
                       overflowX: "auto",
                       maxHeight: "220px",
                       overflowY: "auto"
                   }}>
                     <JsonViewer data={value} />
                   </div>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    value={value === null || value === undefined ? '—' : 
                           typeof value === 'boolean' ? String(value) : 
                           String(value)}
                    style={{ cursor: "default", height: "30px", fontSize: "0.8rem", padding: "4px 8px" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* System Metadata Section */}
          <div style={{
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--color-border)"
          }}>
             <h4 style={{
                 fontSize: "0.65rem",
                 fontWeight: 700,
                 color: "var(--color-text-muted)",
                 marginBottom: "0.65rem",
                 letterSpacing: "0.05em",
                 textTransform: "uppercase"
             }}>System Metadata</h4>

             <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                     <span style={{ color: "var(--color-text-muted)" }}>_id</span>
                     <span style={{ fontFamily: "monospace", color: "var(--color-text-main)" }}>{record._id}</span>
                 </div>
                 {record.createdAt && (
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                         <span style={{ color: "var(--color-text-muted)" }}>createdAt</span>
                         <span style={{ color: "var(--color-text-main)" }}>{new Date(record.createdAt).toLocaleString()}</span>
                     </div>
                 )}
                 {record.updatedAt && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>updatedAt</span>
                          <span style={{ color: "var(--color-text-main)" }}>{new Date(record.updatedAt).toLocaleString()}</span>
                      </div>
                  )}
                  {record.isDeleted && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                          <span style={{ color: "var(--color-danger)" }}>isDeleted</span>
                          <span style={{ color: "var(--color-danger)" }}>{String(record.isDeleted)}</span>
                      </div>
                  )}
                  {record.deletedAt && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                          <span style={{ color: "var(--color-danger)" }}>deletedAt</span>
                          <span style={{ color: "var(--color-danger)" }}>{new Date(record.deletedAt).toLocaleString()}</span>
                      </div>
                  )}
             </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="drawer-footer" style={{
          padding: "0.75rem 1.15rem",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.65rem",
          background: "var(--color-bg-card)",
          flexShrink: 0
        }}>
          {onEdit && (
            <button
              onClick={() => {
                onEdit(record);
                onClose();
              }}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "4px", height: "30px", fontSize: "0.75rem" }}
            >
              <Edit2 size={13} />
              Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ height: "30px", fontSize: "0.75rem", padding: "0 14px", fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }

        .text-primary { color: var(--color-primary); }

        .form-input {
            width: 100%;
            background: var(--color-bg-input);
            border: 1px solid var(--color-border);
            padding: 5px 8px;
            border-radius: 5px;
            color: var(--color-text-main);
            font-size: 0.8125rem;
            transition: all 0.15s;
        }
      `}</style>
    </>
  );
}
