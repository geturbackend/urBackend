import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Plus, Trash2 } from "lucide-react";

/**
 * AddRecordDrawer
 * A slide-over drawer component for adding/editing records.
 * Supports nested Object, Array, and Ref field types with compact UI and theme safety.
 */
export default function AddRecordDrawer({
  isOpen,
  onClose,
  onSubmit,
  fields = [],
  isSubmitting = false,
  initialData = null,
}) {
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const formattedData = { ...formData };

    fields.forEach(field => {
      const val = formattedData[field.key];

      if (field.required && (val === undefined || val === "" || val === null)) {
        newErrors[field.key] = "This field is required";
      }

      if (field.type === "Number" && val !== undefined && val !== "") {
        const num = Number(val);
        if (isNaN(num)) {
          newErrors[field.key] = "Must be a valid number";
        } else {
          formattedData[field.key] = num;
        }
      }

      if (field.type === "Boolean") {
        formattedData[field.key] = val === "true" || val === true;
      }

      if (field.type === "Date" && val) {
        formattedData[field.key] = new Date(val).toISOString();
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formattedData);
  };

  const isWideForm = fields.length > 8;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "var(--color-overlay)",
          zIndex: 999, animation: "fadeIn 0.15s ease-out"
        }}
      />

      {/* Drawer Panel */}
      <div
        className="drawer-panel"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: isWideForm ? "520px" : "420px", maxWidth: "100%",
          zIndex: 1000, display: "flex", flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          borderLeft: "1px solid var(--color-border)",
          background: "var(--color-bg-card)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.25)"
        }}
      >
        {/* Header */}
        <div style={{
          padding: "0.85rem 1.15rem", borderBottom: "1px solid var(--color-border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "var(--color-bg-card)", flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--color-text-main)" }}>
              {initialData ? "Edit Record" : "Add New Record"}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "2px 0 0 0" }}>
              {initialData ? "Update the details for this document." : "Fill in the details for the new document."}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: "var(--color-text-muted)", padding: "4px" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "1rem 1.15rem" }}>
          <form id="add-record-form" onSubmit={handleSubmit}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isWideForm ? "repeat(2, 1fr)" : "1fr",
              gap: "0.85rem",
            }}>
              {fields.map((field) => (
                <div
                  key={field.key}
                  className="form-group"
                  style={{
                    gridColumn: (field.type === "Object" || field.type === "Array") ? "1 / -1" : "auto"
                  }}
                >
                  <label className="form-label" style={{
                    display: "flex", justifyContent: "space-between",
                    marginBottom: "0.3rem", fontSize: "0.75rem", fontWeight: 600,
                    color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.03em"
                  }}>
                    <span>
                      {field.key}
                      {field.required && <span style={{ color: "var(--color-danger)", marginLeft: "2px" }}>*</span>}
                    </span>
                    <span style={{
                      fontSize: "0.65rem", color: "var(--color-text-muted)",
                      background: "var(--color-bg-input)", padding: "1px 5px", borderRadius: "3px", border: "1px solid var(--color-border)"
                    }}>{field.type}{field.type === 'Ref' && field.ref ? ` → ${field.ref}` : ''}</span>
                  </label>

                  {renderInput(field, formData[field.key], handleChange, errors[field.key])}

                  {errors[field.key] && (
                    <div style={{
                      color: "var(--color-danger)", fontSize: "0.75rem", marginTop: "4px",
                      display: "flex", alignItems: "center", gap: "4px"
                    }}>
                      <AlertCircle size={11} />
                      {errors[field.key]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: "0.75rem 1.15rem", borderTop: "1px solid var(--color-border)",
          display: "flex", justifyContent: "flex-end", gap: "0.65rem",
          background: "var(--color-bg-card)", flexShrink: 0
        }}>
          <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isSubmitting} style={{ height: "30px", fontSize: "0.75rem" }}>
            Cancel
          </button>
          <button type="submit" form="add-record-form" className="btn btn-primary"
            disabled={isSubmitting} style={{ minWidth: "100px", height: "30px", fontSize: "0.75rem", fontWeight: 600 }}>
            {isSubmitting ? (
              <span className="spinner-small" style={{ width: "12px", height: "12px" }}></span>
            ) : (
              <>
                <Check size={14} />
                <span>{initialData ? "Update" : "Save Record"}</span>
              </>
            )}
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
        .form-input {
            width: 100%;
            background: var(--color-bg-input);
            border: 1px solid var(--color-border);
            padding: 5px 8px;
            border-radius: 5px;
            color: var(--color-text-main);
            font-size: 0.8125rem;
            height: 30px;
            transition: border-color 0.15s;
            outline: none;
        }
        .form-input:focus {
            border-color: var(--color-primary);
        }
        .form-select {
            width: 100%;
            background: var(--color-bg-input);
            border: 1px solid var(--color-border);
            padding: 4px 8px;
            border-radius: 5px;
            color: var(--color-text-main);
            font-size: 0.8125rem;
            height: 30px;
            outline: none;
        }
        .form-select:focus {
            border-color: var(--color-primary);
        }
        .nested-fieldset {
            border: 1px solid var(--color-border);
            border-radius: 6px;
            padding: 8px;
            background: var(--color-bg-input);
            margin-top: 3px;
        }
        .array-item-row {
            display: flex;
            gap: 6px;
            align-items: flex-start;
            margin-bottom: 6px;
        }
      `}</style>
    </>
  );
}

// Render input based on field type (recursive for Object/Array)
function renderInput(field, value, onChange, error) {
  const val = value === undefined || value === null ? "" : value;

  // Boolean
  if (field.type === "Boolean") {
    return (
      <select
        className="form-select"
        value={val === "" ? "" : String(val)}
        onChange={(e) => onChange(field.key, e.target.value, "Boolean")}
        style={error ? { borderColor: "var(--color-danger)" } : {}}
      >
        <option value="">Select...</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  // Date
  if (field.type === "Date") {
    return (
      <input
        type="datetime-local"
        className="form-input"
        value={val}
        onChange={(e) => onChange(field.key, e.target.value, "Date")}
        style={error ? { borderColor: "var(--color-danger)" } : {}}
      >
      </input>
    );
  }

  // Ref — ObjectId text input
  if (field.type === "Ref") {
    return (
      <input
        type="text"
        className="form-input"
        placeholder={`Enter _id from ${field.ref || 'collection'}`}
        value={val}
        onChange={(e) => onChange(field.key, e.target.value)}
        style={error ? { borderColor: "var(--color-danger)" } : {}}
      />
    );
  }

  // Object — grouped sub-inputs
  if (field.type === "Object" && field.fields) {
    const objVal = typeof val === 'object' && !Array.isArray(val) ? val : {};
    return (
      <div className="nested-fieldset">
        {field.fields.map(subField => (
          <div key={subField.key} style={{ marginBottom: '6px' }}>
            <label style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.725rem', color: 'var(--color-text-muted)', marginBottom: '2px'
            }}>
              <span>{subField.key}{subField.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}</span>
              <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{subField.type}</span>
            </label>
            {renderInput(
              subField,
              objVal[subField.key],
              (subKey, subVal) => {
                const newObj = { ...objVal, [subKey]: subVal };
                onChange(field.key, newObj);
              },
              null
            )}
          </div>
        ))}
      </div>
    );
  }

  // Array — list of items
  if (field.type === "Array") {
    const arrVal = Array.isArray(val) ? val : [];
    const itemType = field.items?.type || 'String';

    const addItem = () => {
      const defaultVal = itemType === 'Object' ? {} : itemType === 'Boolean' ? false : itemType === 'Number' ? 0 : '';
      onChange(field.key, [...arrVal, defaultVal]);
    };

    const removeItem = (idx) => {
      onChange(field.key, arrVal.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, newVal) => {
      const updated = [...arrVal];
      updated[idx] = newVal;
      onChange(field.key, updated);
    };

    return (
      <div className="nested-fieldset">
        {arrVal.map((item, idx) => (
          <div key={idx} className="array-item-row">
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', minWidth: '16px', paddingTop: '6px' }}>
              {idx}
            </span>
            <div style={{ flex: 1 }}>
              {itemType === 'Object' && field.items?.fields ? (
                <div className="nested-fieldset" style={{ padding: '6px' }}>
                  {field.items.fields.map(subField => (
                    <div key={subField.key} style={{ marginBottom: '4px' }}>
                      <label style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '2px'
                      }}>
                        <span>{subField.key}</span>
                        <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>{subField.type}</span>
                      </label>
                      {renderInput(
                        subField,
                        typeof item === 'object' ? item[subField.key] : undefined,
                        (subKey, subVal) => {
                          const newItem = { ...(typeof item === 'object' ? item : {}), [subKey]: subVal };
                          updateItem(idx, newItem);
                        },
                        null
                      )}
                    </div>
                  ))}
                </div>
              ) : itemType === 'Boolean' ? (
                <select
                  className="form-select"
                  value={String(item)}
                  onChange={(e) => updateItem(idx, e.target.value === 'true')}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : itemType === 'Date' ? (
                <input
                  type="datetime-local"
                  className="form-input"
                  value={item || ''}
                  onChange={(e) => updateItem(idx, e.target.value)}
                />
              ) : itemType === 'Ref' ? (
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Enter _id from ${field.items?.ref || 'collection'}`}
                  value={item || ''}
                  onChange={(e) => updateItem(idx, e.target.value)}
                />
              ) : (
                <input
                  type={itemType === 'Number' ? 'number' : 'text'}
                  className="form-input"
                  placeholder={`Item ${idx}`}
                  value={item ?? ''}
                  onChange={(e) => {
                    const v = itemType === 'Number' ? Number(e.target.value) : e.target.value;
                    updateItem(idx, v);
                  }}
                  step={itemType === 'Number' ? 'any' : undefined}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="btn-icon"
              style={{ color: 'var(--color-text-muted)', paddingTop: '4px', flexShrink: 0 }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="btn btn-secondary"
          style={{ fontSize: '0.725rem', width: '100%', marginTop: '3px', height: '26px', padding: '0 8px', gap: '4px' }}
        >
          <Plus size={12} /> Add Item
        </button>
      </div>
    );
  }

  // Primitives (String, Number)
  return (
    <input
      type={field.type === "Number" ? "number" : "text"}
      className="form-input"
      placeholder={`Enter ${field.key}`}
      value={val}
      onChange={(e) => onChange(field.key, e.target.value, field.type)}
      step={field.type === "Number" ? "any" : undefined}
      style={error ? { borderColor: "var(--color-danger)" } : {}}
    />
  );
}
