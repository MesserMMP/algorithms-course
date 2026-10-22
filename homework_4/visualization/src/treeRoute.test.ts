import { expect, test } from 'vitest';
import { buildBST } from './algorithms';
import { pathTo, routeBetween } from './treeRoute';

const root = buildBST([8, 4, 12, 2, 6, 10, 14]);

test('первый спуск и пустое дерево', () => {
  expect(routeBetween(root, null, 'n3')).toEqual(['n0', 'n1', 'n3']);
  expect(routeBetween(null, null, null)).toEqual([]);
  expect(routeBetween(root, 'n3', null)).toEqual([]);
  expect(pathTo(root, 'missing')).toEqual([]);
});
test('переход между ветвями проходит через общего предка', () => {
  expect(routeBetween(root, 'n3', 'n4')).toEqual(['n3', 'n1', 'n4']);
  expect(routeBetween(root, 'n3', 'n5')).toEqual(['n3', 'n1', 'n0', 'n2', 'n5']);
  expect(routeBetween(root, 'n5', 'n3')).toEqual(['n5', 'n2', 'n0', 'n1', 'n3']);
});
test('возврат к родителю и повторная обработка узла', () => {
  expect(routeBetween(root, 'n3', 'n1')).toEqual(['n3', 'n1']);
  expect(routeBetween(root, 'n1', 'n1')).toEqual(['n1']);
  expect(routeBetween(root, 'n3', 'n0')).toEqual(['n3', 'n1', 'n0']);
});
