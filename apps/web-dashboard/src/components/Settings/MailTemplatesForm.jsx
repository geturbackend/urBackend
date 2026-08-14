import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Mail, Eye, Pencil, Trash2, Plus, Save, X } from "lucide-react";
import ConfirmationModal from "../../pages/ConfirmationModal";
import { SettingsCard, FormField } from "./formPrimitives";
import { inputStyle } from "../../utils/styles";

export default function MailTemplatesForm({ projectId, role }) {
    const isViewer = role === 'viewer';
    const [templates, setTemplates] = useState([]);
    const [globalTemplates, setGlobalTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editorOpen, setEditorOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const [saving, setSaving] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [form, setForm] = useState({ key: "", name: "", subject: "", html: "", text: "" });
    const [variablesText, setVariablesText] = useState('{\n  "name": "John"\n}');

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const [projectRes, globalRes] = await Promise.all([
                api.get(`/api/projects/${projectId}/mail/templates`),
                api.get(`/api/projects/${projectId}/mail/templates/global`),
            ]);
            setTemplates(projectRes.data?.data?.templates || []);
            setGlobalTemplates(globalRes.data?.data?.templates || []);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        Promise.resolve().then(() => {
            if (isMounted) fetchTemplates();
        });
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const fetchTemplateDetails = async (templateId) => {
        const res = await api.get(`/api/projects/${projectId}/mail/templates/${templateId}`);
        return res.data?.data?.template;
    };

    const openCreate = () => {
        setEditingId(null);
        setActiveTemplate(null);
        setForm({ key: "", name: "", subject: "", html: "", text: "" });
        setEditorOpen(true);
    };

    const openEdit = async (t) => {
        try {
            const full = await fetchTemplateDetails(t.id);
            setEditingId(t.id);
            setActiveTemplate(full);
            setForm({
                key: full?.key || "",
                name: full?.name || "",
                subject: full?.subject || "",
                html: full?.html || "",
                text: full?.text || "",
            });
            setEditorOpen(true);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load template");
        }
    };

    const openPreview = async (t) => {
        try {
            const full = await fetchTemplateDetails(t.id);
            setActiveTemplate(full);
            setPreviewOpen(true);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load template");
        }
    };

    const closeEditor = () => {
        setEditorOpen(false);
        setSaving(false);
    };

    const closePreview = () => {
        setPreviewOpen(false);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("Template name is required");
        if (!form.subject.trim()) return toast.error("Subject is required");
        const hasBody = (form.html && form.html.trim()) || (form.text && form.text.trim());
        if (!hasBody) return toast.error("Provide at least one of html or text");

        setSaving(true);
        try {
            if (editingId) {
                const payload = {
                    name: form.name,
                    subject: form.subject,
                    html: form.html,
                    text: form.text,
                };
                const nextKey = String(form.key ?? "").trim();
                const prevKey = String(activeTemplate?.key ?? "").trim();
                if (nextKey && nextKey !== prevKey) {
                    payload.key = nextKey;
                }

                await api.patch(`/api/projects/${projectId}/mail/templates/${editingId}`, payload);
                toast.success("Template updated");
            } else {
                await api.post(`/api/projects/${projectId}/mail/templates`, {
                    key: form.key,
                    name: form.name,
                    subject: form.subject,
                    html: form.html,
                    text: form.text,
                });
                toast.success("Template created");
            }

            closeEditor();
            await fetchTemplates();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save template");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const templateId = confirmDeleteId;
        if (!templateId) return;
        try {
            await api.delete(`/api/projects/${projectId}/mail/templates/${templateId}`);
            toast.success("Template deleted");
            setConfirmDeleteId(null);
            await fetchTemplates();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete template");
        }
    };

    const formatDate = (iso) => {
        if (!iso) return "";
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return String(iso);
        }
    };

    const { variablesError, preview } = useMemo(() => {
        const escapeHtml = (value) => {
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        };

        const getVarByPath = (vars, path) => {
            if (!vars || typeof vars !== "object") return "";
            const parts = String(path || "")
                .split(".")
                .map((p) => p.trim())
                .filter(Boolean);

            let cur = vars;
            for (const p of parts) {
                if (cur && typeof cur === "object" && p in cur) {
                    cur = cur[p];
                } else {
                    return "";
                }
            }
            return cur ?? "";
        };

        const renderTemplateString = (template, vars, { mode }) => {
            if (typeof template !== "string" || !template) return template;
            const isHtml = mode === "html";

            let out = template.replace(/\{\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}\}/g, (_, key) => {
                const v = getVarByPath(vars, key);
                return String(v ?? "");
            });

            out = out.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key) => {
                const v = getVarByPath(vars, key);
                const s = String(v ?? "");
                return isHtml ? escapeHtml(s) : s;
            });

            return out;
        };

        let vars = {};
        let nextVariablesError = null;

        try {
            vars = variablesText && variablesText.trim() ? JSON.parse(variablesText) : {};
            if (vars === null || typeof vars !== "object" || Array.isArray(vars)) {
                nextVariablesError = "Variables must be a JSON object";
                vars = {};
            }
        } catch {
            nextVariablesError = "Invalid JSON";
            vars = {};
        }

        const nextPreview = activeTemplate
            ? {
                subject: renderTemplateString(activeTemplate.subject || "", vars, { mode: "text" }),
                html: renderTemplateString(activeTemplate.html || "", vars, { mode: "html" }),
                text: renderTemplateString(activeTemplate.text || "", vars, { mode: "text" }),
            }
            : { subject: "", html: "", text: "" };

        return { variablesError: nextVariablesError, preview: nextPreview };
    }, [variablesText, activeTemplate]);

    return (
        <>
            {confirmDeleteId && (
                <ConfirmationModal
                    open={!!confirmDeleteId}
                    title="Delete Template"
                    message="Are you sure you want to delete this mail template?"
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}

            <SettingsCard
                title="Mail Templates"
                icon={Mail}
                iconColor="#60a5fa"
                accentColor="#3b82f6"
                style={{ borderColor: 'rgba(59,130,246,0.25)' }}
                info={{
                    title: 'Mail Templates',
                    description: "Create reusable email templates for transactional messages like OTPs, welcome emails, and notifications. Templates support Handlebars-style variable interpolation: {{variable}} (HTML-escaped) and {{{raw_variable}}} (unescaped). Reference a template by its slug when calling POST /api/mail/send. A live preview is shown as you edit.",
                    docsUrl: 'https://docs.ub.bitbros.in/guides/mail-platform'
                }}
            >
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5, marginBottom: '10px' }}>
                    Create reusable subjects/bodies and preview how they render with variables. Use <code>{'{{name}}'}</code> (escaped) or <code>{'{{{name}}}'}</code> (raw) inside HTML.
                </p>

                {loading ? (
                    <div className="spinner" style={{ margin: '8px auto' }} />
                ) : (
                    <>
                        {/* Global templates (read-only) */}
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Global templates</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Use <code>templateName</code> = key</div>
                            </div>

                            {globalTemplates.length === 0 ? (
                                <div style={{ padding: '10px 12px', borderRadius: '6px', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                    No global templates available.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {globalTemplates.map((t) => (
                                        <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: '10px', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.06)' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {t.name}
                                                    {t.key && (
                                                        <code style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }}>{t.key}</code>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{formatDate(t.updatedAt)}</div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.subject}>
                                                {t.subject}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn-secondary" onClick={() => openPreview(t)} style={{ height: '26px', fontSize: '0.7rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Eye size={12} /> Preview
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ height: '1px', background: 'var(--color-border)', opacity: 0.6, margin: '10px 0 12px' }} />

                        {/* Project templates (editable) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Project templates</div>
                            {!isViewer && (
                                <button className="btn btn-primary" onClick={openCreate} style={{ height: '28px', fontSize: '0.72rem', padding: '0 10px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Plus size={14} /> New
                                </button>
                            )}
                        </div>

                        {templates.length === 0 ? (
                            <div style={{ padding: '10px 12px', borderRadius: '6px', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                No project templates yet.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {templates.map((t) => (
                                    <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: '10px', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {t.name}
                                                {t.key && (
                                                    <code style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }}>{t.key}</code>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{formatDate(t.updatedAt)}</div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.subject}>
                                            {t.subject}
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className="btn btn-secondary" onClick={() => openPreview(t)} style={{ height: '26px', fontSize: '0.7rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Eye size={12} /> Preview
                                            </button>
                                            {!isViewer && (
                                                <>
                                                    <button className="btn btn-secondary" onClick={() => openEdit(t)} style={{ height: '26px', fontSize: '0.7rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Pencil size={12} /> Edit
                                                    </button>
                                                    <button className="btn btn-danger" onClick={() => setConfirmDeleteId(t.id)} style={{ height: '26px', fontSize: '0.7rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </SettingsCard>

            {/* Editor Modal */}
            {editorOpen && (
                <div
                    className="modal-overlay"
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={closeEditor}
                >
                    <div
                        className="glass-card modal-content"
                        style={{ width: '100%', maxWidth: '860px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', padding: '1.25rem', borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="btn-icon" style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={closeEditor}>
                            <X size={18} />
                        </button>

                        <div style={{ marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>{editingId ? 'Edit Template' : 'New Template'}</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                                Use variables like <code>{'{{user.name}}'}</code>. In HTML, <code>{'{{{rawHtml}}}'}</code> inserts raw.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <FormField label="Template Key (tag)" hint={<>Use this in API/SDK as <code>templateName</code>. If blank, it’s auto-generated.</>}> 
                                <input
                                    className="input-field"
                                    value={form.key ?? ""}
                                    onChange={(e) => {
                                        const nextKey = e.target.value;
                                        setForm((p) => ({
                                            ...p,
                                            key: nextKey.trim() === "" ? undefined : nextKey,
                                        }));
                                    }}
                                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                                />
                            </FormField>
                            <FormField label="Template Name">
                                <input className="input-field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
                            </FormField>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <FormField label="Subject">
                                    <input className="input-field" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} style={inputStyle} />
                                </FormField>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                            <FormField label="HTML" hint="Optional (but HTML or Text is required)">
                                <textarea className="input-field" value={form.html} onChange={(e) => setForm((p) => ({ ...p, html: e.target.value }))} rows={10} style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }} />
                            </FormField>
                            <FormField label="Text" hint="Optional (but HTML or Text is required)">
                                <textarea className="input-field" value={form.text} onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))} rows={10} style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }} />
                            </FormField>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                            <button className="btn btn-secondary" onClick={closeEditor} style={{ height: '32px', fontSize: '0.75rem' }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ height: '32px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewOpen && activeTemplate && (
                <div
                    className="modal-overlay"
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={closePreview}
                >
                    <div
                        className="glass-card modal-content"
                        style={{ width: '100%', maxWidth: '980px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', padding: '1.25rem', borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="btn-icon" style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={closePreview}>
                            <X size={18} />
                        </button>

                        <div style={{ marginBottom: '10px' }}>
                            <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Eye size={18} color="var(--color-primary)" /> Preview: {activeTemplate.name}
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                                Updated: {formatDate(activeTemplate.updatedAt)}
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <FormField label="Variables (JSON)">
                                <textarea className="input-field" value={variablesText} onChange={(e) => setVariablesText(e.target.value)} rows={8} style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }} />
                            {variablesError && (
                                    <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#f97316' }}>{variablesError}</div>
                                )}
                            </FormField>
                            <FormField label="Preview (sandboxed)">
                                <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
                                    <iframe
                                        title="template-preview"
                                        sandbox=""
                                        style={{ width: '100%', height: '55vh', minHeight: '360px', border: 'none', display: 'block' }}
                                        srcDoc={`<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;padding:16px;background:#fff">${preview.html || ""}</body></html>`}
                                    />
                                </div>
                                {!preview.html?.trim() && (
                                    <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '6px', border: '1px dashed var(--color-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                                        No HTML found for this template. (Text templates won’t render in the preview iframe.)
                                    </div>
                                )}
                            </FormField>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                            <button className="btn btn-secondary" onClick={closePreview} style={{ height: '32px', fontSize: '0.75rem' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
