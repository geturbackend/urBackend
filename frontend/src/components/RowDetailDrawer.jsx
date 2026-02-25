import React, { useEffect } from "react";
import { X, FileText, Edit2 } from "lucide-react";

export default function RowDetailDrawer({ isOpen, onClose, record, fields = [], onEdit }) {
  // Handle outside click to close
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

  // Determine grid columns based on field count
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
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 999,
          animation: "fadeIn 0.2s ease-out"
        }}
      />

      {/* Drawer Panel */}
      <div
        className="drawer-panel glass-panel"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: isWideForm ? "600px" : "450px",
          maxWidth: "100%",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          borderLeft: "1px solid var(--color-border)",
          background: "var(--color-bg-card)",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.3)"
        }}
      >
        {/* Header */}
        <div className="drawer-header" style={{
          padding: "1.5rem",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={20} className="text-primary" />
                Record Details
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "4px 0 0 0", fontFamily: "monospace" }}>
              ID: {record._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body custom-scrollbar" style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isWideForm ? "repeat(2, 1fr)" : "1fr",
            gap: "1.25rem",
          }}>
            {fields.map((field) => (
              <div
                key={field.key}
                className="form-group"
                style={{
                  gridColumn: (isWideForm && (field.type === "String" && field.key.length > 20)) ? "span 2" : "auto"
                }}
              >
                <label className="form-label" style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)"
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {field.key}
                  </span>
                  <span className="field-type-hint" style={{
                    fontSize: "0.7rem",
                    color: "var(--color-text-muted)",
                    background: "rgba(255,255,255,0.05)",
                    padding: "2px 6px",
                    borderRadius: "4px"
                  }}>{field.type}</span>
                </label>

                {/* Read Only Input Field matching AddRecordDrawer */}
                {field.type === "Boolean" ? (
                  <select
                    className="form-select"
                    disabled
                    value={String(record[field.key] ?? "")}
                    style={{ cursor: "default", appearance: "none" /* removes dropdown arrow */}}
                  >
                    <option value="">Empty</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : field.type === "Date" ? (
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    value={record[field.key] ? new Date(record[field.key]).toLocaleString() : "Empty"}
                    style={{ cursor: "default" }}
                  />
                ) : field.type === "Object" || field.type === "Array" || typeof record[field.key] === "object" ? (
                   <textarea
                     className="form-input custom-scrollbar"
                     readOnly
                     rows={4}
                     value={JSON.stringify(record[field.key] ?? {}, null, 2)}
                     style={{ cursor: "default", resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem", color: "#3ECF8E" }}
                   />
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    value={record[field.key] !== null && record[field.key] !== undefined ? String(record[field.key]) : "Empty"}
                    style={{ cursor: "default" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* System Metadata Section */}
          <div style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--color-border)"
          }}>
             <h4 style={{
                 fontSize: "0.75rem",
                 fontWeight: 700,
                 color: "#666",
                 marginBottom: "1rem",
                 letterSpacing: "0.05em",
                 textTransform: "uppercase"
             }}>System Metadata</h4>

             <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                     <span style={{ color: "var(--color-text-muted)" }}>_id</span>
                     <span style={{ fontFamily: "monospace", color: "var(--color-text-main)" }}>{record._id}</span>
                 </div>
                 {record.createdAt && (
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                         <span style={{ color: "var(--color-text-muted)" }}>createdAt</span>
                         <span style={{ color: "var(--color-text-main)" }}>{new Date(record.createdAt).toLocaleString()}</span>
                     </div>
                 )}
                 {record.updatedAt && (
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                         <span style={{ color: "var(--color-text-muted)" }}>updatedAt</span>
                         <span style={{ color: "var(--color-text-main)" }}>{new Date(record.updatedAt).toLocaleString()}</span>
                     </div>
                 )}
             </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="drawer-footer" style={{
          padding: "1.25rem 1.5rem",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem",
          background: "rgba(0,0,0,0.2)"
        }}>
          {onEdit && (
            <button
              onClick={() => {
                onEdit(record);
                onClose();
              }}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Edit2 size={16} />
              Edit Document
            </button>
          )}
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ minWidth: "100px" }}
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
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--color-border);
            padding: 10px 12px;
            border-radius: 6px;
            color: var(--color-text-main);
            font-size: 0.95rem;
            transition: all 0.2s;
        }

        .form-select {
            width: 100%;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--color-border);
            padding: 10px 12px;
            border-radius: 6px;
            color: var(--color-text-main);
            appearance: none;
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23aaaaaa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: right 12px top 50%;
            background-size: 10px auto;
        }
      `}</style>
    </>
  );
}
