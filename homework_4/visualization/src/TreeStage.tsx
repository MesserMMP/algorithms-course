import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import type { Frame, Node } from './algorithms';
import { routeBetween } from './treeRoute';
import TreeEdge from './TreeEdge';

type Point = { node: Node; x: number; depth: number };
type Branch = { points: Point[]; left: number[]; right: number[] };
export const nodeWidth = (value: number) => Math.max(68, String(value).length * (String(value).length > 5 ? 9 : 10) + 20);

// Contours keep sibling subtrees apart without reserving space for missing nodes.
function branch(node: Node | null): Branch {
  if (!node) return {points: [], left: [], right: []};
  const a = branch(node.left), b = branch(node.right);
  let separation = 84;
  for (let d = 0; d < Math.min(a.right.length, b.left.length); d++) {
    separation = Math.max(separation, a.right[d] - b.left[d] + 22);
  }
  const shifts = [a.points.length && b.points.length ? -separation / 2 : -40, a.points.length && b.points.length ? separation / 2 : 40];
  const points: Point[] = [{node, x: 0, depth: 0}];
  [a, b].forEach((child, i) => child.points.forEach(p => points.push({...p, x: p.x + shifts[i], depth: p.depth + 1})));
  const left: number[] = [], right: number[] = [];
  points.forEach(p => {
    left[p.depth] = Math.min(left[p.depth] ?? Infinity, p.x - nodeWidth(p.node.value) / 2);
    right[p.depth] = Math.max(right[p.depth] ?? -Infinity, p.x + nodeWidth(p.node.value) / 2);
  });
  return {points, left, right};
}

export function treeLayout(root: Node | null) {
  const {points} = branch(root);
  const min = Math.min(0, ...points.map(p => p.x - nodeWidth(p.node.value) / 2));
  const max = Math.max(0, ...points.map(p => p.x + nodeWidth(p.node.value) / 2));
  return {points: points.map(p => ({...p, x: p.x - min + 24})), width: Math.max(280, max - min + 48), height: Math.max(260, Math.max(0, ...points.map(p => p.depth)) * 100 + 130)};
}

// One canonical curve for each connection.
export function edgeCurve(parent: Point, child: Point) {
  const start = [parent.x, parent.depth * 100 + 76];
  const end = [child.x, child.depth * 100 + 32];
  const c1 = [start[0], start[1] + 22], c2 = [end[0], end[1] - 22];
  return {start, end, c1, c2, d: `M ${start} C ${c1} ${c2} ${end}`};
}

const edgeKey = (a: string, b: string) => [a, b].sort().join(':');

export default function TreeStage({frame, previousActive, speed, selected, onSelect}: {frame: Frame; previousActive: string | null; speed: number; selected: string | null; onSelect: (id: string) => void}) {
  const layout = useMemo(() => treeLayout(frame.root), [frame.root]);
  const viewport = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [zoom, setZoom] = useState(1);
  const positions = new Map(layout.points.map(p => [p.node.id, p]));
  const route = routeBetween(frame.root, previousActive, frame.active);
  const routeEdges = new Map(route.slice(1).map((id, index) => [edgeKey(route[index], id), index]));
  const transition = useMemo(() => ({}), [frame, previousActive]);
  const [arrival, setArrival] = useState<object | null>(null);
  const onArrive = useCallback(() => setArrival(transition), [transition]);
  const arrived = reducedMotion || route.length < 2 || arrival === transition;
  const timing = {'--focus-duration': `${700 / speed}ms`, '--node-focus-duration': `${220 / speed}ms`} as CSSProperties;
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const area = viewport.current;
    const point = positions.get(frame.active ?? '');
    if (!area || !point) return;
    const reveal = () => {
      const x = point.x * zoom, y = (point.depth * 100 + 55) * zoom;
      const padding = Math.max(0, (area.clientWidth - layout.width * zoom) / 2);
      const halfWidth = nodeWidth(point.node.value) * zoom / 2 + 8;
      if (x + padding - halfWidth < area.scrollLeft || x + padding + halfWidth > area.scrollLeft + area.clientWidth) area.scrollLeft = x + padding - area.clientWidth / 2;
      if (y - 35 * zoom < area.scrollTop || y + 62 * zoom > area.scrollTop + area.clientHeight) area.scrollTop = y - area.clientHeight / 2;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(area);
    return () => observer.disconnect();
  }, [frame.active, layout, zoom]);
  function fit() {
    const area = viewport.current;
    if (area) setZoom(Math.max(.75, Math.min(1, (area.clientWidth - 16) / layout.width)));
  }
  return <div className="tree-stage">
    <div className="diagram-toolbar"><span>Схема дерева <small>Нажмите на узел, чтобы изучить его</small></span><div className="zoom-controls"><button aria-label="Уменьшить дерево" disabled={zoom <= .75} onClick={() => setZoom(z => Math.max(.75, +(z - .1).toFixed(2)))}><Minus size={15}/></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Увеличить дерево" disabled={zoom >= 1.5} onClick={() => setZoom(z => Math.min(1.5, +(z + .1).toFixed(2)))}><Plus size={15}/></button><button aria-label="Вписать дерево" onClick={fit}><Maximize2 size={15}/></button></div></div>
    <div className="tree-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Дерево: прокрутка и масштабирование">
      {!frame.root ? <div className="empty-tree"><span>∅</span><strong>Пустое дерево</strong><p>Нет узлов для посещения. Пустое дерево — корректное BST и сбалансированное дерево.</p></div> : <svg className="tree-svg" style={timing} width={layout.width * zoom} height={layout.height * zoom} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-label="Узлы и связи бинарного дерева">
        {layout.points.flatMap(p => ([['L', p.node.left], ['R', p.node.right]] as const).filter(([, child]) => child).map(([side, child]) => {
          const q = positions.get(child!.id)!;
          const curve = edgeCurve(p, q);
          const index = routeEdges.get(edgeKey(p.node.id, q.node.id)) ?? -1;
          // Keep the small caption beside the curve, clear of the travelling wave.
          const tangentX = 1.5 * (q.x - p.x), tangentY = 51;
          const tangentLength = Math.hypot(tangentX, tangentY);
          const labelX = (p.x + q.x) / 2 + (side === 'L' ? -1 : 1) * 13 * tangentY / tangentLength;
          const labelY = (curve.start[1] + curve.end[1]) / 2 - 13 * Math.abs(tangentX) / tangentLength;
          const description = `${side} — ${side === 'L' ? 'левый' : 'правый'} ребёнок узла ${p.node.value}`;
          return <g key={`${p.node.id}-${q.node.id}`}>
            <TreeEdge curve={curve} index={index} count={route.length - 1} upward={index >= 0 && route[index] === q.node.id} transitionKey={transition} onArrive={onArrive} speed={speed} reducedMotion={reducedMotion}/>
            <g className="branch-label" transform={`translate(${labelX},${labelY})`} role="img" aria-label={description}>
              <title>{description}</title>
              <text className="edge-label" textAnchor="middle" dominantBaseline="central">{side}</text>
            </g>
          </g>;
        }))}
        {layout.points.map(p => {
          const id = p.node.id, pending = frame.active === id && !arrived;
          const rank = pending ? -1 : frame.visited.indexOf(id), height = pending ? undefined : frame.heights[id];
          const state = pending ? 'pending' : frame.invalid === id ? 'invalid' : frame.active === id ? 'active' : rank >= 0 ? 'visited' : '';
          return <g key={id} role="button" tabIndex={0} aria-label={`Узел ${p.node.value}`} aria-pressed={selected === id} onClick={() => onSelect(id)} onKeyDown={e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); onSelect(id);}}} className={`tree-node ${state} ${selected === id ? 'selected' : ''}`} style={{transform: `translate(${p.x}px,${p.depth * 100 + 54}px)`}}>
            <title>{`Значение ${p.node.value}${height === undefined ? '' : `, высота ${height}`}`}</title>
            <rect x={-nodeWidth(p.node.value) / 2} y={-22} width={nodeWidth(p.node.value)} height={44} rx={14}/><text className={String(p.node.value).length > 5 ? 'small-value' : ''} y={4} textAnchor="middle" dominantBaseline="central">{p.node.value}</text>
            <path className="focus-tick" d="M -9 14 H 9" aria-hidden="true"/><g className="focus-ring" aria-hidden="true"><rect x={-nodeWidth(p.node.value) / 2 - 5} y={-27} width={nodeWidth(p.node.value) + 10} height={54} rx={18}/></g>
            {(height !== undefined || rank >= 0) && <g className={`node-metric ${height !== undefined ? 'node-label' : 'visit-badge'}`} transform={`translate(${nodeWidth(p.node.value) / 2 - 9},-12)`}>
              <title>{height !== undefined ? `Высота поддерева: ${height}` : `Порядок посещения: ${rank + 1}`}</title>
              <g className="metric-surface">
                <text textAnchor="end" dominantBaseline="central"><tspan className="metric-key">{height !== undefined ? 'h' : '№'}</tspan><tspan className="metric-value" dx={3}>{height ?? rank + 1}</tspan></text>
              </g>
            </g>}
          </g>;
        })}
      </svg>}
    </div>
    <div className="diagram-legend"><span><i className="dot active"/>Сейчас</span><span><i className="dot visited"/>Обработан</span><span><i className="dot invalid"/>Нарушение</span><small>Волна — переход · контур — текущий узел · L / R — дети · большая схема прокручивается</small></div>
  </div>;
}
