import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';

const MAX_DEPTH = 3;

// FUNCTION - NEXT FIELD ID
let _fieldIdCounter = 0;
const nextFieldId = () => `field_${Date.now()}_${_fieldIdCounter++}`;

const PRIMITIVE_TYPES = ['String', 'Number', 'Boolean', 'Date'];
const ALL_TYPES = [...PRIMITIVE_TYPES, 'Object', 'Array', 'Ref'];
const ARRAY_ITEM_TYPES = [...PRIMITIVE_TYPES, 'Object', 'Ref'];

function createEmptyField() {
    return { _id: nextFieldId(), key: '', type: 'String', required: false, unique: false, default: undefined };
}

// FUNCTION - FIELD ROW COMPONENT
function FieldRow({ field, index, depth, collections, collectionsLoading, collectionsError, onChange, onRemove }) {
    const [expanded, setExpanded] = useState(true);

    const handleChange = (prop, value) => {
        if (field.locked) return;
        const updated = { ...field, [prop]: value };

        // Reset sub-properties when type changes
        if (prop === 'type') {
            delete updated.fields;
            delete updated.items;
            delete updated.ref;
            delete updated.default;
            if (value === 'Object') {
                updated.fields = [createEmptyField()];
                updated.unique = false;
            } else if (value === 'Array') {
                updated.items = { type: 'String' };
                updated.unique = false;
            } else if (value === 'Ref') {
                updated.ref = '';
                updated.unique = false;
            }
        }

        if (prop === 'required' && value) {
            delete updated.default;
        }
        
        onChange(index, updated);
    };

    const handleSubFieldChange = (subIndex, updatedSubField) => {
        const newFields = [...(field.fields || [])];
        newFields[subIndex] = updatedSubField;
        onChange(index, { ...field, fields: newFields });
    };

    const handleDefaultChange = (rawValue) => {
      if (field.locked) return;
    
      let nextDefault;
      if (field.type === 'String') {
        nextDefault = rawValue === '' ? undefined : rawValue;
      } else if (field.type === 'Number') {
        if (rawValue === '') nextDefault = undefined;
        else {
          const parsed = Number(rawValue);
          nextDefault = Number.isNaN(parsed) ? undefined : parsed;
        }
      } else if (field.type === 'Boolean') {
        if (rawValue === '') nextDefault = undefined;
        else nextDefault = rawValue === 'true';
      } else {
        nextDefault = undefined;
      }
    
      const updated = { ...field };
      if (nextDefault === undefined) delete updated.default;
      else updated.default = nextDefault;
    
      onChange(index, updated);
    };

    const addSubField = () => {
        const newFields = [...(field.fields || []), createEmptyField()];
        onChange(index, { ...field, fields: newFields });
    };

    const removeSubField = (subIndex) => {
        const newFields = (field.fields || []).filter((_, i) => i !== subIndex);
        onChange(index, { ...field, fields: newFields });
    };

    const handleItemsChange = (prop, value) => {
        const updatedItems = { ...field.items, [prop]: value };
        if (prop === 'type') {
            delete updatedItems.fields;
            if (value === 'Object') {
                updatedItems.fields = [createEmptyField()];
            }
        }
        onChange(index, { ...field, items: updatedItems });
    };

    const handleItemSubFieldChange = (subIndex, updatedSubField) => {
        const newFields = [...(field.items?.fields || [])];
        newFields[subIndex] = updatedSubField;
        onChange(index, { ...field, items: { ...field.items, fields: newFields } });
    };

    const addItemSubField = () => {
        const newFields = [...(field.items?.fields || []), createEmptyField()];
        onChange(index, { ...field, items: { ...field.items, fields: newFields } });
    };

    const removeItemSubField = (subIndex) => {
        const newFields = (field.items?.fields || []).filter((_, i) => i !== subIndex);
        onChange(index, { ...field, items: { ...field.items, fields: newFields } });
    };

    const availableTypes = depth >= MAX_DEPTH
        ? PRIMITIVE_TYPES.concat(['Ref'])  // No Object/Array at max depth
        : ALL_TYPES;

    const availableItemTypes = depth >= MAX_DEPTH
        ? PRIMITIVE_TYPES.concat(['Ref'])
        : ARRAY_ITEM_TYPES;

    const isComplex = field.type === 'Object' || field.type === 'Array' || field.type === 'Ref';
    const indent = depth * 20;

    return (
        <div style={{ marginLeft: `${indent}px` }}>
            <div className="schema-field-row" style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', marginBottom: '4px',
                background: depth > 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderRadius: '6px',
                borderLeft: depth > 1 ? '2px solid rgba(62, 207, 142, 0.2)' : 'none'
            }}>
                {/* Expand toggle for complex types */}
                {isComplex && field.type !== 'Ref' ? (
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="btn-icon"
                        style={{ padding: '2px', color: 'var(--color-text-muted)', flexShrink: 0 }}
                    >
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : (
                    <div style={{ width: '18px', flexShrink: 0 }} />
                )}

                {/* Key name */}
                <input
                    type="text"
                    placeholder="field_name"
                    value={field.key}
                    disabled={field.locked}
                    onChange={(e) => handleChange('key', e.target.value)}
                    className="input-field"
                    style={{
                        flex: 2, border: 'none', background: 'transparent',
                        padding: '4px 0', fontSize: '0.9rem',
                        opacity: field.locked ? 0.6 : 1,
                        cursor: field.locked ? 'not-allowed' : 'text'
                    }}
                />

                {/* Type selector */}
                <select
                    value={field.type}
                    disabled={field.locked}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="input-field"
                    style={{
                        flex: 1, border: 'none', background: 'transparent',
                        padding: '4px 0', cursor: field.locked ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
                        opacity: field.locked ? 0.6 : 1
                    }}
                >
                    {availableTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>

                {/* Required Checkbox */}
                <div style={{ width: '24px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    <input
                        type="checkbox"
                        aria-label="required"
                        checked={field.required}
                        disabled={field.locked}
                        onChange={(e) => handleChange('required', e.target.checked)}
                        style={{
                            accentColor: 'var(--color-primary)',
                            transform: 'scale(1.1)', cursor: field.locked ? 'not-allowed' : 'pointer',
                            opacity: field.locked ? 0.6 : 1
                        }}
                    />
                </div>

                {/* Unique Checkbox */}
                <div style={{ width: '24px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    {depth === 1 && PRIMITIVE_TYPES.includes(field.type) ? (
                        <input
                            type="checkbox"
                            aria-label="unique"
                            checked={!!field.unique}
                            disabled={field.locked}
                            onChange={(e) => handleChange('unique', e.target.checked)}
                            style={{
                                accentColor: 'var(--color-primary)',
                                transform: 'scale(1.1)', cursor: field.locked ? 'not-allowed' : 'pointer',
                                opacity: field.locked ? 0.6 : 1
                            }}
                        />
                    ) : (
                        <div aria-hidden="true" />
                    )}
                </div>

                {/* Delete Button */}
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    disabled={field.locked}
                    className="btn btn-ghost"
                    style={{ 
                        color: 'var(--color-text-muted)', 
                        padding: '4px', 
                        flexShrink: 0,
                        opacity: field.locked ? 0.3 : 1,
                        cursor: field.locked ? 'not-allowed' : 'pointer'
                    }}
                >
                    <Trash2 size={15} />
                </button>
            </div>

            {!field.required && ['String', 'Number', 'Boolean'].includes(field.type) && (
              <div style={{ marginLeft: '26px', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  → Default Value:
                </span>

                {field.type === 'Boolean' ? (
                  <select
                    value={field.default === true ? 'true' : field.default === false ? 'false' : ''}
                    disabled={field.locked}
                    onChange={(e) => handleDefaultChange(e.target.value)}
                    className="input-field"
                    style={{ flex: 1, fontSize: '0.85rem', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  >
                    <option value="">No default</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type={field.type === 'Number' ? 'number' : 'text'}
                    value={field.default ?? ''}
                    disabled={field.locked}
                    onChange={(e) => handleDefaultChange(e.target.value)}
                    className="input-field"
                    placeholder={field.type === 'Number' ? 'e.g. 0' : 'e.g. pending'}
                    style={{ flex: 1, fontSize: '0.85rem', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  />
                )}
              </div>
            )}

            {/* Ref — Collection Picker */}
            {field.type === 'Ref' && (
                <div style={{ marginLeft: '26px', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        → References:
                    </span>
                    <select
                        value={field.ref || ''}
                        disabled={collectionsLoading || collectionsError}
                        onChange={(e) => handleChange('ref', e.target.value)}
                        className="input-field"
                        style={{ flex: 1, fontSize: '0.85rem', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    >
                        <option value="">{collectionsLoading ? 'Loading collections…' : collectionsError ? 'Failed to load' : 'Select collection...'}</option>
                        {collections.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Object — nested sub-fields */}
            {field.type === 'Object' && expanded && (
                <div style={{ marginLeft: '8px', marginBottom: '8px' }}>
                    <div style={{
                        padding: '8px', borderRadius: '6px',
                        border: '1px solid rgba(62, 207, 142, 0.1)',
                        background: 'rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                                SUB-FIELDS
                            </span>
                            {depth < MAX_DEPTH && (
                                <button type="button" onClick={addSubField} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
                                    <Plus size={12} /> Add
                                </button>
                            )}
                        </div>
                        {(field.fields || []).map((subField, subIdx) => (
                            <FieldRow
                                key={subField._id}
                                field={subField}
                                index={subIdx}
                                depth={depth + 1}
                                collections={collections}
                                collectionsLoading={collectionsLoading}
                                collectionsError={collectionsError}
                                onChange={handleSubFieldChange}
                                onRemove={removeSubField}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Array — item type config */}
            {field.type === 'Array' && expanded && (
                <div style={{ marginLeft: '8px', marginBottom: '8px' }}>
                    <div style={{
                        padding: '8px', borderRadius: '6px',
                        border: '1px solid rgba(62, 207, 142, 0.1)',
                        background: 'rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                                ITEMS TYPE
                            </span>
                            <select
                                value={field.items?.type || 'String'}
                                onChange={(e) => handleItemsChange('type', e.target.value)}
                                className="input-field"
                                style={{ flex: 1, fontSize: '0.85rem', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                            >
                                {availableItemTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        {/* Array of Objects — sub-fields */}
                        {field.items?.type === 'Object' && (
                            <div style={{ marginTop: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Object Fields</span>
                                    {depth < MAX_DEPTH && (
                                        <button type="button" onClick={addItemSubField} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
                                            <Plus size={12} /> Add
                                        </button>
                                    )}
                                </div>
                                {(field.items?.fields || []).map((subField, subIdx) => (
                                    <FieldRow
                                        key={subField._id}
                                        field={subField}
                                        index={subIdx}
                                        depth={depth + 1}
                                        collections={collections}
                                        collectionsLoading={collectionsLoading}
                                        collectionsError={collectionsError}
                                        onChange={handleItemSubFieldChange}
                                        onRemove={removeItemSubField}
                                    />
                                ))}
                            </div>
                        )}
                        {/* Array of Ref — collection picker */}
                        {field.items?.type === 'Ref' && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                    → References:
                                </span>
                                <select
                                    value={field.items?.ref || ''}
                                    disabled={collectionsLoading || collectionsError}
                                    onChange={(e) => handleItemsChange('ref', e.target.value)}
                                    className="input-field"
                                    style={{ flex: 1, fontSize: '0.85rem', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                >
                                    <option value="">{collectionsLoading ? 'Loading collections…' : collectionsError ? 'Failed to load' : 'Select collection...'}</option>
                                    {collections.map(c => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// FUNCTION - CLEAN FIELDS FOR API
function cleanFieldsForApi(fields) {
    return fields.map(f => {
      const { _id, ...clean } = f;
      
      const supportsDefault = ['String', 'Number', 'Boolean'].includes(clean.type);
      if (clean.required || !supportsDefault || clean.default === undefined) {
        delete clean.default;
      }
      
        if (clean.fields) clean.fields = cleanFieldsForApi(clean.fields);
        if (clean.items?.fields) {
            clean.items = { ...clean.items, fields: cleanFieldsForApi(clean.items.fields) };
        }
        return clean;
    });
}


// FUNCTION - CREATE COLLECTION COMPONENT
function CreateCollection() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { completeStep } = useOnboarding();

    const queryParams = new URLSearchParams(location.search);
    const initialName = queryParams.get('name')?.trim().toLowerCase() || '';
    const preset = queryParams.get('preset')?.trim().toLowerCase() || '';

    const [name, setName] = useState(initialName === 'users' ? 'users' : initialName);

    // Default fields for a new collection
    // If it's a "users" collection, we provide the essential Auth fields
    const getInitialFields = () => {
        if (initialName === 'users' || preset === 'auth-users') {
            return [
                { ...createEmptyField(), key: 'email', type: 'String', required: true, locked: true },
                { ...createEmptyField(), key: 'password', type: 'String', required: true, locked: true },
                { ...createEmptyField(), key: 'username', type: 'String', required: false },
                { ...createEmptyField(), key: 'emailVerified', type: 'Boolean', required: false },
            ];
        }
        return [
            { ...createEmptyField(), key: 'name', type: 'String', required: true }
        ];
    };

    const [fields, setFields] = useState(getInitialFields());
    const [loading, setLoading] = useState(false);
    const [collections, setCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [collectionsError, setCollectionsError] = useState(null);

    // Fetch existing collections for Ref picker — runs immediately on mount
    // so it fires in parallel with any other in-flight requests.
    useEffect(() => {
        let isMounted = true;
        const fetchCollections = async () => {
            if (isMounted) {
                setCollectionsLoading(true);
                setCollections([]);
                setCollectionsError(null);
            }
            try {
                const res = await api.get(`/api/projects/${projectId}`);
                if (isMounted) setCollections(res.data.collections || []);
            } catch (err) {
                console.error('Failed to fetch collections for Ref picker:', err);
                if (isMounted) {
                    setCollectionsError('Failed to load collections');
                    toast.error('Failed to load collections for references');
                }
            } finally {
                if (isMounted) setCollectionsLoading(false);
            }
        };
        fetchCollections();
        return () => { isMounted = false; };
    }, [projectId]);

    const addField = () => {
        setFields([...fields, createEmptyField()]);
    };

    const removeField = (index) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
    };

    const handleFieldChange = (index, updatedField) => {
        const newFields = [...fields];
        newFields[index] = updatedField;
        setFields(newFields);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?.isVerified) {
            toast.error("Account Verification Required. Please verify in Settings.");
            return;
        }

        const normalizedName = name.trim().toLowerCase();
        if (!normalizedName) return toast.error("Collection name is required");
        if (initialName === 'users' && normalizedName !== 'users') {
            return toast.error("The 'users' collection name cannot be changed.");
        }

        if (fields.some(f => !f.key)) return toast.error("All fields must have a name");

        if (normalizedName === 'users') {
            const hasEmail = fields.find(f => f.key === 'email' && f.type === 'String' && f.required);
            const hasPassword = fields.find(f => f.key === 'password' && f.type === 'String' && f.required);
            if (!hasEmail || !hasPassword) {
                return toast.error("The 'users' collection MUST have 'email' and 'password' as required String fields.");
            }
        }

        setLoading(true);
        try {
            await api.post(`/api/projects/${projectId}/collections`, {
                projectId,
                collectionName: normalizedName,
                schema: cleanFieldsForApi(fields)
            });

            toast.success("Collection Created!");
            completeStep('create_collection');
            navigate(`/project/${projectId}/database`);
        } catch (err) {
            const errMsg = err.response?.data?.error;
            toast.error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) || "Failed to create collection");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '900px' }}>
            <button
                onClick={() => navigate(`/project/${projectId}`)}
                className="btn btn-ghost"
                style={{ marginBottom: '1rem', paddingLeft: 0 }}
            >
                <ArrowLeft size={18} /> Cancel & Back
            </button>

            <div className="card">
                <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 600 }}>Create New Table</h2>

                <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={initialName === 'users'}
                        className="input-field"
                        style={{
                            cursor: initialName === 'users' ? 'not-allowed' : 'text',
                            opacity: initialName === 'users' ? 0.7 : 1
                        }}
                        placeholder="e.g. users, products, orders"
                        autoFocus={initialName !== 'users'}
                    />
                    <small style={{ color: 'var(--color-text-muted)', marginTop: '5px', display: 'block' }}>
                        This will be the name of your collection in the database.
                    </small>
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Columns</h3>
                        <button
                            type="button"
                            onClick={addField}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem' }}
                        >
                            <Plus size={14} /> Add Column
                        </button>
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 12px 6px 38px', marginBottom: '4px',
                        fontSize: '0.75rem', fontWeight: 600,
                        color: 'var(--color-text-muted)', letterSpacing: '0.05em'
                    }}>
                        <span style={{ flex: 2 }}>NAME</span>
                        <span style={{ flex: 1 }}>TYPE</span>
                        <span style={{ width: '24px', textAlign: 'center' }}>REQ</span>
                        <span style={{ width: '24px', textAlign: 'center' }}>UNIQ</span>
                        <span style={{ width: '30px' }}></span>
                    </div>

                    <div style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'rgba(0,0,0,0.1)'
                    }}>
                        {fields.map((field, index) => (
                            <FieldRow
                                key={field._id}
                                field={field}
                                index={index}
                                depth={1}
                                collections={collections}
                                collectionsLoading={collectionsLoading}
                                collectionsError={collectionsError}
                                onChange={handleFieldChange}
                                onRemove={removeField}
                            />
                        ))}
                    </div>

                    <div style={{ marginTop: '10px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        Tip: We automatically add a unique <code>_id</code> field to every document.
                        {' '}Use <strong>Object</strong> for nested data, <strong>Array</strong> for lists, and <strong>Ref</strong> to link collections.
                    </div>
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
                    >
                        {loading ? 'Creating...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateCollection;
