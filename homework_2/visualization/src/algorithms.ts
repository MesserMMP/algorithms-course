export type TaskId = 'stack_vs_queue' | 'validate' | 'merge_lists';
export type Tone = 'blue' | 'violet' | 'neutral';
export type Item = { id: string; value: number; tone: Tone };
export type Lane = { id: string; label: string; note: string; items: Item[]; pointers: Record<string, string[]> };
export type Frame = {
  operation: string;
  detail: string;
  lanes: Lane[];
  variables: Record<string, string | number>;
  output?: { label: string; values: number[] }[];
  result?: boolean;
  consumed?: [number, number];
  active?: string;
};
export type Trace = { frames: Frame[]; input: number[][]; dummy: boolean };
export type ParseOptions = { unique?: boolean; sorted?: boolean; empty?: boolean };

export function parseNumbers(text: string, options: ParseOptions = {}): number[] {
  const tokens = text.trim() ? text.trim().split(/[\s,;]+/) : [];
  if (options.empty === false && !tokens.length) throw new Error('Введите хотя бы одно число.');
  if (tokens.length > 16) throw new Error('В визуализации — не больше 16 чисел в одном списке.');
  if (tokens.some(token => !/^[+-]?\d+$/.test(token) || !Number.isSafeInteger(Number(token)))) {
    throw new Error('Введите целые числа в безопасном диапазоне JavaScript (±9 007 199 254 740 991).');
  }
  const values = tokens.map(Number);
  if (options.unique && new Set(values).size !== values.length) throw new Error('Числа в каждой последовательности должны быть уникальны.');
  if (options.sorted && values.some((value, i) => i > 0 && value < values[i - 1])) throw new Error('Отсортируйте каждый список по возрастанию.');
  return values;
}

const items = (values: number[], prefix: string, tone: Tone): Item[] => values.map((value, i) => ({ id: `${prefix}${i + 1}`, value, tone }));
const pointer = (labels: [string | undefined, string][]): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  for (const [id, label] of labels) if (id) (result[id] ??= []).push(label);
  return result;
};

export function structureTrace(values: number[]): Trace {
  type Link = { item: Item; next: Link | null };
  let top: Link | null = null, head: Link | null = null, tail: Link | null = null;
  const stackOut: number[] = [], queueOut: number[] = [], frames: Frame[] = [];
  const collect = (link: Link | null): Item[] => {
    const result: Item[] = [];
    while (link) { result.push(link.item); link = link.next; }
    return result;
  };
  const save = (operation: string, detail: string, active?: string) => {
    const stack = collect(top), queue = collect(head);
    frames.push({ operation, detail, active,
      lanes: [
        { id: 'stack', label: 'Стек', note: 'LIFO · вершина слева', items: stack, pointers: pointer([[top?.item.id, 'top']]) },
        { id: 'queue', label: 'Очередь', note: 'FIFO · голова слева', items: queue, pointers: pointer([[head?.item.id, 'head'], [tail?.item.id, 'tail']]) },
      ],
      variables: { 'len(stack)': stack.length, 'len(queue)': queue.length, top: top?.item.id ?? 'None', tail: tail?.item.id ?? 'None' },
      output: [{ label: 'pop', values: [...stackOut] }, { label: 'dequeue', values: [...queueOut] }],
    });
  };
  save('Начальное состояние', 'Стек и очередь пусты. Все указатели равны None.');
  values.forEach((value, i) => {
    top = { item: { id: `S${i + 1}`, value, tone: 'blue' }, next: top };
    const node: Link = { item: { id: `Q${i + 1}`, value, tone: 'violet' }, next: null };
    if (tail) tail.next = node; else head = node;
    tail = node;
    save(`push(${value}) · enqueue(${value})`, `Стек: новый узел указывает на прежнюю вершину. Очередь: прежний хвост указывает на новый узел.`, top.item.id);
  });
  // Цикл управляется числом входов: обе структуры содержат одинаковое число узлов.
  for (let i = 0; i < values.length; i++) {
    const stackNode = top as Link | null;
    const queueNode = head as Link | null;
    if (!stackNode || !queueNode) throw new Error('Нарушен инвариант структуры.');
    stackOut.push(stackNode.item.value); queueOut.push(queueNode.item.value);
    top = stackNode.next; head = queueNode.next;
    if (!head) tail = null;
    save(`pop() → ${stackNode.item.value} · dequeue() → ${queueNode.item.value}`, 'Сдвигаем голову каждой структуры. Стек возвращает последний добавленный элемент, очередь — первый.');
  }
  save('Все элементы извлечены', 'Обе структуры пусты и готовы к повторному использованию.');
  return { frames, input: [values], dummy: false };
}

export function validateTrace(pushed: number[], popped: number[]): Trace {
  const available = new Set(pushed);
  if (pushed.length !== popped.length || available.size !== pushed.length || new Set(popped).size !== popped.length || popped.some(value => !available.has(value))) {
    throw new Error('popped должна содержать те же уникальные числа, что и pushed.');
  }
  const source = items(pushed, 'N', 'blue'), stack: Item[] = [], frames: Frame[] = [];
  let i = 0, j = 0;
  const save = (operation: string, detail: string, result?: boolean, active?: string) => frames.push({
    operation, detail, result, active,
    lanes: [{ id: 'stack', label: 'Стек', note: 'Вершина слева', items: [...stack].reverse(), pointers: pointer([[stack.at(-1)?.id, 'top']]) }],
    variables: { i, j, 'stack[-1]': stack.at(-1)?.value ?? 'None', 'popped[j]': popped[j] ?? '—' }, consumed: [i, j] as [number, number],
  });
  save('Начальное состояние', 'j указывает на следующий ожидаемый элемент popped.');
  for (const node of source) {
    stack.push(node); i++;
    save(`push(${node.value})`, `Сравниваем вершину ${node.value} с ожидаемым ${popped[j]}.`, undefined, node.id);
    while (stack.length && stack.at(-1)?.value === popped[j]) {
      const removed = stack.pop()!; j++;
      save(`pop() → ${removed.value}`, 'Вершина совпала с ожидаемым числом. Извлекаем её и увеличиваем j.');
    }
  }
  const valid = j === popped.length;
  save(`return ${valid ? 'True' : 'False'}`, valid ? 'Все элементы popped получены в указанном порядке.' : `Ожидаем ${popped[j]}, но вершина — ${stack.at(-1)?.value}. Добавлять больше нечего.`, valid);
  return { frames, input: [pushed, popped], dummy: false };
}

export function mergeTrace(left: number[], right: number[], dummy = true): Trace {
  const a = items(left, 'A', 'blue'), b = items(right, 'B', 'violet'), out: Item[] = [], frames: Frame[] = [];
  let i = 0, j = 0, tail: string | undefined = dummy ? 'dummy' : undefined;
  const save = (operation: string, detail: string, active?: string) => frames.push({
    operation, detail, active,
    lanes: [
      { id: 'a', label: 'list1', note: 'Узлы A', items: a.slice(i), pointers: pointer([[a[i]?.id, 'list1']]) },
      { id: 'b', label: 'list2', note: 'Узлы B', items: b.slice(j), pointers: pointer([[b[j]?.id, 'list2']]) },
      { id: 'out', label: 'Результат', note: 'Выбранный префикс', items: [...out], pointers: pointer([[out[0]?.id, dummy ? 'dummy.next' : tail ? 'head' : 'return'], [tail, 'tail']]) },
    ],
    variables: { list1: a[i]?.id ?? 'None', list2: b[j]?.id ?? 'None', tail: tail ?? '—', [dummy ? 'dummy.next' : 'head']: out[0]?.id ?? 'None' },
  });
  save(dummy ? 'dummy = tail = ListNode()' : 'Выбираем голову', dummy ? 'Фиктивный узел позволяет одинаково присоединять первый и последующие узлы.' : 'Пустой вход обрабатывается сразу. Иначе меньшая голова становится head и tail.');
  while (i < a.length && j < b.length) {
    const av = a[i].value, bv = b[j].value;
    const node = av <= bv ? a[i++] : b[j++];
    const first = !out.length;
    out.push(node); tail = node.id;
    save(!dummy && first ? `head = tail = ${node.id}` : `tail.next = ${node.id}`, `${av} ${av <= bv ? '≤' : '>'} ${bv}: выбираем ${node.id}. ${av === bv ? 'При равенстве берём list1. ' : ''}Сдвигаем указатель входа и tail.`, node.id);
  }
  if (i < a.length || j < b.length) {
    const rest = [...a.slice(i), ...b.slice(j)];
    out.push(...rest); i = a.length; j = b.length;
    save(!dummy && !tail ? 'Возвращаем непустой вход' : 'tail.next = оставшийся список', !dummy && !tail ? 'Один список пуст. Возвращаем второй без изменения его узлов.' : 'Присоединяем остаток одним присваиванием. Сам tail не сдвигается.', rest[0].id);
  }
  save(dummy ? 'return dummy.next' : tail ? 'return head' : 'return оставшийся вход', 'Результат состоит из исходных узлов. Новые узлы в ответ не добавлены.');
  return { frames, input: [left, right], dummy };
}

export function makeTrace(task: TaskId, first: string, second: string, dummy: boolean): Trace {
  if (task === 'stack_vs_queue') return structureTrace(parseNumbers(first));
  if (task === 'validate') return validateTrace(parseNumbers(first, { unique: true, empty: false }), parseNumbers(second, { unique: true, empty: false }));
  return mergeTrace(parseNumbers(first, { sorted: true }), parseNumbers(second, { sorted: true }), dummy);
}
