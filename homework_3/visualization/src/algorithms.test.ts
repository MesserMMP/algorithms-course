import { examples } from "./examples";

import { describe, expect, it } from 'vitest';
import { anagramFrames, bucketIndex, hashFrames, parseNumbers, parseOperations, parseTarget, parseWords, signature, twoSumFrames } from './algorithms';

describe('Валидация', () => {
  it('числа, границы и неправильные типы', () => {
    expect(parseNumbers('[-1000000, 0, 1000000]')).toEqual([-1000000, 0, 1000000]);
    for (const s of ['null', '{}', '[true]', '[1.5]', '[1000001]', '["2"]', 'NaN', JSON.stringify(Array(33).fill(0))]) expect(() => parseNumbers(s)).toThrow();
    for (const s of ['', '1.5', 'Infinity', '2000001', '1e2']) expect(() => parseTarget(s)).toThrow();
    expect(parseTarget('-2000000')).toBe(-2000000);
    expect(parseNumbers('[]')).toEqual([]);
  });
  it('строки, Unicode и ограничения интерфейса', () => {
    expect(parseWords('["", "🙂"]')).toEqual(['', '🙂']);
    for (const s of ['[1]', 'null', JSON.stringify(['a'.repeat(33)]), JSON.stringify(Array(25).fill('a'))]) expect(() => parseWords(s)).toThrow();
    expect(signature('🙂\ue000')).toBe('\ue000🙂');
  });
  it('операции', () => {
    expect(parseOperations('')).toEqual([]);
    expect(parseOperations('set -1 two words\nget -1\ndelete -1')).toHaveLength(3);
    for (const s of ['set 1', 'get 1 extra', 'delete 1 extra', 'set 1.5 a', 'get 1000001', 'set 1 ' + 'x'.repeat(41), Array(25).fill('get 0').join('\n')]) expect(() => parseOperations(s)).toThrow();
  });
});
describe('Two sum', () => {
  it('эталоны и отсутствие пары', () => {
    expect(twoSumFrames([1, 3, 4, 10], 7).at(-1)!.result).toBe('1 2');
    expect(twoSumFrames([5, 5, 1, 4], 10).at(-1)!.result).toBe('0 1');
    expect(twoSumFrames([0, 0], 0).at(-1)!.result).toBe('0 1');
    expect(twoSumFrames([-8, 0, 8], 0).at(-1)!.result).toBe('0 2');
    for (const arr of [[], [5], [1, 2]]) expect(twoSumFrames(arr, 10).at(-1)!.result).toBe('ValueError');
  });
  it('полный перебор малых входов по независимому эталону', () => {
    for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) for (let c = -3; c <= 3; c++) for (let k = -6; k <= 6; k++) {
      const arr = [a, b, c];
      const pairs: string[] = [];
      for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (arr[i] + arr[j] === k) pairs.push(`${i} ${j}`);
      const result = twoSumFrames(arr, k).at(-1)!.result;
      if (pairs.length) expect(pairs).toContain(result); else expect(result).toBe('ValueError');
    }
  });
  it('ранние кадры не меняются', () => {
    const frames = twoSumFrames([1, 3, 4, 10], 7);
    expect(frames[0].pairs).toEqual([]);
    expect(frames[2].pairs).toEqual([['1', '0']]);
  });
});
describe('Anagrams', () => {
  it('пример, пустые, повторы, регистр, Unicode', () => {
    expect(anagramFrames(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']).at(-1)!.groups.map(g => g[1])).toEqual([['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]);
    expect(anagramFrames([]).at(-1)!.groups).toEqual([]);
    expect(anagramFrames(['', '', 'Ab', 'ab', '🙂a', 'a🙂']).at(-1)!.groups.map(g => g[1])).toEqual([['', ''], ['Ab'], ['ab'], ['🙂a', 'a🙂']]);
  });
  it('не меняет предыдущие кадры и вход', () => {
    const words = ['ab', 'ba']; const frames = anagramFrames(words);
    expect(frames[1].groups).toEqual([]);
    expect(frames[2].groups[0][1]).toEqual(['ab']);
    expect(frames[3].groups[0][1]).toEqual(['ab']);
    expect(words).toEqual(['ab', 'ba']);
  });
});
describe('Хеш-таблица', () => {
  it('Python modulo и специальный hash(-1)', () => {
    expect(bucketIndex(-1, 4)).toBe(2); expect(bucketIndex(-2, 4)).toBe(2); expect(bucketIndex(-5, 4)).toBe(3);
  });
  it('коллизии, обновление, рост, поиск, удаление', () => {
    const frames = hashFrames(parseOperations('set 1 a\nset 5 b\nset 9 c\nset 1 updated\nset 2 d\nget 5\ndelete 1\nget 1'));
    expect(frames[0].buckets.every(b => !b.length)).toBe(true);
    expect(frames.find(f => f.size === 3)!.buckets[1]).toEqual([[1, 'a'], [5, 'b'], [9, 'c']]);
    expect(frames.some(f => f.result === 'b')).toBe(true);
    const end = frames.at(-1)!;
    expect(end.buckets).toHaveLength(8); expect(end.size).toBe(3); expect(end.result).toBe('KeyError(1)');
    expect(end.buckets.flat()).toEqual(expect.arrayContaining([[5, 'b'], [9, 'c'], [2, 'd']]));
  });
  it('детерминированный длинный сценарий против Map', () => {
    const ops = Array.from({length: 500}, (_, i) => ({op: (i % 3 ? 'set' : 'delete') as 'set' | 'delete', key: i * 7 % 31 - 15, value: String(i)}));
    const oracle = new Map<number, string>();
    for (const o of ops) if (o.op === 'set') oracle.set(o.key, o.value); else oracle.delete(o.key);
    const end = hashFrames(ops).at(-1)!;
    expect(new Map(end.buckets.flat())).toEqual(oracle);
    expect(end.size).toBe(oracle.size);
  });
});

describe('Длинные демонстрационные примеры', () => {
  it('Two sum: единственная пара ближе к концу', () => {
    for (const e of examples.two_sum.slice(0, 2)) {
      const arr = parseNumbers(e.input), k = parseTarget(e.target!);
      const pairs = arr.flatMap((v, i) => arr.slice(i + 1).flatMap((w, j) => v + w === k ? [[i, i + j + 1]] : []));
      expect(pairs).toHaveLength(1);
      expect(pairs[0][1]).toBe(arr.length - 1);
      expect(twoSumFrames(arr, k)).toHaveLength(arr.length * 2 + 1);
    }
  });
  it('Anagrams: отдельные шаги подписи и добавления, без потери слов', () => {
    for (const e of examples.anagrams) {
      const words = parseWords(e.input), frames = anagramFrames(words);
      expect(frames).toHaveLength(words.length * 2 + 2);
      expect(frames.at(-1)!.groups.flatMap(g => g[1]).sort()).toEqual([...words].sort());
      words.forEach((_, i) => {
        expect(frames[i * 2 + 1].groups.flatMap(g => g[1])).toHaveLength(i);
        expect(frames[i * 2 + 2].groups.flatMap(g => g[1])).toHaveLength(i + 1);
      });
    }
  });
  it('Hash table: все сценарии сверяются с Map', () => {
    for (const e of examples.hash_table) {
      const ops = parseOperations(e.input), expected = new Map<number, string>();
      for (const op of ops) if (op.op === 'set') expected.set(op.key, op.value); else if (op.op === 'delete') expected.delete(op.key);
      const last = hashFrames(ops).at(-1)!;
      expect(new Map(last.buckets.flat())).toEqual(expected);
      expect(last.size).toBe(expected.size);
    }
    const frames = hashFrames(parseOperations(examples.hash_table[0].input));
    expect(frames.filter(f => f.title.startsWith('Расширяем'))).toHaveLength(1);
    expect(frames.length - 1).toBeGreaterThanOrEqual(15);
    expect(frames.length - 1).toBeLessThanOrEqual(25);
  });
});

// Готовые расширенные примеры должны оставаться в пределах 15–25 шагов.
it('длительность всех готовых примеров ограничена', () => {
  for (const [task, list] of Object.entries(examples)) for (const [i, example] of list.entries()) {
    const frames = task === 'two_sum' ? twoSumFrames(parseNumbers(example.input), parseTarget(example.target!)) : task === 'anagrams' ? anagramFrames(parseWords(example.input)) : hashFrames(parseOperations(example.input));
    expect(frames.length - 1).toBeLessThanOrEqual(25);
    if (i < 2) expect(frames.length - 1).toBeGreaterThanOrEqual(15);
  }
});
