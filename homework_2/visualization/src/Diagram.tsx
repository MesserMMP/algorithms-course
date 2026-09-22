import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background, BackgroundVariant, Controls, Handle, MarkerType, Position,
  ReactFlow, ReactFlowProvider, useReactFlow,
} from '@xyflow/react';
import type { Edge, Node, NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import { Maximize2, Minimize2, MousePointer2, X } from 'lucide-react';
import type { Frame, Item } from './algorithms';

type DiagramData = {
  kind: 'value' | 'caption' | 'null'; label: string; value?: number;
  tone?: string; pointers?: string[]; active?: boolean; note?: string;
};
type DiagramNode = Node<DiagramData, 'linked'>;

const NODE_WIDTH = 132;
const NODE_HEIGHT = 78;
const COLUMN_STEP = 174;
const ROW_STEP = 136;
const PADDING = 30;

const LinkedNode = memo(function LinkedNode({ data, selected }: NodeProps<DiagramNode>) {
  if (data.kind === 'caption') return <div className="lane-caption"><b>{data.label}</b><span>{data.note}</span></div>;
  if (data.kind === 'null') return <div className="null-node"><Handle type="target" position={Position.Left} /><span>None</span></div>;
  return <motion.div animate={{ scale: data.active ? 1.025 : 1 }} className={`linked-node ${data.tone ?? 'neutral'} ${selected ? 'selected' : ''} ${data.active ? 'active' : ''}`}>
    <div className="node-pointers">{data.pointers?.map(label => <span key={label}>{label}<i>↓</i></span>)}</div>
    <Handle type="target" position={Position.Left} />
    <div className="node-id">{data.label}</div>
    <div className="node-body"><strong className={String(data.value).length > 6 ? 'long-number' : ''}>{data.label === 'dummy' ? '∅' : data.value}</strong><span>next<small>→</small></span></div>
    <Handle type="source" position={Position.Right} />
  </motion.div>;
});
const nodeTypes = { linked: LinkedNode };

export function graphForFrame(frame: Frame, dummy: boolean, columns: number): { nodes: DiagramNode[]; edges: Edge[]; height: number } {
  const nodes: DiagramNode[] = [], edges: Edge[] = [];
  let y = 0;
  for (const lane of frame.lanes) {
    nodes.push({ id: `label-${lane.id}`, type: 'linked', position: { x: 0, y }, data: { kind: 'caption', label: lane.label, note: lane.note }, selectable: false, focusable: false, style: { width: Math.min(460, columns * COLUMN_STEP - 42), height: 28 } });
    const row: Item[] = dummy && lane.id === 'out' ? [{ id: 'dummy', value: 0, tone: 'neutral' }, ...lane.items] : lane.items;
    row.forEach((item, i) => {
      nodes.push({ id: item.id, type: 'linked', position: { x: (i % columns) * COLUMN_STEP, y: y + 64 + Math.floor(i / columns) * ROW_STEP },
        data: { kind: 'value', label: item.id, value: item.value, tone: item.tone, pointers: lane.pointers[item.id] ?? [], active: frame.active === item.id },
        ariaLabel: `Узел ${item.id}, значение ${item.value}${lane.pointers[item.id]?.length ? ', ' + lane.pointers[item.id].join(', ') : ''}`,
        style: { width: NODE_WIDTH, height: NODE_HEIGHT },
      });
    });
    const end = row.length;
    nodes.push({ id: `null-${lane.id}`, type: 'linked', position: { x: (end % columns) * COLUMN_STEP, y: y + (end ? 85 : 32) + Math.floor(end / columns) * ROW_STEP }, data: { kind: 'null', label: 'None' }, selectable: false, focusable: false, style: { width: 70, height: 36 } });
    row.forEach((item, i) => edges.push({ id: `next-${item.id}`, source: item.id, target: row[i + 1]?.id ?? `null-${lane.id}`, type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#a7b4c6', width: 17, height: 17 },
      style: { stroke: '#a7b4c6', strokeWidth: 1.6 },
    }));
    y += end ? 180 + Math.floor(end / columns) * ROW_STEP : 86;
  }
  return { nodes, edges, height: y };
}

export function boundsFor(nodes: DiagramNode[]): { right: number; bottom: number } {
  return {
    right: Math.max(1, ...nodes.map(node => node.position.x + Number(node.style?.width ?? NODE_WIDTH))),
    bottom: Math.max(1, ...nodes.map(node => node.position.y + Number(node.style?.height ?? NODE_HEIGHT))),
  };
}

export function fitViewport(nodes: DiagramNode[], width: number, height: number, padding = PADDING) {
  const { right, bottom } = boundsFor(nodes);
  const availableWidth = Math.max(40, width - padding * 2);
  const availableHeight = Math.max(40, height - padding * 2);
  const zoom = Math.max(0.01, Math.min(1, availableWidth / right, availableHeight / bottom));
  return { x: (width - right * zoom) / 2, y: (height - bottom * zoom) / 2, zoom, right, bottom };
}

function FitFrame({ nodes, width, height, onZoom }: { nodes: DiagramNode[]; width: number; height: number; onZoom: (zoom: number) => void }) {
  const { setViewport, viewportInitialized } = useReactFlow();
  useEffect(() => {
    if (!viewportInitialized || !width || !height || !nodes.length) return;
    const view = fitViewport(nodes, width, height);
    onZoom(view.zoom);
    const id = requestAnimationFrame(() => {
      void setViewport({ x: view.x, y: view.y, zoom: view.zoom }, { duration: 0 });
    });
    return () => cancelAnimationFrame(id);
  }, [nodes, viewportInitialized, setViewport, width, height, onZoom]);
  return null;
}

export default function Diagram({ frame, dummy }: { frame: Frame; dummy: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [columns, setColumns] = useState(4);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window === 'undefined' ? 900 : window.innerHeight));
  const [fitZoom, setFitZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ width, height });
      setColumns(Math.max(2, Math.min(expanded ? 7 : 5, Math.floor((width - 35) / COLUMN_STEP))));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [expanded]);

  const graph = useMemo(() => graphForFrame(frame, dummy, columns), [frame, dummy, columns]);
  const naturalHeight = graph.height + 24;
  const maxHeight = Math.max(320, Math.min(720, viewportHeight * 0.68));
  const height = Math.max(300, Math.min(maxHeight, naturalHeight));
  const chosen = graph.nodes.find(node => node.id === selected && node.data.kind === 'value');
  const next = graph.edges.find(edge => edge.source === selected)?.target;
  const zoomedOut = fitZoom < 0.6;

  return <>
    {expanded && <div className="diagram-backdrop" onClick={() => setExpanded(false)} aria-hidden="true" />}
    <div className={`diagram-block ${expanded ? 'expanded' : ''}`}>
      <div ref={container} className="diagram" style={expanded ? undefined : { height }} aria-label="Связные списки: узлы и ссылки next">
        <ReactFlowProvider>
          <ReactFlow<DiagramNode> nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes}
            nodesDraggable={false} nodesConnectable={false} edgesFocusable={false} deleteKeyCode={null}
            onNodeClick={(_, node) => { if (node.data.kind === 'value') setSelected(node.id); }}
            onPaneClick={() => setSelected(null)} minZoom={0.01} maxZoom={2}
            zoomOnScroll={false} preventScrolling={false} zoomOnDoubleClick={false}
            ariaLabelConfig={{ 'controls.zoomIn.ariaLabel': 'Увеличить', 'controls.zoomOut.ariaLabel': 'Уменьшить', 'controls.fitView.ariaLabel': 'Показать весь список' }}>
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#d9e0eb" />
            <Controls showInteractive={false} position="bottom-right" />
            <FitFrame nodes={graph.nodes} width={box.width} height={box.height} onZoom={setFitZoom} />
          </ReactFlow>
        </ReactFlowProvider>
        <button className="icon-button diagram-expand" onClick={() => setExpanded(value => !value)} aria-label={expanded ? 'Свернуть схему' : 'Развернуть схему на весь экран'} title={expanded ? 'Свернуть' : 'На весь экран'}>{expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
        {!expanded && zoomedOut && <span className="diagram-zoom" role="status">Показано целиком · {Math.round(fitZoom * 100)}%</span>}
      </div>
      <div className="node-inspector" aria-live="polite">
        {chosen ? <><span className={`mini-dot ${chosen.data.tone}`} /><b>{chosen.id}</b><code>value = {chosen.id === 'dummy' ? '0' : chosen.data.value}</code><code>next = {next?.startsWith('null-') ? 'None' : next}</code><button className="icon-button" aria-label="Снять выбор узла" onClick={() => setSelected(null)}><X size={14} /></button></> : <><MousePointer2 size={14} /><span>Выберите узел, чтобы посмотреть значение и связь</span></>}
      </div>
      {dummy || frame.lanes.some(lane => lane.id === 'out') ? <p className="diagram-note">Показаны выбранный префикс и оставшиеся части входов. Временные ссылки между ними опущены.</p> : null}
    </div>
  </>;
}