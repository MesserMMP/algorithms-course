/** Pure animation models. Each frame owns a separate snapshot of its state. */
export type Task = 'traversal' | 'validate' | 'balance';
export type Order = 'preorder' | 'inorder' | 'postorder' | 'reverse_preorder' | 'reverse_inorder' | 'reverse_postorder';
export type Node = { id: string; value: number; left: Node | null; right: Node | null };
export type Bounds = { low: number | null; high: number | null };
export type Frame = {
  root: Node | null;
  active: string | null;
  visited: string[];
  output: number[];
  title: string;
  detail: string;
  line: number;
  frontier: string[];
  bounds: Record<string, Bounds>;
  heights: Record<string, number>;
  invalid: string | null;
  result: boolean | null;
  phase: string;
};

export const orderLabels: Record<Order, string> = {
  preorder: 'Preorder', inorder: 'Inorder', postorder: 'Postorder',
  reverse_preorder: 'Reverse preorder', reverse_inorder: 'Reverse inorder', reverse_postorder: 'Reverse postorder',
};
export const orderPatterns: Record<Order, string> = {
  preorder: 'Узел → Лево → Право', inorder: 'Лево → Узел → Право', postorder: 'Лево → Право → Узел',
  reverse_preorder: 'Узел → Право → Лево', reverse_inorder: 'Право → Узел → Лево', reverse_postorder: 'Право → Лево → Узел',
};

function arrayInput(text: string): unknown[] {
  let input: unknown;
  try { input = JSON.parse(text); } catch { throw new Error('Введите корректный JSON-массив, например [8, 4, 12].'); }
  if (!Array.isArray(input)) throw new Error('Ожидается JSON-массив.');
  return input;
}

function isValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

export function parseValues(text: string): number[] {
  const input = arrayInput(text);
  if (input.length > 15) throw new Error('Для наглядной схемы используйте не больше 15 чисел.');
  if (!input.every(isValue)) throw new Error('Все значения должны быть целыми числами от −9007199254740991 до 9007199254740991.');
  return input;
}

/** Compact level order: null consumes a child slot, but has no own children. */
export function parseTree(text: string): Node | null {
  const input = arrayInput(text);
  if (input.length > 31) throw new Error('Допустимо не больше 31 позиции, включая null.');
  if (!input.every(value => value === null || isValue(value))) throw new Error('Дерево содержит только целые безопасные числа и null.');
  if (input.filter(value => value !== null).length > 15) throw new Error('Для наглядной схемы допустимо не больше 15 узлов.');
  if (input.length === 0) return null;
  if (input[0] === null) {
    if (input.some(value => value !== null)) throw new Error('У отсутствующего корня не может быть потомков.');
    return null;
  }
  const makeNode = (index: number): Node => ({ id: `n${index}`, value: input[index] as number, left: null, right: null });
  const root = makeNode(0), queue = [root];
  let cursor = 1;
  for (let index = 0; index < queue.length && cursor < input.length; index++) {
    for (const side of ['left', 'right'] as const) {
      if (cursor >= input.length) break;
      if (input[cursor] !== null) {
        const child = makeNode(cursor);
        queue[index][side] = child;
        queue.push(child);
      }
      cursor++;
    }
  }
  if (input.slice(cursor).some(value => value !== null)) throw new Error('Есть узел без родителя: проверьте позиции null.');
  return root;
}

function cloneTree(root: Node | null): Node | null {
  return root === null ? null : { id: root.id, value: root.value, left: cloneTree(root.left), right: cloneTree(root.right) };
}

function initial(root: Node | null, title: string, detail: string): Frame {
  return { root, active: null, visited: [], output: [], title, detail, line: 1, frontier: [], bounds: {}, heights: {}, invalid: null, result: null, phase: 'ready' };
}

function snapshot(frame: Frame): Frame {
  return {
    ...frame, root: cloneTree(frame.root), visited: [...frame.visited], output: [...frame.output], frontier: [...frame.frontier],
    bounds: Object.fromEntries(Object.entries(frame.bounds).map(([id, bound]) => [id, { ...bound }])), heights: { ...frame.heights },
  };
}

export function buildBST(values: number[]): Node | null {
  let root: Node | null = null;
  values.forEach((value, index) => {
    const newNode: Node = { id: `n${index}`, value, left: null, right: null };
    if (root === null) { root = newNode; return; }
    let current: Node = root;
    while (current.value !== value) {
      const side = value < current.value ? 'left' : 'right';
      const child = current[side];
      if (child === null) { current[side] = newNode; return; }
      current = child;
    }
  });
  return root;
}

export function insertionFrames(values: number[]): Frame[] {
  const state = initial(null, 'Строим BST', 'Числа вставляются по очереди. Слева — строго меньше, справа — строго больше; повторы пропускаются.');
  const frames = [snapshot(state)];
  values.forEach((value, index) => {
    const node: Node = { id: `n${index}`, value, left: null, right: null };
    if (state.root === null) {
      state.root = node; state.active = node.id; state.visited.push(node.id); state.output.push(value);
      state.title = `${value} становится корнем`; state.detail = 'Дерево было пустым. Создаём первый узел.'; state.line = 3; state.phase = 'insert';
      frames.push(snapshot(state)); return;
    }
    let current = state.root;
    const path: string[] = [];
    while (true) {
      path.push(current.id); state.active = current.id; state.frontier = [...path]; state.line = 6;
      if (value === current.value) {
        state.title = `Повтор ${value}: пропускаем`; state.detail = 'Такое значение уже есть в BST. Строгое дерево поиска не хранит дубликаты.'; state.phase = 'duplicate';
        frames.push(snapshot(state)); break;
      }
      const side = value < current.value ? 'left' : 'right', direction = side === 'left' ? 'лево' : 'право';
      state.title = `Сравниваем ${value} и ${current.value}`;
      state.detail = `${value} ${side === 'left' ? '<' : '>'} ${current.value}: идём в${direction}. ${current[side] === null ? 'Место для нового узла свободно.' : 'Продолжаем поиск места в поддереве.'}`;
      state.phase = 'compare'; frames.push(snapshot(state));
      const child = current[side];
      if (child !== null) { current = child; continue; }
      current[side] = node; state.active = node.id; state.visited.push(node.id); state.output.push(value); state.line = 9;
      state.title = `Вставляем ${value}`; state.detail = `Новый узел — ${side === 'left' ? 'левый' : 'правый'} ребёнок ${current.value}. Все сравнения на пути от корня сохраняют свойства BST.`;
      state.phase = 'insert'; frames.push(snapshot(state)); break;
    }
  });
  state.active = null; state.frontier = []; state.title = 'BST построено'; state.detail = `Уникальных значений: ${state.visited.length}. Порядок вставки определяет форму дерева.`;
  state.line = 11; state.phase = 'complete'; frames.push(snapshot(state));
  return frames;
}

export function traversalFrames(values: number[], order: Order): Frame[] {
  const root = buildBST(values);
  const state = initial(root, `Обход ${orderLabels[order]}`, `${orderPatterns[order]}. Добавляем значение в результат в момент посещения узла.`);
  const frames = [snapshot(state)];
  type Work = { node: Node; visit: boolean };
  const stack: Work[] = root ? [{ node: root, visit: false }] : [];
  while (stack.length) {
    const work = stack.pop()!;
    if (work.visit) {
      state.active = work.node.id; state.visited.push(work.node.id); state.output.push(work.node.value);
      state.frontier = [...new Set(stack.map(item => item.node.id))]; state.phase = 'visit'; state.line = 7;
      state.title = `Посещаем ${work.node.value}`; state.detail = `${orderPatterns[order]}. Позиция ${state.output.length}: добавляем ${work.node.value} в результат.`;
      frames.push(snapshot(state)); continue;
    }
    const reverse = order.startsWith('reverse_');
    const first = reverse ? work.node.right : work.node.left, second = reverse ? work.node.left : work.node.right;
    const sequence: Work[] = [];
    const visit: Work = { node: work.node, visit: true };
    if (order.endsWith('preorder')) sequence.push(visit);
    if (first) sequence.push({ node: first, visit: false });
    if (order.endsWith('inorder')) sequence.push(visit);
    if (second) sequence.push({ node: second, visit: false });
    if (order.endsWith('postorder')) sequence.push(visit);
    stack.push(...sequence.reverse());
  }
  state.active = null; state.frontier = []; state.phase = 'complete'; state.line = 9;
  state.title = 'Обход завершён'; state.detail = `Посещено узлов: ${state.output.length}. Каждый узел добавлен ровно один раз.`;
  frames.push(snapshot(state)); return frames;
}

const interval = (low: number | null, high: number | null) => `(${low ?? '−∞'}, ${high ?? '+∞'})`;

export function validationFrames(root: Node | null): Frame[] {
  const state = initial(root, 'Проверяем границы BST', 'Для каждого узла храним открытый интервал допустимых значений. Ограничения приходят от всех предков.');
  const frames = [snapshot(state)];
  const stack: { node: Node; low: number | null; high: number | null }[] = root ? [{ node: root, low: null, high: null }] : [];
  while (stack.length) {
    const { node, low, high } = stack.pop()!;
    state.active = node.id; state.bounds[node.id] = { low, high }; state.frontier = stack.map(item => item.node.id);
    state.title = `Проверяем ${node.value}`; state.detail = `Допустимый интервал: ${interval(low, high)}. Значение должно быть строго внутри обеих границ.`;
    state.line = 5; state.phase = 'check'; frames.push(snapshot(state));
    if ((low !== null && node.value <= low) || (high !== null && node.value >= high)) {
      state.invalid = node.id; state.result = false; state.phase = 'invalid'; state.line = 6;
      state.title = `${node.value} нарушает свойство BST`;
      state.detail = `${node.value} не входит в ${interval(low, high)}. ${low !== null && node.value <= low ? `Нужно ${node.value} > ${low}.` : `Нужно ${node.value} < ${high}.`} Проверка завершается: False.`;
      frames.push(snapshot(state)); return frames;
    }
    state.visited.push(node.id); state.output.push(node.value); state.phase = 'valid'; state.line = 8;
    state.title = `${node.value}: границы соблюдены`;
    state.detail = `Левому ребёнку передаём ${interval(low, node.value)}, правому — ${interval(node.value, high)}. Границы от предков сохраняются.`;
    if (node.right) stack.push({ node: node.right, low: node.value, high });
    if (node.left) stack.push({ node: node.left, low, high: node.value });
    state.frontier = stack.map(item => item.node.id); frames.push(snapshot(state));
  }
  state.active = null; state.frontier = []; state.result = true; state.phase = 'complete'; state.line = 11;
  state.title = 'Это корректное BST'; state.detail = root ? 'У каждого узла соблюдены строгие границы от всех предков. Результат: True.' : 'Пустое дерево считается корректным BST. Результат: True.';
  frames.push(snapshot(state)); return frames;
}

export function balanceFrames(root: Node | null): Frame[] {
  const state = initial(root, 'Проверяем баланс снизу вверх', 'Сначала получаем высоты детей, затем проверяем узел. Высота пустого поддерева — 0, листа — 1.');
  const frames = [snapshot(state)];
  const stack: { node: Node; expanded: boolean }[] = root ? [{ node: root, expanded: false }] : [];
  while (stack.length) {
    const { node, expanded } = stack.pop()!;
    state.active = node.id; state.frontier = [...new Set(stack.map(item => item.node.id))];
    if (!expanded) {
      state.phase = 'descend'; state.line = 4; state.title = `Спускаемся к узлу ${node.value}`;
      state.detail = 'Чтобы найти высоту этого узла, сначала вычислим высоты левого и правого поддеревьев.';
      frames.push(snapshot(state));
      stack.push({ node, expanded: true });
      if (node.right) stack.push({ node: node.right, expanded: false });
      if (node.left) stack.push({ node: node.left, expanded: false });
      continue;
    }
    const left = node.left ? state.heights[node.left.id] : 0, right = node.right ? state.heights[node.right.id] : 0;
    const difference = Math.abs(left - right), height = 1 + Math.max(left, right);
    state.heights[node.id] = height; state.visited.push(node.id); state.output.push(node.value);
    state.line = 8; state.phase = 'height'; state.title = `${node.value}: высота ${height}`;
    state.detail = `Слева ${left}, справа ${right}; разница |${left} − ${right}| = ${difference}. Высота = 1 + max(${left}, ${right}) = ${height}.`;
    if (difference > 1) {
      state.invalid = node.id; state.result = false; state.phase = 'invalid'; state.line = 7;
      state.title = `${node.value}: нарушен баланс`;
      state.detail += ' Разница больше 1, поэтому всё дерево несбалансированно. Результат: False.';
      frames.push(snapshot(state)); return frames;
    }
    frames.push(snapshot(state));
  }
  state.active = null; state.frontier = []; state.result = true; state.phase = 'complete'; state.line = 10;
  state.title = 'Дерево сбалансировано'; state.detail = root ? 'Для каждого узла разница высот не больше 1. Результат: True.' : 'Пустое дерево сбалансировано и имеет высоту 0. Результат: True.';
  frames.push(snapshot(state)); return frames;
}
