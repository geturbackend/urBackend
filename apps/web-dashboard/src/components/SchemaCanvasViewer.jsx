import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  LayoutGrid, 
  List, 
  Code, 
  Key, 
  ArrowRight,
  Database,
  Check,
  Copy,
  Plus
} from 'lucide-react';
import SchemaCanvas from './SchemaCanvas/SchemaCanvas';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  String: { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
  Number: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
  Boolean: { bg: 'rgba(20, 184, 166, 0.12)', text: '#2dd4bf', border: 'rgba(20, 184, 166, 0.25)' },
  Date: { bg: 'rgba(168, 85, 247, 0.12)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.25)' },
  Ref: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
  Array: { bg: 'rgba(14, 165, 233, 0.12)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.25)' },
  Object: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.25)' },
};

export default function SchemaCanvasViewer({
  schema,
  messages,
  insertResults,
  isInserting,
  onInsertAll,
  onResetChat,
  onNavigateToDb
}) {
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'list' | 'json'
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const formattedCollections = (schema || []).map(c => ({
    name: c.collection,
    model: (c.fields || []).map(f => ({
      key: f.name || f.key,
      type: f.type,
      required: !!f.required,
      unique: !!f.unique,
      ref: f.ref,
      items: f.items,
      fields: f.fields
    }))
  }));

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
      setCopiedJson(true);
      toast.success("Schema JSON copied!");
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      toast.error("Failed to copy JSON");
    }
  };

  const renderTypeBadge = (field) => {
    const typeKey = field.type || 'String';
    const styling = TYPE_COLORS[typeKey] || TYPE_COLORS.String;

    let displayLabel = field.type;
    if (field.type === 'Array' && field.items?.type) {
      displayLabel = `Array<${field.items.type}>`;
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: styling.bg,
          color: styling.text,
          border: `1px solid ${styling.border}`,
          borderRadius: '5px',
          padding: '2px 7px',
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.02em',
          fontFamily: 'monospace'
        }}
      >
        {displayLabel}
      </span>
    );
  };

  const renderFieldTree = (field, depth = 0, isLast = false, keyPrefix = '') => {
    const indentPadding = 18 + depth * 16;
    const nodeKey = `${keyPrefix}_${depth}_${field.name || field.key || 'field'}`;

    return (
      <React.Fragment key={nodeKey}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `10px 18px 10px ${indentPadding}px`,
            borderBottom: !isLast ? '1px solid var(--color-border)' : 'none',
            fontSize: '0.8rem',
            borderLeft: depth > 0 ? '2px solid rgba(62, 207, 142, 0.35)' : 'none',
            backgroundColor: depth > 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
            transition: 'background-color 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
            <span
              style={{
                fontFamily: 'monospace',
                color: depth > 0 ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                fontWeight: field.required ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {field.name || field.key}
            </span>
            {field.required && (
              <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.85rem' }} title="Required">*</span>
            )}
            {field.unique && (
              <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '0 3px', borderRadius: '2px', fontWeight: 700 }}>U</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderTypeBadge(field)}
            {field.type === 'Ref' && field.ref && (
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                → {field.ref}
              </span>
            )}
          </div>
        </div>

        {field.fields && field.fields.length > 0 && (
          field.fields.map((subField, subIdx) => 
            renderFieldTree(
              subField, 
              depth + 1, 
              isLast && subIdx === field.fields.length - 1, 
              `${nodeKey}_${subIdx}`
            )
          )
        )}
      </React.Fragment>
    );
  };

  return (
    <TooltipProvider>
      <div 
        className="flex flex-col w-full lg:w-[50%] h-full rounded-2xl overflow-hidden shadow-sm transition-all border border-[var(--color-border)] bg-[var(--color-bg-card)] relative"
      >
        {/* Top Header & Tabs Toolbar */}
        <div className="p-3 px-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] flex justify-between items-center flex-shrink-0 gap-3 flex-wrap z-10">
          {/* Title & Mode Switcher */}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-main)] flex items-center gap-2 m-0">
              <Sparkles size={15} className="text-[var(--color-primary)]" />
              <span>Schema Architect</span>
            </h3>
            
            {schema && schema.length > 0 && (
              <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
                <TabsList className="h-7">
                  <TabsTrigger value="canvas" className="text-xs px-2.5 py-0.5 gap-1.5">
                    <LayoutGrid size={12} />
                    <span>Visual Canvas</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-xs px-2.5 py-0.5 gap-1.5">
                    <List size={12} />
                    <span>Tree List</span>
                  </TabsTrigger>
                  <TabsTrigger value="json" className="text-xs px-2.5 py-0.5 gap-1.5">
                    <Code size={12} />
                    <span>JSON</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onResetChat}
                    className="gap-1 text-xs h-7"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear conversation and restart</TooltipContent>
              </Tooltip>
            )}

            {schema && schema.length > 0 && viewMode === 'json' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyJson}
                className="gap-1 text-xs h-7"
              >
                {copiedJson ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
              </Button>
            )}

            {schema && schema.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isInserting}
                className="gap-1.5 text-xs font-semibold h-7"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Create Collections ({schema.length})</span>
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative bg-[var(--color-bg-main)]">
          {/* Insert Results Alert (Pinned on Top) */}
          {insertResults && (
            <div className="absolute top-4 left-4 right-4 z-30 p-4 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl shadow-2xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-[var(--color-text-main)] m-0">Creation Results</p>
                <Button
                  size="sm"
                  onClick={onNavigateToDb}
                  className="gap-1.5 text-xs h-7 font-semibold"
                >
                  Continue to Database <ArrowRight size={12} />
                </Button>
              </div>
              <ul className="space-y-1.5 m-0 p-0 list-none">
                {insertResults.map((r, i) => (
                  <li key={i} className={`flex items-center gap-2 text-xs ${r.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className="font-bold">{r.success ? '✓' : '✗'}</span>
                    <strong className="text-[var(--color-text-main)] font-mono">{r.collection}</strong>
                    {!r.success && <span className="text-red-400">({r.error})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!schema || schema.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-bg-input)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] mb-4 shadow-sm">
                <Sparkles size={24} />
              </div>
              <h4 className="text-sm font-semibold text-[var(--color-text-main)] mb-1">
                Awaiting Schema Generation
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] max-w-xs leading-relaxed mb-4">
                Describe your application idea in the chat on the left. The AI architect will design your MongoDB collections and render an interactive canvas here.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)]">
                <span>💡 Example: "A multi-vendor food delivery app"</span>
              </div>
            </div>
          ) : viewMode === 'canvas' ? (
            /* Visual React Flow Canvas */
            <SchemaCanvas collections={formattedCollections} isAiAssisted={true} />
          ) : viewMode === 'list' ? (
            /* Structured Tree List View */
            <div className="h-full overflow-y-auto p-4 custom-scrollbar space-y-4">
              {schema.map((col, idx) => (
                <div 
                  key={idx} 
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden shadow-sm"
                >
                  <div className="p-3 px-4 bg-[var(--color-bg-input)] border-b border-[var(--color-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database size={15} className="text-[var(--color-primary)]" />
                      <span className="font-mono text-sm font-semibold text-[var(--color-text-main)]">
                        {col.collection}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {(col.fields || []).length} fields
                    </Badge>
                  </div>

                  <div className="divide-y divide-[var(--color-border)]">
                    <div className="flex items-center justify-between p-2.5 px-4 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-card)]">
                      <div className="flex items-center gap-2">
                        <Key size={12} className="text-amber-500" />
                        <span className="font-mono text-[var(--color-text-main)] font-semibold">_id</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono">ObjectId (Primary Key)</Badge>
                    </div>

                    {(col.fields || []).map((field, fIdx) => 
                      renderFieldTree(field, 0, fIdx === col.fields.length - 1, `${col.collection}_${fIdx}`)
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* JSON Code Preview */
            <div className="h-full overflow-auto p-4 bg-[var(--color-bg-input)] font-mono text-xs text-[var(--color-text-main)] custom-scrollbar">
              <pre className="m-0 leading-relaxed text-[var(--color-primary)]">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database size={18} className="text-[var(--color-primary)]" />
                Confirm Collection Creation
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                You are about to automatically create <strong>{schema?.length || 0} MongoDB collection(s)</strong> in your project database.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)] space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              {(schema || []).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--color-text-main)] font-semibold">{c.collection}</span>
                  <span className="text-[var(--color-text-muted)]">{(c.fields || []).length} fields</span>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="secondary" size="sm" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={isInserting}
                onClick={() => {
                  setIsConfirmOpen(false);
                  onInsertAll();
                }}
                className="font-semibold"
              >
                {isInserting ? "Creating..." : "Confirm & Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
