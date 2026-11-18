export type Task = 'compare' | 'iterative' | 'kth';
export type Algorithm = 'merge' | 'quick' | 'select';

export const tasks = {
  compare: {name: 'Compare', title: 'Рекурсивные сортировки'},
  iterative: {name: 'Iterative', title: 'Итеративные сортировки'},
  kth: {name: 'K-th', title: 'Поиск k-го элемента'},
};

export const names = {merge: 'Merge sort', quick: 'Quicksort', select: 'Quickselect'};
export type Example = {name: string; values: number[]; k: number};
const sorting: Example[] = [
  {name:'Смешанный массив', values:[38, 7, 26, 14, 3], k:3},
  {name:'Обратный порядок', values:[9,8,7,6,5,4,3,2,1], k:2},
  {name:'Повторы и нули', values:[4,0,-3,4,2,0,4,-3,1], k:4},
  {name:'Пустой массив', values:[], k:1},
];
export const examples: Record<Task,Example[]> = {compare:sorting, iterative:sorting, kth:[
  {name:'Второй максимум', values:[3,2,1,5,6,4], k:2},
  {name:'Поиск с повторами', values:[3,2,3,1,2,4,5,5,6], k:4},
  {name:'Отрицательные числа', values:[-7,-2,-9,0,-2,-5,3], k:5},
  {name:'Один элемент', values:[12], k:1},
]};

export const phaseNames: Record<string, string> = {
  start: 'Входной массив',
  split: 'Деление',
  merge: 'Слияние',
  pass: 'Новый проход',
  pivot: 'Выбор опоры',
  partition: 'Разбиение',
  keep: 'Сужение диапазона',
  found: 'Элемент найден',
  done: 'Результат',
};
