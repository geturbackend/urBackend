import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CollectionNode from './CollectionNode';
import { Database, Link2, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';

const nodeTypes = {
  collectionNode: CollectionNode,
};

export default function SchemaCanvas({ collections = [], isAiAssisted = false }) {
  // Convert collections list into React Flow Nodes and Edges with spacious layout
  const { initialNodes, initialEdges, totalFields, totalRelations } = useMemo(() => {
    const nodes = [];
    const edges = [];
    let fieldCount = 0;
    let relationCount = 0;

    const COLS = collections.length > 3 ? 3 : 2;
    const X_GAP = 420;
    const Y_GAP = 360;

    // Index map for smart routing
    const colIndexMap = {};
    collections.forEach((col, idx) => {
      colIndexMap[col.name] = {
        colX: (idx % COLS) * X_GAP + 50,
        colY: Math.floor(idx / COLS) * Y_GAP + 50,
        index: idx,
        col: idx % COLS,
        row: Math.floor(idx / COLS)
      };
    });

    collections.forEach((col, idx) => {
      const pos = colIndexMap[col.name] || { colX: (idx % COLS) * X_GAP + 50, colY: Math.floor(idx / COLS) * Y_GAP + 50 };
      const fields = col.model || col.fields || [];
      fieldCount += fields.length;

      nodes.push({
        id: col.name,
        type: 'collectionNode',
        position: { x: pos.colX, y: pos.colY },
        data: {
          name: col.name,
          fields,
          isLocked: col.name === 'users',
        },
      });

      // Find Ref fields and create clean relationship edges
      fields.forEach((field) => {
        const targetRef = field.ref || field.items?.ref;
        if ((field.type === 'Ref' || field.items?.type === 'Ref') && targetRef) {
          relationCount++;
          const targetPos = colIndexMap[targetRef];
          
          // Smart routing: if target is above/below in same column, route to top handle
          const useTopHandle = targetPos && targetPos.col === pos.col && targetPos.row !== pos.row;
          const targetHandle = useTopHandle ? `${targetRef}-target-top` : `${targetRef}-target`;

          edges.push({
            id: `edge-${col.name}-${field.key}-${targetRef}`,
            source: col.name,
            target: targetRef,
            sourceHandle: `${col.name}-${field.key}-ref`,
            targetHandle: targetHandle,
            type: 'smoothstep',
            animated: true,
            pathOptions: {
              borderRadius: 16,
              offset: 24,
            },
            label: `${field.key} → ${targetRef}`,
            labelStyle: { fill: 'var(--color-text-main)', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
            labelBgStyle: { fill: 'var(--color-bg-card)', fillOpacity: 0.95, stroke: 'var(--color-border)', strokeWidth: 1 },
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 6,
            style: { stroke: 'var(--color-primary)', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 16,
              height: 16,
              color: 'var(--color-primary)',
            },
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges, totalFields: fieldCount, totalRelations: relationCount };
  }, [collections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="relative w-full h-full min-h-[420px] bg-[var(--color-bg-main)] rounded-xl overflow-hidden select-none">
      {/* Top Overlay Stats Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2.5 bg-[var(--color-bg-card)]/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] shadow-md pointer-events-auto">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-main)] font-semibold">
          <Database size={13} className="text-[var(--color-primary)]" />
          <span>{collections.length} Collection{collections.length !== 1 ? 's' : ''}</span>
        </div>
        <span className="text-[var(--color-border)]">|</span>
        <div className="text-[11px] text-[var(--color-text-muted)] font-mono">
          {totalFields} Fields
        </div>
        {totalRelations > 0 && (
          <>
            <span className="text-[var(--color-border)]">|</span>
            <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
              <Link2 size={11} />
              <span>{totalRelations} Relation{totalRelations !== 1 ? 's' : ''}</span>
            </div>
          </>
        )}
        {isAiAssisted && (
          <Badge variant="purple" className="text-[9px] px-1.5 py-0 h-4 ml-1 flex items-center gap-1">
            <Sparkles size={9} />
            <span>AI Visualizer</span>
          </Badge>
        )}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={1.6}
        nodesDraggable={true}
        elementsSelectable={true}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.2}
          color="var(--color-border)"
          className="opacity-40"
        />
        <Controls
          className="!bg-[var(--color-bg-card)] !border !border-[var(--color-border)] !rounded-lg !shadow-lg [&>button]:!bg-[var(--color-bg-card)] [&>button]:!border-b [&>button]:!border-[var(--color-border)] [&>button]:!text-[var(--color-text-main)] [&>button:hover]:!bg-[var(--color-surface-hover)]"
        />
        <MiniMap
          nodeColor="var(--color-bg-input)"
          maskColor="rgba(0, 0, 0, 0.4)"
          className="!bg-[var(--color-bg-card)] !border !border-[var(--color-border)] !rounded-lg !shadow-md"
          zoomable
          pannable
        />
      </ReactFlow>

      <style>{`
        .react-flow__node {
          cursor: grab;
        }
        .react-flow__node:active {
          cursor: grabbing;
        }
        .react-flow__edge-path {
          stroke: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
