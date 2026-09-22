import { mergeTrace, structureTrace, validateTrace } from './algorithms';
import type { TaskId } from './algorithms';
export type Check = { name: string; input: string; expected: string; run: () => boolean };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export const checks: Record<TaskId, Check[]> = {
  stack_vs_queue: [
    { name: 'LIFO / FIFO', input: '[4, 8, 15]', expected: '[15, 8, 4] / [4, 8, 15]', run: () => equal(structureTrace([4, 8, 15]).frames.at(-1)?.output?.map(x => x.values), [[15, 8, 4], [4, 8, 15]]) },
    { name: 'Пустая структура', input: '[]', expected: '[] / []', run: () => structureTrace([]).frames.at(-1)!.lanes.every(l => !l.items.length) },
    { name: 'Повторы', input: '[2, 2, -1]', expected: '[-1, 2, 2] / [2, 2, -1]', run: () => equal(structureTrace([2, 2, -1]).frames.at(-1)?.output?.map(x => x.values), [[-1, 2, 2], [2, 2, -1]]) },
    { name: 'Один элемент', input: '[7]', expected: '[7] / [7]', run: () => equal(structureTrace([7]).frames.at(-1)?.output?.map(x => x.values), [[7], [7]]) },
  ],
  validate: [
    { name: 'Пример 1', input: '[1,2,3,4,5] → [1,3,5,4,2]', expected: 'True', run: () => validateTrace([1,2,3,4,5], [1,3,5,4,2]).frames.at(-1)?.result === true },
    { name: 'Пример 2', input: '[1,2,3] → [3,1,2]', expected: 'False', run: () => validateTrace([1,2,3], [3,1,2]).frames.at(-1)?.result === false },
    { name: 'Один элемент', input: '[7] → [7]', expected: 'True', run: () => validateTrace([7], [7]).frames.at(-1)?.result === true },
    { name: 'Обратный порядок', input: '[1,2,3,4] → [4,3,2,1]', expected: 'True', run: () => validateTrace([1,2,3,4], [4,3,2,1]).frames.at(-1)?.result === true },
  ],
  merge_lists: [true, false].flatMap(dummy => [
    { name: dummy ? 'С dummy' : 'Без dummy', input: '[1,2,4] + [1,3,4]', expected: '[1,1,2,3,4,4]', run: () => equal(mergeTrace([1,2,4], [1,3,4], dummy).frames.at(-1)!.lanes[2].items.map(x => x.value), [1,1,2,3,4,4]) },
    { name: dummy ? 'Пустые · с dummy' : 'Пустые · без dummy', input: '[] + []', expected: 'None', run: () => mergeTrace([], [], dummy).frames.at(-1)!.lanes[2].items.length === 0 },
  ]),
};
