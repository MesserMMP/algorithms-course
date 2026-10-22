import { describe, expect, it } from 'vitest';
import { nodeWidth, treeLayout } from './TreeStage';
import { buildBST, parseTree, parseValues } from './algorithms';
import type { Node } from './algorithms';
import { examples } from './examples';

type Shape = null | { left: Shape; right: Shape };
const shapeCache = new Map<number, Shape[]>([[0, [null]]]);
function shapes(size: number): Shape[] {
  if (shapeCache.has(size)) return shapeCache.get(size)!;
  const result: Shape[] = [];
  for (let leftSize = 0; leftSize < size; leftSize++) {
    for (const left of shapes(leftSize)) for (const right of shapes(size - leftSize - 1)) result.push({ left, right });
  }
  shapeCache.set(size, result); return result;
}

function fromShape(shape: Shape): Node | null {
  let sequence = 0;
  const node = (current: Shape): Node | null => {
    if (!current) return null;
    const value = sequence++;
    return { id: `node${value}`, value, left: node(current.left), right: node(current.right) };
  };
  return node(shape);
}

/** Labels sit above the card and extend 5px past its right edge. */
function assertLayout(root: Node | null): void {
  const layout = treeLayout(root);
  expect(Number.isFinite(layout.width)).toBe(true); expect(Number.isFinite(layout.height)).toBe(true);
  expect(layout.width).toBeGreaterThanOrEqual(280); expect(layout.height).toBeGreaterThanOrEqual(260);
  const levels = new Map<number, typeof layout.points>();
  const positions = new Map(layout.points.map(point => [point.node.id, point]));
  expect(positions.size).toBe(layout.points.length);
  for (const point of layout.points) {
    const centerY = point.depth * 100 + 54;
    const halfWidth = nodeWidth(point.node.value) / 2;
    expect(Number.isFinite(point.x)).toBe(true);
    expect(point.x - halfWidth).toBeGreaterThanOrEqual(0);
    expect(point.x + halfWidth + 5).toBeLessThanOrEqual(layout.width);
    expect(centerY - 31).toBeGreaterThanOrEqual(0);
    expect(centerY + 48).toBeLessThanOrEqual(layout.height);
    expect(Number.isInteger(point.depth)).toBe(true);
    levels.set(point.depth, [...(levels.get(point.depth) ?? []), point]);
    for (const [side, child] of [['left', point.node.left], ['right', point.node.right]] as const) {
      if (!child) continue;
      const childPoint = positions.get(child.id)!;
      expect(childPoint.depth).toBe(point.depth + 1);
      if (side === 'left') expect(childPoint.x).toBeLessThan(point.x);
      else expect(childPoint.x).toBeGreaterThan(point.x);
    }
  }
  for (const level of levels.values()) {
    level.sort((a, b) => a.x - b.x);
    for (let i = 1; i < level.length; i++) {
      // Keep a visible gap between card edges, not just a mathematically nonzero one.
      const leftEdge = level[i].x - nodeWidth(level[i].node.value) / 2;
      const previousRightEdge = level[i - 1].x + nodeWidth(level[i - 1].node.value) / 2;
      expect(leftEdge - previousRightEdge).toBeGreaterThanOrEqual(22);
    }
  }
}

describe('Раскладка бинарного дерева', () => {
  it('все 2056 форм с 0–8 узлами: карточки внутри схемы и без наложений', () => {
    let checked = 0;
    for (let size = 0; size <= 8; size++) for (const shape of shapes(size)) {
      const root = fromShape(shape);
      expect(treeLayout(root).points).toHaveLength(size);
      assertLayout(root); checked++;
    }
    expect(checked).toBe(2056);
  });
  it('500 разных форм максимального размера 15 узлов', () => {
    let seed = 20261022;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
    const randomShape = (size: number): Shape => {
      if (size === 0) return null;
      const leftSize = Math.floor(random() * size);
      return { left: randomShape(leftSize), right: randomShape(size - 1 - leftSize) };
    };
    for (let i = 0; i < 500; i++) {
      const root = fromShape(randomShape(15));
      expect(treeLayout(root).points).toHaveLength(15); assertLayout(root);
    }
  });
  it('длинные safe integers и разные ширины карточек на всех малых формах и полном дереве', () => {
    const values = [Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, 1, -1, 12345, -12345, 1234567890, -1234567890];
    const varyValues = (root: Node | null): Node | null => {
      let sequence = 0;
      const replace = (node: Node | null): Node | null => node && { ...node, value: values[sequence++ % values.length], left: replace(node.left), right: replace(node.right) };
      return replace(root);
    };
    for (let size = 0; size <= 8; size++) for (const shape of shapes(size)) assertLayout(varyValues(fromShape(shape)));
    const full = buildBST([8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15]);
    assertLayout(varyValues(full));
    const allWide = parseTree(JSON.stringify(Array(15).fill(-Number.MAX_SAFE_INTEGER)));
    assertLayout(allWide);
    const bottomLevel = treeLayout(allWide).points.filter(point => point.depth === 3);
    expect(bottomLevel).toHaveLength(8);
  });
  it('левые, правые и зигзагообразные цепочки из 15 узлов', () => {
    for (const mode of ['left', 'right', 'zigzag'] as const) {
      let root: Node | null = null;
      for (let i = 0; i < 15; i++) {
        const left = mode === 'left' || mode === 'zigzag' && i % 2 === 0;
        root = { id: `n${i}`, value: i, left: left ? root : null, right: left ? null : root };
      }
      const layout = treeLayout(root);
      expect(layout.points).toHaveLength(15); expect(layout.height).toBe(1530); assertLayout(root);
    }
  });
  it('все готовые примеры стабильны и не изменяют исходные узлы', () => {
    for (const [task, list] of Object.entries(examples)) for (const example of list) {
      const root = task === 'traversal' ? buildBST(parseValues(example.input)) : parseTree(example.input);
      const before = JSON.stringify(root), first = treeLayout(root);
      assertLayout(root);
      expect(treeLayout(root)).toEqual(first); expect(JSON.stringify(root)).toBe(before);
    }
  });
});
