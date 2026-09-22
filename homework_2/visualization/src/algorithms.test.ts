import { describe, expect, it } from 'vitest';
import { makeTrace, mergeTrace, parseNumbers, structureTrace, validateTrace } from './algorithms';
import { checks } from './checks';
import { boundsFor, fitViewport, graphForFrame } from './Diagram';

describe('Ввод', () => {
  it('разделители и пустой список', () => {
    expect(parseNumbers('-3, 0; +5')).toEqual([-3, 0, 5]);
    expect(parseNumbers('')).toEqual([]);
  });
  it.each(['1.2', '1e3', 'abc', '<script>', '9007199254740992', Array(17).fill('1').join(' ')])('отклоняет %s', text => expect(() => parseNumbers(text)).toThrow());
  it('проверяет условия задач', () => {
    expect(() => parseNumbers('', { empty: false })).toThrow();
    expect(() => makeTrace('validate', '1 1', '1 1', false)).toThrow();
    expect(() => makeTrace('validate', '1 2', '1 3', false)).toThrow();
    expect(() => makeTrace('merge_lists', '2 1', '3', false)).toThrow();
  });
});

describe('Стек и очередь', () => {
  it('сохраняет LIFO/FIFO и неизменность кадров', () => {
    const { frames } = structureTrace([4, 8, 15]);
    expect(frames.at(-1)?.output?.map(row => row.values)).toEqual([[15, 8, 4], [4, 8, 15]]);
    expect(frames[0].lanes[0].items).toEqual([]);
    expect(frames[1].lanes[0].items.map(node => node.value)).toEqual([4]);
    expect(frames.at(-1)?.variables.tail).toBe('None');
  });
  it('различает равные значения по ID', () => {
    const frame = structureTrace([2, 2, 2]).frames[3];
    const ids = frame.lanes.flatMap(lane => lane.items.map(node => node.id));
    expect(new Set(ids).size).toBe(6);
  });
});

function permutations(values: number[]): number[][] {
  if (!values.length) return [[]];
  return values.flatMap((v, i) => permutations(values.filter((_, j) => j !== i)).map(rest => [v, ...rest]));
}
function possibleOutputs(n: number): Set<string> {
  const outputs = new Set<string>();
  const visit = (i: number, stack: number[], out: number[]) => {
    if (out.length === n) outputs.add(out.join(','));
    if (i < n) visit(i + 1, [...stack, i], out);
    if (stack.length) visit(i, stack.slice(0, -1), [...out, stack.at(-1)!]);
  };
  visit(0, [], []);
  return outputs;
}

describe('Validate', () => {
  it('совпадает с независимым перебором операций для n ≤ 6', () => {
    for (let n = 1; n <= 6; n++) {
      const pushed = Array.from({ length: n }, (_, i) => i), allowed = possibleOutputs(n);
      for (const popped of permutations(pushed)) {
        expect(validateTrace(pushed, popped).frames.at(-1)?.result).toBe(allowed.has(popped.join(',')));
      }
    }
  });
  it('сохраняет исходные последовательности', () => {
    const pushed = [1, 2, 3], popped = [3, 1, 2];
    const { frames } = validateTrace(pushed, popped);
    expect(frames.at(-1)?.result).toBe(false);
    expect(frames.at(-1)?.consumed).toEqual([3, 1]);
    expect(pushed).toEqual([1, 2, 3]);
    expect(popped).toEqual([3, 1, 2]);
  });
});

describe.each([true, false])('Слияние dummy=%s', dummy => {
  it.each([
    [[], []], [[], [1, 2]], [[1, 2], []], [[1, 2, 4], [1, 3, 4]],
    [[-5, 0, 2], [-5, -1, 9]], [[2, 2], [2, 2, 2]],
  ])('сливает %j и %j', (a, b) => {
    const { frames } = mergeTrace(a, b, dummy);
    const result = frames.at(-1)!.lanes[2].items;
    expect(result.map(node => node.value)).toEqual([...a, ...b].sort((x, y) => x - y));
    const initial = frames[0].lanes.flatMap(lane => lane.items);
    expect(new Set(result.map(node => node.id))).toEqual(new Set(initial.map(node => node.id)));
    for (const node of result) expect(initial).toContain(node);
    for (const frame of frames) {
      const nodes = frame.lanes.flatMap(lane => lane.items);
      expect(nodes).toHaveLength(a.length + b.length);
      expect(new Set(nodes.map(node => node.id)).size).toBe(nodes.length);
    }
  });
  it('сохраняет устойчивость и tail при присоединении остатка', () => {
    const frame = mergeTrace([1, 2, 4], [1, 3, 4], dummy).frames.at(-1)!;
    expect(frame.lanes[2].items.map(node => node.id)).toEqual(['A1', 'B1', 'A2', 'B2', 'A3', 'B3']);
    expect(frame.variables.tail).toBe('A3');
    expect(frame.lanes[2].pointers.A3).toContain('tail');
  });
});

describe('Граф и браузерные проверки', () => {
  it('все связи ведут к существующим узлам, ID не повторяются', () => {
    const traces = [structureTrace([1, 1, 3]), validateTrace([1, 2, 3], [3, 1, 2]), mergeTrace([1, 2], [1, 3], true), mergeTrace([], [], false)];
    for (const trace of traces) for (const frame of trace.frames) for (const columns of [2, 5]) {
      const { nodes, edges } = graphForFrame(frame, trace.dummy, columns);
      const ids = new Set(nodes.map(node => node.id));
      expect(ids.size).toBe(nodes.length);
      edges.forEach(edge => { expect(ids.has(edge.source)).toBe(true); expect(ids.has(edge.target)).toBe(true); });
    }
  });
  it('примеры интерфейса проходят настоящие проверки', () => {
    Object.values(checks).flat().forEach(check => expect(check.run(), check.name).toBe(true));
  });
});

describe('Вписывание схемы в область', () => {
  const big = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
  const traces = [
    structureTrace(big(16)),
    validateTrace(big(16), [...big(16)].reverse()),
    mergeTrace(big(16), big(16).map((v, i) => v * 2 - (i % 2)), true),
    mergeTrace(big(16), big(16).map((v, i) => v * 2 - (i % 2)), false),
  ];
  it('не уменьшает схему больше единицы', () => {
    const { nodes } = graphForFrame(traces[0].frames[0], false, 4);
    expect(fitViewport(nodes, 4000, 4000).zoom).toBe(1);
  });
  it('любой узел остаётся внутри видимой области для всех размеров', () => {
    for (const trace of traces) {
      const { nodes } = graphForFrame(trace.frames.at(-1)!, trace.dummy, 4);
      for (const width of [280, 360, 520, 760, 1024, 1380]) for (const height of [300, 360, 460, 620, 760]) {
        const view = fitViewport(nodes, width, height);
        const { right, bottom } = boundsFor(nodes);
        expect(view.x).toBeGreaterThanOrEqual(0);
        expect(view.y).toBeGreaterThanOrEqual(0);
        expect(view.x + right * view.zoom).toBeLessThanOrEqual(width + 1e-6);
        expect(view.y + bottom * view.zoom).toBeLessThanOrEqual(height + 1e-6);
      }
    }
  });
  it('сохраняет отступ при плотной компоновке', () => {
    for (const columns of [2, 3, 5, 7]) {
      const { nodes } = graphForFrame(traces[2].frames.at(-1)!, true, columns);
      for (const width of [320, 480, 900]) {
        const view = fitViewport(nodes, width, 380, 30);
        expect(view.x).toBeGreaterThanOrEqual(29.9);
        expect(view.y).toBeGreaterThanOrEqual(29.9);
      }
    }
  });
});
