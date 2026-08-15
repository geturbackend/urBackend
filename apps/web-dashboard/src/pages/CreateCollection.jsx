import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useOnboarding } from '../context/OnboardingContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import CollectionCreatorAgent from '../components/CollectionCreatorAgent';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

const MAX_DEPTH = 3;

// FUNCTION - NEXT FIELD ID
let _fieldIdCounter = 0;
const nextFieldId = () => `field_${Date.now()}_${_fieldIdCounter++}`;

const PRIMITIVE_TYPES = ['String', 'Number', 'Boolean', 'Date'];
const ALL_TYPES = [...PRIMITIVE_TYPES, 'Object', 'Array', 'Ref'];
const ARRAY_ITEM_TYPES = [...PRIMITIVE_TYPES, 'Object', 'Ref'];

function createEmptyField() {
    return {
        _id: nextFieldId(),
        key: '',
        type: 'String',
        required: false,
        unique: false,
        fields: [],
        items: { type: 'String', ref: '', fields: [] },
        ref: ''
    };
}

function CreateCollection() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { completeStep } = useOnboarding();

    const initialName = new URLSearchParams(location.search).get('name') || '';

    const [name, setName] = useState(initialName);
    const [fields, setFields] = useState(() => {
        if (initialName === 'users') {
            return [
                { _id: nextFieldId(), key: 'email', type: 'String', required: true, unique: true, fields: [], items: { type: 'String' }, ref: '', isFixed: true },
                { _id: nextFieldId(), key: 'password', type: 'String', required: true, unique: false, fields: [], items: { type: 'String' }, ref: '', isFixed: true }
            ];
        }
        return [createEmptyField()];
    });
    const [collections, setCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(false);
    const [collectionsError, setCollectionsError] = useState(null);
    const [loading, setLoading] = useState(false);

    const [mode, setMode] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('mode') === 'ai' ? 'ai' : 'manual';
    });

    useEffect(() => {
        const fetchCollections = async () => {
            setCollectionsLoading(true);
            setCollectionsError(null);
            try {
                const res = await api.get(`/api/projects/${projectId}`);
                if (res.data && res.data.data && Array.isArray(res.data.data.collections)) {
                    setCollections(res.data.data.collections);
                } else {
                    setCollections([]);
                }
            } catch (err) {
                console.error("Failed to fetch collections", err);
                setCollectionsError("Could not load collections for Ref field");
            } finally {
                setCollectionsLoading(false);
            }
        };

        if (projectId) {
            fetchCollections();
        }
    }, [projectId]);

    const addField = () => {
        setFields([...fields, createEmptyField()]);
    };

    const removeField = (indexToRemove) => {
        setFields(fields.filter((_, idx) => idx !== indexToRemove));
    };

    const handleFieldChange = (index, updatedField) => {
        const updated = [...fields];
        updated[index] = updatedField;
        setFields(updated);
    };

    const cleanFieldsForApi = (fieldList) => {
        return fieldList.map(f => {
            const cleaned = {
                key: f.key,
                type: f.type,
                required: !!f.required,
            };

            if (f.unique && !['Array', 'Object', 'Ref'].includes(f.type)) {
                cleaned.unique = true;
            }

            if (f.type === 'Ref') {
                cleaned.ref = f.ref || 'users';
            }

            if (f.type === 'Array') {
                const itemType = f.items?.type || 'String';
                const itemsDef = { type: itemType };
                if (itemType === 'Ref') {
                    itemsDef.ref = f.items?.ref || 'users';
                }
                if (itemType === 'Object') {
                    itemsDef.fields = cleanFieldsForApi(f.items?.fields || []);
                }
                cleaned.items = itemsDef;
            }

            if (f.type === 'Object') {
                cleaned.fields = cleanFieldsForApi(f.fields || []);
            }

            return cleaned;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const normalizedName = name.trim().toLowerCase();

        if (!normalizedName) return toast.error("Collection name is required");
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
            const errMsg = err.response?.data?.message || err.response?.data?.error;
            toast.error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) || "Failed to create collection");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="w-full h-[calc(100vh-64px)] flex flex-col overflow-hidden"
            style={{ 
                padding: '1rem 1.5rem',
                boxSizing: 'border-box'
            }}
        >
            {/* Top Navigation & Mode Switch Header (Pinned, Non-overlapping) */}
            <div 
                className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border)] flex-shrink-0 gap-4"
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/project/${projectId}`)}
                        className="btn btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] rounded-md border border-[var(--color-border)]"
                    >
                        <ArrowLeft size={14} /> Cancel & Back
                    </button>
                    <div className="h-4 w-px bg-[var(--color-border)]" />
                    <h2 className="text-base font-semibold m-0 text-[var(--color-text-main)]">
                        Create Collection
                    </h2>
                </div>
                
                {initialName !== 'users' && (
                    <Tabs value={mode} onValueChange={setMode} className="w-auto shrink-0">
                        <TabsList className="h-8 p-1 bg-[var(--color-bg-input)] border border-[var(--color-border)]">
                            <TabsTrigger value="manual" className="text-xs px-3 py-1 font-medium">
                                Manual Builder
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="text-xs px-3 py-1 gap-1.5 font-medium data-[state=active]:text-[var(--color-primary)]">
                                <Wand2 size={13} className="text-[var(--color-primary)]" />
                                <span>AI-Assisted</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
            </div>

            {/* Main Area */}
            {mode === 'manual' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar max-w-4xl mx-auto w-full py-4">
                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
                        <div className="form-group mb-6">
                            <label className="form-label text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 block">
                                Collection Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={initialName === 'users'}
                                className="input-field w-full text-sm font-mono"
                                style={{
                                    cursor: initialName === 'users' ? 'not-allowed' : 'text',
                                    opacity: initialName === 'users' ? 0.7 : 1
                                }}
                                placeholder="e.g. products, orders, articles"
                                autoFocus={initialName !== 'users'}
                            />
                            <small className="text-xs text-[var(--color-text-muted)] mt-1.5 block">
                                This will be the name of your collection in the database.
                            </small>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-semibold text-[var(--color-text-main)] m-0">Fields</h3>
                                <button
                                    type="button"
                                    onClick={addField}
                                    className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-md"
                                >
                                    <Plus size={13} /> Add Field
                                </button>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1.5 mb-1 text-[10px] font-semibold text-[var(--color-text-muted)] tracking-wider">
                                <span className="flex-2">NAME</span>
                                <span className="flex-1">TYPE</span>
                                <span className="w-6 text-center">REQ</span>
                                <span className="w-6 text-center">UNIQ</span>
                                <span className="w-8"></span>
                            </div>

                            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-input)] divide-y divide-[var(--color-border)]">
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

                            <div className="mt-3 text-xs text-[var(--color-text-muted)]">
                                Tip: We automatically add a unique <code>_id</code> field to every document.
                                {' '}Use <strong>Object</strong> for nested data, <strong>Array</strong> for lists, and <strong>Ref</strong> to link collections.
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-[var(--color-border)] flex justify-end">
                            <button
                                onClick={handleSubmit}
                                className="btn btn-primary text-xs px-6 py-2 font-semibold"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Save Collection'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden min-h-0 w-full">
                    <CollectionCreatorAgent 
                        projectId={projectId} 
                        onInsertAll={() => {
                            completeStep('create_collection');
                            navigate(`/project/${projectId}/database`);
                        }} 
                    />
                </div>
            )}
        </div>
    );
}

// FieldRow Component
function FieldRow({
    field,
    index,
    depth,
    collections,
    collectionsLoading,
    collectionsError,
    onChange,
    onRemove
}) {
    const isFixed = field.isFixed;
    const isObject = field.type === 'Object';
    const isArray = field.type === 'Array';
    const isRef = field.type === 'Ref';
    const [collapsed, setCollapsed] = useState(false);

    const handleKeyChange = (e) => onChange(index, { ...field, key: e.target.value });
    const handleTypeChange = (e) => {
        const nextType = e.target.value;
        const nextField = { ...field, type: nextType };
        if (nextType === 'Object' && (!field.fields || field.fields.length === 0)) {
            nextField.fields = [createEmptyField()];
        }
        if (nextType === 'Array') {
            nextField.items = { type: 'String', ref: '', fields: [] };
        }
        if (nextType === 'Ref') {
            nextField.ref = collections[0]?.name || 'users';
            nextField.unique = false;
        }
        if (nextType === 'Object' || nextType === 'Array') {
            nextField.unique = false;
        }
        onChange(index, nextField);
    };

    const handleRequiredToggle = () => onChange(index, { ...field, required: !field.required });
    const handleUniqueToggle = () => onChange(index, { ...field, unique: !field.unique });
    const handleRefChange = (e) => onChange(index, { ...field, ref: e.target.value });

    const handleSubFieldChange = (subIndex, updatedSubField) => {
        const newFields = [...(field.fields || [])];
        newFields[subIndex] = updatedSubField;
        onChange(index, { ...field, fields: newFields });
    };

    const addSubField = () => {
        onChange(index, { ...field, fields: [...(field.fields || []), createEmptyField()] });
    };

    const removeSubField = (subIndex) => {
        onChange(index, { ...field, fields: (field.fields || []).filter((_, idx) => idx !== subIndex) });
    };

    const handleArrayItemTypeChange = (e) => {
        const itemType = e.target.value;
        const nextItems = { type: itemType, ref: '', fields: [] };
        if (itemType === 'Object') {
            nextItems.fields = [createEmptyField()];
        }
        if (itemType === 'Ref') {
            nextItems.ref = collections[0]?.name || 'users';
        }
        onChange(index, { ...field, items: nextItems });
    };

    return (
        <div className="text-xs bg-[var(--color-bg-card)]">
            <div className="flex items-center gap-2 p-2 px-3 hover:bg-[var(--color-surface-hover)] transition-colors">
                {/* Collapse / Expand icon for complex types */}
                <div className="w-5 flex items-center justify-center">
                    {(isObject || (isArray && field.items?.type === 'Object')) ? (
                        <button
                            type="button"
                            onClick={() => setCollapsed(!collapsed)}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] p-0.5"
                        >
                            {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        </button>
                    ) : (
                        <span className="w-3" />
                    )}
                </div>

                {/* Field Name */}
                <div className="flex-2">
                    <input
                        type="text"
                        value={field.key}
                        onChange={handleKeyChange}
                        disabled={isFixed}
                        placeholder="field_name"
                        className="input-field w-full text-xs font-mono py-1 px-2 h-7"
                    />
                </div>

                {/* Field Type Selector */}
                <div className="flex-1">
                    <select
                        value={field.type}
                        onChange={handleTypeChange}
                        disabled={isFixed}
                        className="input-field w-full text-xs py-1 px-2 h-7"
                    >
                        {ALL_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Ref Collection Dropdown */}
                {isRef && (
                    <div className="flex-1">
                        <select
                            value={field.ref || 'users'}
                            onChange={handleRefChange}
                            className="input-field w-full text-xs py-1 px-2 h-7 font-mono text-cyan-400"
                        >
                            <option value="users">users (Auth)</option>
                            {collections.filter(c => c.name !== 'users').map(c => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Array Item Type Selector */}
                {isArray && (
                    <div className="flex-1 flex items-center gap-1">
                        <span className="text-[10px] text-[var(--color-text-muted)]">of</span>
                        <select
                            value={field.items?.type || 'String'}
                            onChange={handleArrayItemTypeChange}
                            className="input-field w-full text-xs py-1 px-2 h-7"
                        >
                            {ARRAY_ITEM_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Required Checkbox */}
                <div className="w-6 text-center">
                    <input
                        type="checkbox"
                        checked={field.required}
                        onChange={handleRequiredToggle}
                        disabled={isFixed}
                        className="cursor-pointer"
                        title="Required"
                    />
                </div>

                {/* Unique Checkbox */}
                <div className="w-6 text-center">
                    <input
                        type="checkbox"
                        checked={field.unique}
                        onChange={handleUniqueToggle}
                        disabled={isFixed || isArray || isObject || isRef}
                        className="cursor-pointer"
                        title="Unique"
                    />
                </div>

                {/* Remove Field Button */}
                <div className="w-8 text-right">
                    {!isFixed && (
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-500/10"
                            title="Remove field"
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Nested fields for Object */}
            {isObject && !collapsed && (
                <div className="pl-6 pr-3 py-2 bg-[var(--color-bg-input)] border-t border-[var(--color-border)] space-y-1.5">
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
                    {depth < MAX_DEPTH && (
                        <button
                            type="button"
                            onClick={addSubField}
                            className="text-[11px] text-[var(--color-primary)] hover:underline flex items-center gap-1 pt-1"
                        >
                            <Plus size={11} /> Add nested field to {field.key || 'Object'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default CreateCollection;
