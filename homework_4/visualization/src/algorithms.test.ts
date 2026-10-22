import { describe, expect, it } from 'vitest';
import { balanceFrames, buildBST, insertionFrames, orderLabels, parseTree, parseValues, traversalFrames, validationFrames } from './algorithms';
import type { Node, Order } from './algorithms';
import { examples, insertionExample } from './examples';

function inorder(node: Node | null): number[] { return node ? [...inorder(node.left), node.value, ...inorder(node.right)] : []; }
function height(node: Node | null): number { return node ? 1 + Math.max(height(node.left), height(node.right)) : 0; }
function balanced(node: Node | null): boolean { return !node || (Math.abs(height(node.left) - height(node.right)) <= 1 && balanced(node.left) && balanced(node.right)); }
function count(node: Node | null): number { return node ? 1 + count(node.left) + count(node.right) : 0; }

describe('Разбор пользовательских данных', () => {
  it('принимает пустой ввод-массив, ноль, отрицательные и большие точные целые', () => {
    expect(parseValues('[]')).toEqual([]);
    expect(parseValues('[-9007199254740991, 0, 9007199254740991]')).toEqual([-Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER]);
    expect(parseValues(JSON.stringify(Array(15).fill(1)))).toHaveLength(15);
  });
  it('отклоняет неправильные типы, неточные числа и чрезмерный размер', () => {
    for (const input of ['', 'null', '{}', '1', '[true]', '["1"]', '[null]', '[1.1]', '[9007199254740992]', '[1e309]', '[NaN]', JSON.stringify(Array(16).fill(1))]) {
      expect(() => parseValues(input), input).toThrow();
    }
  });
  it('разбирает компактный обход по уровням: отсутствующий узел не создаёт слоты детей', () => {
    const root = parseTree('[1, null, 2, 3]')!;
    expect(root.left).toBeNull(); expect(root.right?.left?.value).toBe(3);
    expect(root.right?.right).toBeNull();
    expect(inorder(parseTree('[0, -1, 1]'))).toEqual([-1, 0, 1]);
    expect(inorder(parseTree('[1, 1, 1]'))).toEqual([1, 1, 1]);
    for (const input of ['[]', '[null]', '[null, null, null]']) expect(parseTree(input)).toBeNull();
    expect(count(parseTree('[1, null, null, null, null]'))).toBe(1);
  });
  it('отклоняет узлы без родителей и некорректные элементы дерева', () => {
    for (const input of ['null', '{}', '[null, 1]', '[1, null, null, 2]', '[true]', '["1"]', '[1.5]', '[9007199254740992]', JSON.stringify(Array(16).fill(1)), JSON.stringify(Array(32).fill(null))]) {
      expect(() => parseTree(input), input).toThrow();
    }
    expect(count(parseTree(JSON.stringify(Array(15).fill(1))))).toBe(15);
    expect(count(parseTree(JSON.stringify([1, ...Array(30).fill(null)])))).toBe(1);
  });
});

describe('BST и шесть обходов', () => {
  const values = [8, 4, 12, 2, 6, 10, 14, 5];
  const expected: Record<Order, number[]> = {
    preorder: [8, 4, 2, 6, 5, 12, 10, 14],
    inorder: [2, 4, 5, 6, 8, 10, 12, 14],
    postorder: [2, 5, 6, 4, 10, 14, 12, 8],
    reverse_preorder: [8, 12, 14, 10, 4, 6, 5, 2],
    reverse_inorder: [14, 12, 10, 8, 6, 5, 4, 2],
    reverse_postorder: [14, 10, 12, 5, 6, 2, 4, 8],
  };
  for (const order of Object.keys(orderLabels) as Order[]) {
    it(`${order}: точный порядок на асимметричном дереве`, () => {
      const frames = traversalFrames(values, order);
      expect(frames.at(-1)!.output).toEqual(expected[order]);
      expect(frames.filter(frame => frame.phase === 'visit').map(frame => frame.output.at(-1))).toEqual(expected[order]);
      expect(new Set(frames.at(-1)!.visited).size).toBe(values.length);
      expect(traversalFrames([], order).at(-1)!.output).toEqual([]);
      expect(traversalFrames([0], order).at(-1)!.output).toEqual([0]);
    });
  }
  it('повторы не вставляются; вход не изменяется', () => {
    const input = [0, 2, -2, 0, -2, 3], original = [...input];
    const root = buildBST(input);
    expect(inorder(root)).toEqual([-2, 0, 2, 3]); expect(input).toEqual(original);
    expect(validationFrames(root).at(-1)!.result).toBe(true);
    expect(buildBST([])).toBeNull();
  });
  it('вставка показывает сравнения, направление и повтор без изменения структуры', () => {
    const frames = insertionFrames([8, 4, 12, 2, 4]);
    expect(inorder(frames.at(-1)!.root)).toEqual([2, 4, 8, 12]);
    expect(frames.filter(frame => frame.phase === 'insert')).toHaveLength(4);
    expect(frames.filter(frame => frame.phase === 'compare')).toHaveLength(5);
    expect(frames.filter(frame => frame.phase === 'duplicate')).toHaveLength(1);
    expect(frames[0].root).toBeNull(); expect(count(frames[1].root)).toBe(1);
    expect(insertionFrames([]).at(-1)!.root).toBeNull();
  });
});

describe('Проверка BST с границами всех предков', () => {
  it('валидные деревья, цепочка, отрицательные и пустое', () => {
    for (const input of ['[]', '[0]', '[0, -8, 8, -12, -4, 4, 12]', '[1, null, 2, null, 3]', '[-9007199254740991, null, 9007199254740991]']) {
      expect(validationFrames(parseTree(input)).at(-1)!.result, input).toBe(true);
    }
  });
  it('находит нарушение предка, даже если сравнение с родителем успешно', () => {
    const frames = validationFrames(parseTree('[8, 4, 12, 2, 6, 10, 14, 1, 3, null, null, 7, 11]'));
    const end = frames.at(-1)!;
    expect(end.result).toBe(false); expect(end.invalid).toBe('n11'); expect(end.bounds.n11).toEqual({ low: 8, high: 10 });
    expect(end.title).toContain('7');
  });
  it('строгие границы отклоняют любой дубликат', () => {
    for (const input of ['[8, 8]', '[8, null, 8]', '[8, 4, 12, null, 8]']) expect(validationFrames(parseTree(input)).at(-1)!.result, input).toBe(false);
  });
});

describe('Баланс каждого узла', () => {
  it('пустое, лист, разница 1 и цепочка с разницей 2', () => {
    for (const input of ['[]', '[0]', '[8, 4]', '[8, 12, 4]']) expect(balanceFrames(parseTree(input)).at(-1)!.result, input).toBe(true);
    expect(balanceFrames(parseTree('[1, null, 2, null, 3]')).at(-1)!.result).toBe(false);
  });
  it('проверяет баланс ниже корня, даже при равных высотах у корня', () => {
    const root = parseTree(examples.balance[1].input)!;
    expect(height(root.left)).toBe(height(root.right));
    const end = balanceFrames(root).at(-1)!;
    expect(end.result).toBe(false); expect(end.invalid).toBe(root.left!.id);
  });
  it('не требует свойства BST и вычисляет высоты снизу вверх', () => {
    const root = parseTree(examples.balance[2].input)!;
    const frames = balanceFrames(root), end = frames.at(-1)!;
    expect(validationFrames(root).at(-1)!.result).toBe(false);
    expect(end.result).toBe(true); expect(end.heights[root.id]).toBe(height(root));
    for (const frame of frames.filter(frame => frame.phase === 'height')) {
      const find = (node: Node | null): Node | null => !node || node.id === frame.active ? node : find(node.left) || find(node.right);
      const node = find(root)!;
      if (node.left) expect(frame.heights[node.left.id]).toBe(height(node.left));
      if (node.right) expect(frame.heights[node.right.id]).toBe(height(node.right));
    }
  });
});

describe('Независимые проверки и кадры', () => {
  it('случайные формы и значения сверяются с независимыми эталонами', () => {
    let seed = 71429;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
    for (let test = 0; test < 250; test++) {
      let nextId = 0;
      const generate = (depth: number): Node | null => depth === 0 || random() < .3 ? null : { id: `r${nextId++}`, value: Math.floor(random() * 21) - 10, left: generate(depth - 1), right: generate(depth - 1) };
      const root = generate(4), sorted = inorder(root);
      const valid = sorted.every((value, index) => index === 0 || value > sorted[index - 1]);
      expect(validationFrames(root).at(-1)!.result).toBe(valid);
      expect(balanceFrames(root).at(-1)!.result).toBe(balanced(root));
    }
  });
  it('кадры независимы от входа и друг друга, включая вложенные поля', () => {
    const root = parseTree('[8, 4, 12]')!;
    const validation = validationFrames(root), balance = balanceFrames(root), traversal = traversalFrames([8, 4, 12], 'inorder');
    root.left!.value = 99;
    expect(validation[0].root!.left!.value).toBe(4); expect(balance[0].root!.left!.value).toBe(4);
    validation[1].bounds.n0.low = 99;
    expect(validation[2].bounds.n0.low).toBeNull();
    balance.at(-1)!.heights.n0 = 999;
    expect(balance.at(-2)!.heights.n0).toBe(2);
    traversal[1].output.push(999); traversal[1].visited.push('fake'); traversal[1].root!.value = 999;
    expect(traversal.at(-1)!.output).toEqual([4, 8, 12]); expect(traversal[2].visited).not.toContain('fake'); expect(traversal[2].root!.value).toBe(8);
    const insertion = insertionFrames([8, 4, 12]); insertion[1].root!.value = 999;
    expect(insertion.at(-1)!.root!.value).toBe(8);
  });
  it('все готовые примеры корректно разбираются, стартовые укладываются в 15–25 шагов', () => {
    for (const [task, list] of Object.entries(examples)) {
      for (const example of list) {
        const frames = task === 'traversal' ? traversalFrames(parseValues(example.input), 'inorder') : task === 'validate' ? validationFrames(parseTree(example.input)) : balanceFrames(parseTree(example.input));
        expect(frames.length - 1).toBeLessThanOrEqual(25);
        if (example === list[0]) expect(frames.length - 1).toBeGreaterThanOrEqual(15);
      }
    }
    const insertion = insertionFrames(parseValues(insertionExample.input));
    expect(insertion.length - 1).toBeGreaterThanOrEqual(15); expect(insertion.length - 1).toBeLessThanOrEqual(25);
  });
});
