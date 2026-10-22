import type { Task } from './algorithms';

export type Example = { name: string; input: string };
export const insertionExample: Example = { name: '7 узлов · построение BST', input: '[8, 4, 12, 2, 6, 10, 14]' };
export const examples: Record<Task, Example[]> = {
  traversal: [
    { name: '15 узлов · все уровни', input: '[8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15]' },
    { name: 'Асимметричное дерево', input: '[20, 10, 35, 5, 15, 30, 40, 12, 17, 25, 32, 27]' },
    { name: 'Повторы при вставке', input: '[8, 4, 12, 4, 2, 6, 12, 10, 14]' },
    { name: 'Цепочка вправо', input: '[1, 2, 3, 4, 5, 6, 7]' },
    { name: 'Отрицательные значения', input: '[0, -8, 8, -12, -4, 4, 12]' },
    { name: 'Один узел', input: '[8]' },
    { name: 'Пустое дерево', input: '[]' },
  ],
  validate: [
    { name: '9 узлов · корректное BST', input: '[8, 4, 12, 2, 6, 10, 14, 1, 3]' },
    { name: 'Нарушение границы предка', input: '[8, 4, 12, 2, 6, 10, 14, 1, 3, null, null, 7, 11]' },
    { name: 'Дубликат глубоко в дереве', input: '[8, 4, 12, 2, 6, 10, 14, null, null, null, 8]' },
    { name: 'Ошибка рядом с корнем', input: '[8, 12, 4]' },
    { name: 'Отрицательные и ноль', input: '[0, -8, 8, -12, -4, 4, 12]' },
    { name: 'Пустое дерево', input: '[]' },
  ],
  balance: [
    { name: '9 узлов · разная высота ветвей', input: '[8, 4, 12, 2, 6, 10, 14, 1, 3]' },
    { name: 'Дисбаланс ниже корня', input: '[10, 5, 15, 2, null, 12, 18, 1, null, 11, null, 17, null]' },
    { name: 'Баланс есть, BST нет', input: '[8, 12, 4, 14, 10, 6, 2, 15, 13]' },
    { name: 'Длинная цепочка', input: '[1, null, 2, null, 3, null, 4, null, 5, null, 6, null, 7]' },
    { name: 'Допустимая разница 1', input: '[8, 4]' },
    { name: 'Один узел', input: '[8]' },
    { name: 'Пустое дерево', input: '[]' },
  ],
};
