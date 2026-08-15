import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useOnboarding } from '../context/OnboardingContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import CollectionCreatorAgent from '../components/CollectionCreatorAgent';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Button } from '../components/ui/button';

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

            if (f.default !== undefined) {
                cleaned.default = f.default;
            }

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
        if (fields.length === 0) return toast.error("Collection must have at least one field");
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
            className="w-full flex flex-col overflow-hidden box-border p-4"
            style={{ height: 'calc(100vh - var(--header-height))' }}
        >
            {/* Top Navigation & Mode Switch Header (Pinned, Non-overlapping) */}
            <div 
                className="flex flex-wrap items-center justify-between pb-3.5 mb-3.5 border-b border-[var(--color-border)] flex-shrink-0 gap-6"
            >
                <div className="flex items-center gap-3.5">
                    <button
                        onClick={() => navigate(`/project/${projectId}`)}
                        className="btn btn-ghost text-xs px-3 py-1.5 flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] rounded-lg border border-[var(--color-border)]"
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
                            <TabsTrigger value="manual" className="text-xs px-3.5 py-1 font-medium">
                                Manual Builder
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="text-xs px-3.5 py-1 gap-1.5 font-medium data-[state=active]:text-[var(--color-primary)]">
                                <Wand2 size={13} className="text-[var(--color-primary)]" />
                                <span>AI-Assisted</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
            </div>

            {mode === 'manual' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar w-full flex flex-col">
                    <div className="w-full max-w-4xl mx-auto py-8 my-auto flex flex-col justify-center">
                        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-sm">
                            <div className="form-group mb-8">
                                <label className="form-label text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 block">
                                    Collection Name
                                </label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={initialName === 'users'}
                                    className="w-full text-base font-mono py-5"
                                    style={{
                                        cursor: initialName === 'users' ? 'not-allowed' : 'text',
                                        opacity: initialName === 'users' ? 0.7 : 1
                                    }}
                                    placeholder="e.g. products, orders, articles"
                                    autoFocus={initialName !== 'users'}
                                />
                                <small className="text-sm text-[var(--color-text-muted)] mt-2 block">
                                    This will be the name of your collection in the database.
                                </small>
                            </div>

                            <div className="mt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-semibold text-[var(--color-text-main)] m-0">Fields</h3>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={addField}
                                        className="text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-md h-8"
                                    >
                                        <Plus size={13} /> Add Field
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3 px-3 py-3 mb-2 text-xs font-semibold text-[var(--color-text-muted)] tracking-wider">
                                    <span className="flex-[3]">NAME</span>
                                    <span className="flex-[2]">TYPE</span>
                                    <span className="flex-[2]">DEFAULT</span>
                                    <span className="w-12 text-center flex justify-center" title="Required">REQ</span>
                                    <span className="w-12 text-center flex justify-center" title="Unique">UNIQ</span>
                                    <span className="w-8"></span>
                                </div>

                                <div className="space-y-1.5">
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
                            <Button
                                onClick={handleSubmit}
                                className="px-6 py-2 h-10 font-semibold"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Save Collection'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            ) : (
                <div className="flex-1 overflow-hidden min-h-0 w-full flex flex-col">
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
        delete nextField.default;
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

    const handleRequiredToggle = (e) => {
        const checked = e.target.checked;
        const newField = { ...field, required: checked };
        if (checked) {
            delete newField.default;
        }
        onChange(index, newField);
    };
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

    const handleDefaultChange = (e) => {
        let val = e.target.value;
        const newField = { ...field };
        
        if (val === '') {
            delete newField.default;
            onChange(index, newField);
            return;
        }

        if (field.type === 'Number') {
            const num = Number(val);
            newField.default = isNaN(num) ? val : num;
        } else {
            newField.default = val;
        }
        onChange(index, newField);
    };

    const isDefaultSupported = !field.required && ['String', 'Number', 'Boolean'].includes(field.type) && field.key !== '_id';

    return (
        <div className="text-sm bg-transparent">
            <div className="flex items-center gap-3 p-2 px-3 hover:bg-[var(--color-bg-card)] rounded-lg transition-colors border border-transparent hover:border-[var(--color-border)]">
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
                <div className="flex-[3]">
                    <Input
                        type="text"
                        value={field.key}
                        onChange={handleKeyChange}
                        disabled={isFixed}
                        placeholder="field_name"
                        className="w-full text-sm font-mono h-9"
                    />
                </div>

                {/* Field Type Selector */}
                <div className="flex-[2]">
                    <Select
                        value={field.type}
                        onValueChange={(val) => handleTypeChange({ target: { value: val } })}
                        disabled={isFixed}
                    >
                        <SelectTrigger className="w-full text-sm h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ALL_TYPES.map(t => (
                                <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Ref Collection Dropdown */}
                {isRef && (
                    <div className="flex-1">
                        <Select
                            value={field.ref || 'users'}
                            onValueChange={(val) => handleRefChange({ target: { value: val } })}
                        >
                            <SelectTrigger className="w-full text-sm h-9 font-mono text-cyan-400">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="users" className="font-mono">users (Auth)</SelectItem>
                                {collections.filter(c => c.name !== 'users').map(c => (
                                    <SelectItem key={c.name} value={c.name} className="font-mono">{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Array Item Type Selector */}
                {isArray && (
                    <div className="flex-[2] flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">OF</span>
                        <Select
                            value={field.items?.type || 'String'}
                            onValueChange={(val) => handleArrayItemTypeChange({ target: { value: val } })}
                        >
                            <SelectTrigger className="w-full text-sm h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ARRAY_ITEM_TYPES.map(t => (
                                    <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Default Value Input */}
                <div className="flex-[2] flex items-center">
                    {isDefaultSupported ? (
                        field.type === 'Boolean' ? (
                            <Select
                                value={field.default !== undefined ? String(field.default) : 'none'}
                                onValueChange={(val) => {
                                    const newField = { ...field };
                                    if (val === 'none') {
                                        delete newField.default;
                                    } else {
                                        newField.default = val === 'true';
                                    }
                                    onChange(index, newField);
                                }}
                                disabled={isFixed}
                            >
                                <SelectTrigger className="w-full text-sm h-9">
                                    <SelectValue placeholder="Default" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" className="text-xs italic text-[var(--color-text-muted)]">No default</SelectItem>
                                    <SelectItem value="true">true</SelectItem>
                                    <SelectItem value="false">false</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                type={field.type === 'Number' ? 'number' : 'text'}
                                value={field.default !== undefined ? field.default : ''}
                                onChange={handleDefaultChange}
                                disabled={isFixed}
                                placeholder="Default"
                                className="w-full text-sm font-mono h-9"
                            />
                        )
                    ) : (
                        <div className="w-full text-center text-[var(--color-text-muted)] italic text-xs">N/A</div>
                    )}
                </div>

                {/* Required Checkbox */}
                <div className="w-12 flex justify-center text-center">
                    <Checkbox
                        checked={field.required}
                        onCheckedChange={(checked) => handleRequiredToggle({ target: { checked } })}
                        disabled={isFixed}
                        title="Required"
                    />
                </div>

                {/* Unique Checkbox */}
                <div className="w-12 flex justify-center text-center">
                    <Checkbox
                        checked={field.unique}
                        onCheckedChange={(checked) => handleUniqueToggle({ target: { checked } })}
                        disabled={isFixed || isArray || isObject || isRef}
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
