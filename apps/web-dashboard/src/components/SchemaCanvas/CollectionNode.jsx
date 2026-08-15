import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Key, Link2, Layers, Calendar, Type, Hash, ToggleLeft, Brackets } from 'lucide-react';
import { Badge } from '../ui/badge';

const getTypeIcon = (type) => {
  switch (type) {
    case 'String': return <Type size={12} className="text-emerald-500 shrink-0" />;
    case 'Number': return <Hash size={12} className="text-blue-500 shrink-0" />;
    case 'Boolean': return <ToggleLeft size={12} className="text-amber-500 shrink-0" />;
    case 'Date': return <Calendar size={12} className="text-purple-500 shrink-0" />;
    case 'Ref': return <Link2 size={12} className="text-cyan-500 shrink-0" />;
    case 'Object': return <Layers size={12} className="text-orange-500 shrink-0" />;
    case 'Array': return <Brackets size={12} className="text-pink-500 shrink-0" />;
    default: return <Type size={12} className="text-gray-400 shrink-0" />;
  }
};

const getTypeVariant = (type) => {
  switch (type) {
    case 'String': return 'success';
    case 'Number': return 'blue';
    case 'Boolean': return 'warning';
    case 'Date': return 'purple';
    case 'Ref': return 'secondary';
    case 'Object': return 'outline';
    case 'Array': return 'outline';
    default: return 'outline';
  }
};

function CollectionNode({ data, selected }) {
  const { name, fields = [], isLocked } = data;

  return (
    <div
      className={`min-w-[290px] max-w-[360px] rounded-xl border bg-[var(--color-bg-card)] shadow-2xl transition-all duration-150 relative select-none ${
        selected
          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25 shadow-2xl'
          : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
      }`}
    >
      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${name}-target`}
        className="!w-3 !h-3 !bg-[var(--color-primary)] !border-2 !border-[var(--color-bg-card)] -left-[6px] transition-transform hover:scale-125"
      />

      {/* Target Handle (Top) - Alternative routing anchor */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${name}-target-top`}
        className="!w-3 !h-3 !bg-[var(--color-primary)] !border-2 !border-[var(--color-bg-card)] -top-[6px] transition-transform hover:scale-125"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-input)] px-4 py-3 rounded-t-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--color-primary)]/15 text-[var(--color-primary)] shrink-0">
            <Database size={14} />
          </div>
          <span className="font-bold text-xs text-[var(--color-text-main)] truncate font-mono">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLocked && (
            <Badge variant="warning" className="text-[10px] px-2 py-0.5 h-5 font-semibold">
              Auth
            </Badge>
          )}
          <span className="text-[11px] text-[var(--color-text-muted)] font-mono font-medium">
            {fields.length} fields
          </span>
        </div>
      </div>

      {/* Fields List */}
      <div className="p-2.5 divide-y divide-[var(--color-border)]/50 max-h-[320px] overflow-y-auto custom-scrollbar">
        {/* Default _id field */}
        <div className="flex items-center justify-between py-2 px-3 text-xs text-[var(--color-text-muted)] rounded-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <Key size={13} className="text-amber-500 shrink-0" />
            <span className="font-mono text-xs text-[var(--color-text-main)] font-semibold truncate">_id</span>
          </div>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 font-mono">
            ObjectId (PK)
          </Badge>
        </div>

        {/* Dynamic Fields */}
        {fields.map((field) => {
          const isRef = field.type === 'Ref';
          return (
            <div
              key={field.key}
              className="relative flex items-center justify-between py-2 px-3 text-xs hover:bg-[var(--color-surface-hover)] rounded-md group transition-colors my-0.5"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getTypeIcon(field.type)}
                <span className="font-mono text-xs text-[var(--color-text-main)] font-medium truncate">
                  {field.key}
                </span>
                {field.required && (
                  <span className="text-red-400 font-bold text-xs" title="Required field">*</span>
                )}
                {field.unique && (
                  <span className="text-[10px] text-amber-500 font-mono font-bold" title="Unique constraint">[U]</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Badge variant={getTypeVariant(field.type)} className="text-[10px] px-2 py-0.5 h-5 font-mono">
                  {field.type === 'Ref' && field.ref
                    ? `Ref → ${field.ref}`
                    : field.type === 'Array' && field.items?.type
                    ? `[${field.items.type}]`
                    : field.type}
                </Badge>

                {/* Source Handle for outgoing Ref relations */}
                {isRef && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${name}-${field.key}-ref`}
                    className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-[var(--color-bg-card)] -right-[6px] transition-transform hover:scale-125"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(CollectionNode);
