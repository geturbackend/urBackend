import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Key, Link2, Layers, Calendar, Type, Hash, ToggleLeft, Brackets } from 'lucide-react';
import { Badge } from '../ui/badge';

const getTypeIcon = (type) => {
  switch (type) {
    case 'String': return <Type size={11} className="text-emerald-500" />;
    case 'Number': return <Hash size={11} className="text-blue-500" />;
    case 'Boolean': return <ToggleLeft size={11} className="text-amber-500" />;
    case 'Date': return <Calendar size={11} className="text-purple-500" />;
    case 'Ref': return <Link2 size={11} className="text-cyan-500" />;
    case 'Object': return <Layers size={11} className="text-orange-500" />;
    case 'Array': return <Brackets size={11} className="text-pink-500" />;
    default: return <Type size={11} className="text-gray-400" />;
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
      className={`min-w-[240px] max-w-[320px] rounded-lg border bg-[var(--color-bg-card)] shadow-md transition-all duration-150 ${
        selected
          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-lg'
          : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
      }`}
    >
      {/* Target Handle for incoming Ref relations */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${name}-target`}
        className="!w-2.5 !h-2.5 !bg-[var(--color-primary)] !border-2 !border-[var(--color-bg-card)] -left-[6px]"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-input)] px-3 py-2 rounded-t-lg">
        <div className="flex items-center gap-2 min-w-0">
          <Database size={14} className="text-[var(--color-primary)] shrink-0" />
          <span className="font-semibold text-xs text-[var(--color-text-main)] truncate font-mono">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isLocked && (
            <Badge variant="warning" className="text-[9px] px-1 py-0 h-4">
              System
            </Badge>
          )}
          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
            {fields.length} field{fields.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Fields List */}
      <div className="p-1.5 divide-y divide-[var(--color-border)]/40 max-h-[280px] overflow-y-auto custom-scrollbar">
        {/* Default _id field */}
        <div className="flex items-center justify-between py-1 px-1.5 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Key size={11} className="text-amber-500 shrink-0" />
            <span className="font-mono text-[11px] text-[var(--color-text-main)] truncate">_id</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono">
            ObjectId (PK)
          </Badge>
        </div>

        {/* Dynamic Fields */}
        {fields.map((field) => {
          const isRef = field.type === 'Ref';
          return (
            <div
              key={field.key}
              className="relative flex items-center justify-between py-1 px-1.5 text-xs hover:bg-[var(--color-surface-hover)] rounded-sm group transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {getTypeIcon(field.type)}
                <span className="font-mono text-[11px] text-[var(--color-text-main)] truncate">
                  {field.key}
                </span>
                {field.required && (
                  <span className="text-red-400 font-bold text-[10px]" title="Required field">*</span>
                )}
                {field.unique && (
                  <span className="text-[9px] text-amber-500 font-mono" title="Unique constraint">[U]</span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                <Badge variant={getTypeVariant(field.type)} className="text-[9px] px-1 py-0 h-4 font-mono">
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
                    className="!w-2 !h-2 !bg-cyan-500 !border-2 !border-[var(--color-bg-card)] -right-[5px]"
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
