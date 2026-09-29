export type Task = 'two_sum' | 'anagrams' | 'hash_table';
export type Frame = {
  title: string; detail: string; line: number; active: number; focus: number;
  items: string[]; pairs: [string, string][]; groups: [string, string[]][];
  buckets: [number, string][][]; result: string; found: number[]; size: number;
};
const frame = (changes: Partial<Frame>): Frame => ({title: 'Готовы к запуску', detail: 'Начните с первого шага: состояние пока пустое.', line: 0, active: -1, focus: -1, items: [], pairs: [], groups: [], buckets: [], result: '', found: [], size: 0, ...changes});
export function parseNumbers(text: string): number[] {
  let values: unknown;
  try { values = JSON.parse(text); } catch { throw new Error('Введите JSON-массив чисел: [1, 3, 4, 10].'); }
  if (!Array.isArray(values) || values.length > 32 || !values.every(v => Number.isSafeInteger(v) && Math.abs(v) <= 1_000_000)) throw new Error('Нужно до 32 целых чисел от −1 000 000 до 1 000 000.');
  return values;
}
export function parseWords(text: string): string[] {
  let words: unknown;
  try { words = JSON.parse(text); } catch { throw new Error('Введите JSON-массив строк, например ["eat", "tea"].'); }
  if (!Array.isArray(words) || words.length > 24 || !words.every(w => typeof w === 'string' && [...w].length <= 32)) throw new Error('Нужно до 24 строк, каждая до 32 символов.');
  return words;
}
export function parseTarget(text: string): number {
  if (!/^-?\d+$/.test(text.trim()) || Math.abs(Number(text)) > 2_000_000) throw new Error('k — целое число от −2 000 000 до 2 000 000.');
  return Number(text);
}
export function twoSumFrames(arr: number[], k: number): Frame[] {
  const seen = new Map<number, number>();
  const items = arr.map(String);
  const frames: Frame[] = [frame({items})];
  const pairs = (): [string, string][] => [...seen].map(([v, i]) => [String(v), String(i)]);
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i], need = k - v;
    frames.push(frame({items, pairs: pairs(), active: i, line: 2, title: `Ищем ${need} в словаре`, detail: `${k} − ${v} = ${need}. Проверяем только ранее пройденные элементы.`}));
    if (seen.has(need)) {
      const j = seen.get(need)!;
      frames.push(frame({items, pairs: pairs(), active: i, found: [j, i], line: 3, title: 'Пара найдена', detail: `${arr[j]} + ${v} = ${k}. Индексы уже расположены по возрастанию.`, result: `${j} ${i}`}));
      return frames;
    }
    seen.set(v, i);
    frames.push(frame({items, pairs: pairs(), active: i, line: 4, title: `Запоминаем ${v} → ${i}`, detail: 'Дополнения пока нет. Сохраняем число и его индекс для следующих шагов.'}));
  }
  frames.push(frame({items, pairs: pairs(), line: 5, title: 'Пары нет', detail: 'Весь массив пройден. Для такого входа Python-функция вызывает ValueError.', result: 'ValueError'}));
  return frames;
}
// Python sorted(str) compares Unicode code points, not UTF-16 code units.
export const signature = (word: string) => [...word].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!).join('');
export function anagramFrames(words: string[]): Frame[] {
  const groups = new Map<string, string[]>();
  const frames = [frame({items: words})];
  words.forEach((word, i) => {
    const key = signature(word);
    const existing = groups.has(key);
    frames.push(frame({items: words, active: i, line: 2, title: 'Вычисляем подпись слова', detail: `${JSON.stringify(word)} → ${JSON.stringify(key)}. Сортируем символы и ищем эту подпись в словаре.`, groups: [...groups].map(([s, ws]) => [s, [...ws]])}));
    const list = groups.get(key) ?? [];
    list.push(word); groups.set(key, list);
    frames.push(frame({items: words, active: i, focus: [...groups.keys()].indexOf(key), line: 3, title: existing ? 'Добавляем в знакомую группу' : 'Создаём новую группу', detail: `${JSON.stringify(word)} → ${JSON.stringify(key)}. ${existing ? 'Такая подпись уже есть.' : 'Этой подписи ещё нет в словаре.'}`, groups: [...groups].map(([s, ws]) => [s, [...ws]])}));
  });
  frames.push(frame({items: words, line: 4, title: 'Все анаграммы сгруппированы', detail: 'Порядок групп и слов соответствует первому появлению во входе.', groups: [...groups].map(([s, ws]) => [s, [...ws]]), result: JSON.stringify([...groups.values()])}));
  return frames;
}
export type Operation = {op: 'set' | 'get' | 'delete'; key: number; value: string};
export function parseOperations(text: string): Operation[] {
  const lines = text.trim() ? text.trim().split('\n') : [];
  if (lines.length > 24) throw new Error('Можно выполнить до 24 операций за один сценарий.');
  return lines.map((line, i) => {
    const match = /^(set|get|delete)\s+(-?\d+)(?:\s+(.+))?$/.exec(line.trim());
    if (!match || (match[1] === 'set' && match[3] === undefined) || (match[1] !== 'set' && match[3] !== undefined) || Math.abs(Number(match[2])) > 1_000_000 || (match[3]?.length ?? 0) > 40) throw new Error(`Строка ${i + 1}: используйте set 1 слово, get 1 или delete 1. Ключ ±1 000 000, значение до 40 символов.`);
    return {op: match[1] as Operation['op'], key: Number(match[2]), value: match[3] ?? ''};
  });
}
export function bucketIndex(key: number, capacity: number): number {
  const h = key === -1 ? -2 : key; // Python hash(-1) == -2; остальные малые int хешируются в себя.
  return ((h % capacity) + capacity) % capacity;
}
export function hashFrames(ops: Operation[]): Frame[] {
  let buckets: [number, string][][] = Array.from({length: 4}, () => []);
  let size = 0;
  const items = ops.map(o => `${o.op} ${o.key}${o.op === 'set' ? ` ${o.value}` : ''}`);
  const snap = (changes: Partial<Frame>) => frame({items, size, buckets: buckets.map(b => b.map(([k, v]) => [k, v])), ...changes});
  const frames = [snap({})];
  ops.forEach((o, i) => {
    let index = bucketIndex(o.key, buckets.length);
    let chain = buckets[index];
    const pos = chain.findIndex(([k]) => k === o.key);
    frames.push(snap({active: i, focus: index, line: 1, title: `Выбираем корзину ${index}`, detail: `hash(${o.key}) % ${buckets.length} = ${index}. Сравниваем ключи внутри цепочки.`}));
    if (o.op === 'set') {
      if (pos >= 0) {
        chain[pos][1] = o.value;
        frames.push(snap({active: i, focus: index, line: 2, title: 'Обновляем значение', detail: 'Ключ уже существует: размер таблицы не меняется.'}));
      } else {
        if ((size + 1) / buckets.length > 0.75) {
          const old = buckets;
          buckets = Array.from({length: old.length * 2}, () => []);
          old.flat().forEach(([k, v]) => buckets[bucketIndex(k, buckets.length)].push([k, v]));
          frames.push(snap({active: i, line: 3, title: `Расширяем: ${old.length} → ${buckets.length}`, detail: 'Новая запись превысила бы нагрузку 0.75. Пересчитываем корзины всех ключей.'}));
          index = bucketIndex(o.key, buckets.length); chain = buckets[index];
        }
        chain.push([o.key, o.value]); size++;
        frames.push(snap({active: i, focus: index, line: 4, title: chain.length > 1 ? 'Коллизия: продолжаем цепочку' : 'Вставляем новую запись', detail: `Ключ ${o.key} в корзине ${index}. Разные ключи могут иметь одинаковый индекс.`}));
      }
    } else if (pos < 0) {
      frames.push(snap({active: i, focus: index, line: 5, title: 'Ключ отсутствует', detail: 'Python вызывает KeyError. Визуализация показывает ошибку и продолжает сценарий.', result: `KeyError(${o.key})`}));
    } else if (o.op === 'get') {
      frames.push(snap({active: i, focus: index, line: 5, title: 'Значение найдено', detail: `Ключ ${o.key} найден сравнением ключей в цепочке.`, result: chain[pos][1]}));
    } else {
      chain.splice(pos, 1); size--;
      frames.push(snap({active: i, focus: index, line: 5, title: 'Запись удалена', detail: 'Остальные записи в цепочке остаются доступными. Ёмкость не уменьшается.'}));
    }
  });
  return frames;
}
