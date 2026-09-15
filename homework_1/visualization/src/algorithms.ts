import palindromeCode from '../../palindrome/solution.py?raw';
import palindromeTests from '../../palindrome/test_solution.py?raw';
import palindromeReadme from '../../palindrome/README.md?raw';
import sumCode from '../../sum/solution.py?raw';
import sumTests from '../../sum/test_solution.py?raw';
import sumReadme from '../../sum/README.md?raw';
import primeCode from '../../prime/solution.py?raw';
import primeTests from '../../prime/test_solution.py?raw';
import primeReadme from '../../prime/README.md?raw';
import readme from '../../README.md?raw';
import visualizationReadme from '../README.md?raw';
import visualizationPackage from '../package.json?raw';
import visualizationIndex from '../index.html?raw';
import visualizationViteConfig from '../vite.config.ts?raw';
import visualizationTsConfig from '../tsconfig.json?raw';
import visualizationApp from './App.tsx?raw';
import visualizationAlgorithms from './algorithms.ts?raw';
import visualizationMain from './main.tsx?raw';
import visualizationCss from './index.css?raw';
import visualizationCn from './utils/cn.ts?raw';

export type TaskId = 'palindrome' | 'sum' | 'prime';
export type Frame = {
  title: string; description: string; remaining?: number; reversed?: number;
  active?: number; total?: number; smallestOdd?: number; excluded?: number;
  crossed?: number[]; newlyCrossed?: number[]; candidate?: number;
  result?: number | boolean;
};
export type TestCase = { input: number | number[]; expected: number | boolean; label: string };
export type Task = {
  id: TaskId; number: string; name: string; subtitle: string; description: string;
  approach: string; time: string; memory: string; defaultInput: string; presets: string[];
  code: string; tests: string; readme: string; cases: TestCase[];
};
export const tasks: Task[] = [
  {
    id: 'palindrome', number: '01', name: 'Палиндром', subtitle: 'Симметрия в цифрах',
    description: 'Проверяем, одинаково ли читается число слева направо и справа налево. Без строк — только математика.',
    approach: 'Разворот половины числа', time: 'O(log n)', memory: 'O(1)',
    defaultInput: '1234321', presets: ['1234321', '1221', '12345'],
    code: palindromeCode, tests: palindromeTests, readme: palindromeReadme,
    cases: [
      { input: 121, expected: true, label: 'Пример из условия' },
      { input: 31, expected: false, label: 'Пример из условия' },
      { input: 0, expected: true, label: 'Нулевая граница' },
      { input: 1, expected: true, label: 'Одна цифра' },
      { input: 9, expected: true, label: 'Одна цифра' },
      { input: 10, expected: false, label: 'Ноль в конце' },
      { input: 11, expected: true, label: 'Две одинаковые цифры' },
      { input: 100, expected: false, label: 'Несколько нулей' },
      { input: 101, expected: true, label: 'Ноль внутри' },
      { input: 1001, expected: true, label: 'Чётная длина, нули' },
      { input: 1221, expected: true, label: 'Чётная длина' },
      { input: 1234321, expected: true, label: 'Нечётная длина' },
      { input: 12345, expected: false, label: 'Разные половины' },
      { input: 123421, expected: false, label: 'Почти палиндром' },
      { input: -121, expected: false, label: 'Отрицательное число' },
      { input: 100000000000001, expected: true, label: 'Большое число' },
    ],
  },
  {
    id: 'sum', number: '02', name: 'Максимальная сумма', subtitle: 'Чётность решает всё',
    description: 'Находим максимальную сумму элементов, которая делится на 2. Один проход — и ничего лишнего.',
    approach: 'Сумма и минимальное нечётное', time: 'O(n)', memory: 'O(1)',
    defaultInput: '5 7 13 2 14', presets: ['5 7 13 2 14', '4 8 6 12', '3'],
    code: sumCode, tests: sumTests, readme: sumReadme,
    cases: [
      { input: [5, 7, 13, 2, 14], expected: 36, label: 'Пример из условия' },
      { input: [3], expected: 0, label: 'Один нечётный' },
      { input: [], expected: 0, label: 'Пустой массив' },
      { input: [2], expected: 2, label: 'Один чётный' },
      { input: [1], expected: 0, label: 'Минимальный элемент' },
      { input: [2, 4, 6], expected: 12, label: 'Все чётные' },
      { input: [1, 3], expected: 4, label: 'Чётная общая сумма' },
      { input: [1, 3, 5], expected: 8, label: 'Все нечётные' },
      { input: [9, 9, 9], expected: 18, label: 'Повторяющиеся значения' },
      { input: [8, 3, 2], expected: 10, label: 'Нечётное в середине' },
      { input: [1, 1, 1], expected: 2, label: 'Повтор минимума' },
      { input: [1000000, 3], expected: 1000000, label: 'Большой элемент' },
    ],
  },
  {
    id: 'prime', number: '03', name: 'Простые числа', subtitle: 'Порядок среди чисел',
    description: 'Считаем простые числа строго меньше N. Отсеиваем составные и оставляем только нужное.',
    approach: 'Решето Эратосфена', time: 'O(n log log n)', memory: 'O(n)',
    defaultInput: '50', presets: ['50', '30', '10'],
    code: primeCode, tests: primeTests, readme: primeReadme,
    cases: [
      { input: 10, expected: 4, label: 'Пример из условия' },
      { input: 1, expected: 0, label: 'Пример из условия' },
      { input: 0, expected: 0, label: 'Нулевая граница' },
      { input: -10, expected: 0, label: 'Отрицательная граница' },
      { input: 2, expected: 0, label: 'Строго меньше 2' },
      { input: 3, expected: 1, label: 'Первое простое' },
      { input: 4, expected: 2, label: 'Квадрат простого' },
      { input: 5, expected: 2, label: 'Простая верхняя граница' },
      { input: 9, expected: 4, label: 'Квадрат 3' },
      { input: 25, expected: 9, label: 'Квадрат 5' },
      { input: 26, expected: 9, label: 'После квадрата 5' },
      { input: 30, expected: 10, label: 'Несколько проходов решета' },
      { input: 49, expected: 15, label: 'Квадрат 7' },
      { input: 50, expected: 15, label: 'После квадрата 7' },
      { input: 100, expected: 25, label: 'Сотня' },
      { input: 100000, expected: 9592, label: 'Большая граница' },
    ],
  },
];

export function isPalindrome(number: number): boolean {
  if (number < 0 || (number !== 0 && number % 10 === 0)) return false;
  let remainingNumber = number;
  let reversedHalf = 0;
  while (remainingNumber > reversedHalf) {
    reversedHalf = reversedHalf * 10 + remainingNumber % 10;
    remainingNumber = Math.floor(remainingNumber / 10);
  }
  return remainingNumber === reversedHalf || remainingNumber === Math.floor(reversedHalf / 10);
}
export function maximumEvenSum(numbers: number[]): number {
  let totalSum = 0;
  let smallestOdd = Infinity;
  for (const number of numbers) {
    totalSum += number;
    if (number % 2 !== 0) smallestOdd = Math.min(smallestOdd, number);
  }
  return totalSum % 2 === 0 ? totalSum : totalSum - smallestOdd;
}
export function countPrimes(limit: number): number {
  if (limit <= 2) return 0;
  const isPrime = new Uint8Array(limit).fill(1);
  isPrime[0] = isPrime[1] = 0;
  for (let candidate = 2; candidate * candidate < limit; candidate++) {
    if (isPrime[candidate]) {
      for (let multiple = candidate * candidate; multiple < limit; multiple += candidate) isPrime[multiple] = 0;
    }
  }
  return isPrime.reduce((count, value) => count + value, 0);
}
export function evaluate(taskId: TaskId, input: number | number[]): number | boolean {
  if (taskId === 'palindrome') return isPalindrome(input as number);
  if (taskId === 'sum') return maximumEvenSum(input as number[]);
  return countPrimes(input as number);
}
export function parseInput(taskId: TaskId, text: string): number | number[] {
  if (taskId === 'sum') {
    if (!text.trim()) return [];
    const parts = text.trim().split(/\s+/);
    if (parts.length > 14) throw new Error('Для наглядности введите не более 14 элементов.');
    if (parts.some(part => !/^\d+$/.test(part))) throw new Error('Введите положительные целые числа через пробел.');
    const numbers = parts.map(Number);
    if (numbers.some(number => number < 1 || number > 999999)) throw new Error('Каждый элемент должен быть от 1 до 999 999.');
    return numbers;
  }
  if (!/^-?\d+$/.test(text.trim())) throw new Error('Введите целое число без пробелов и дробной части.');
  const value = Number(text);
  if (!Number.isSafeInteger(value)) throw new Error('Число выходит за пределы точности браузера.');
  if (taskId === 'palindrome' && (value < 0 || value > 999999999999999)) throw new Error('Для визуализации введите число от 0 до 999 999 999 999 999.');
  if (taskId === 'prime' && (value < 0 || value > 150)) throw new Error('Для наглядного решета введите N от 0 до 150.');
  return value;
}
export function makeFrames(taskId: TaskId, input: number | number[]): Frame[] {
  if (taskId === 'palindrome') {
    let remaining = input as number;
    let reversed = 0;
    const frames: Frame[] = [{ title: 'Начнём с целого числа', description: 'Исходное число слева, развёрнутая половина пока равна 0. Будем переносить по одной цифре справа.', remaining, reversed }];
    if (remaining !== 0 && remaining % 10 === 0) return [...frames, { title: 'Ноль в конце — сразу ответ', description: 'У положительного числа не бывает ведущего нуля. Значит, число с нулём в конце несимметрично.', remaining, reversed, result: false }];
    let processedDigits = 0;
    while (remaining > reversed) {
      const lastDigit = remaining % 10;
      const previousRemaining = remaining;
      const previousReversed = reversed;
      reversed = reversed * 10 + lastDigit;
      remaining = Math.floor(remaining / 10);
      processedDigits++;
      frames.push({ title: `Переносим цифру ${lastDigit}`, description: `$${previousRemaining} \\bmod 10 = ${lastDigit}$. Разворачиваем: $${previousReversed} \\times 10 + ${lastDigit} = ${reversed}$. Убираем последнюю цифру: $\\lfloor ${previousRemaining} / 10 \\rfloor = ${remaining}$.`, remaining, reversed, active: processedDigits });
    }
    const result = isPalindrome(input as number);
    frames.push({ title: result ? 'Половины совпали. Это палиндром!' : 'Половины не совпали', description: `Цикл завершён: ${remaining} ≤ ${reversed}. Сравниваем: $${remaining} = ${reversed}$ или $${remaining} = \\lfloor ${reversed} / 10 \\rfloor = ${Math.floor(reversed / 10)}$ (без центральной цифры). ${result ? 'Одно из равенств истинно.' : 'Оба равенства ложны.'}`, remaining, reversed, active: processedDigits, result });
    return frames;
  }
  if (taskId === 'sum') {
    const numbers = input as number[];
    let total = 0;
    let smallestOdd: number | undefined;
    const frames: Frame[] = [{ title: 'Один проход по массиву', description: 'Накапливаем сумму и запоминаем самое маленькое нечётное число. Сортировать массив не нужно.', total, smallestOdd, active: -1 }];    numbers.forEach((number, index) => {
      total += number;
      const updated = number % 2 !== 0 && (smallestOdd === undefined || number < smallestOdd);
      if (updated) smallestOdd = number;
      frames.push({ title: `Добавляем ${number} к сумме`, description: `Сумма первых ${index + 1} элементов: $${total}$. ${updated ? `Новое минимальное нечётное: $${number}$.` : number % 2 === 0 ? 'Элемент чётный: минимум нечётных не меняется.' : `Минимальное нечётное остаётся $${smallestOdd}$.`}`, total, smallestOdd, active: index });
    });
    const isEven = total % 2 === 0;
    frames.push({ title: isEven ? 'Вся сумма уже чётная' : 'Убираем минимальное нечётное', description: isEven ? `Сумма $${total} = 2 \\cdot ${total / 2}$ делится на 2. Берём все элементы — больше получить невозможно.` : `$${total} = 2 \\cdot ${Math.floor(total / 2)} + 1$ — сумма нечётна. Исключаем минимальный нечётный элемент $${smallestOdd}$: $${total} - ${smallestOdd} = ${total - smallestOdd!}$. Так мы теряем минимально возможную часть суммы.`, total, smallestOdd, active: numbers.length, excluded: isEven ? -1 : numbers.indexOf(smallestOdd!), result: maximumEvenSum(numbers) });
    return frames;
  }
  const limit = input as number;
  const crossed = new Set<number>();
  const frames: Frame[] = [{ title: 'Подготовим решето', description: `Рассматриваем числа от 2 до ${Math.max(1, limit - 1)}. Числа 0 и 1 не простые, а верхняя граница ${limit} не входит в диапазон.`, crossed: [], newlyCrossed: [] }];
  for (let candidate = 2; candidate * candidate < limit; candidate++) {
    if (!crossed.has(candidate)) {
      const newlyCrossed: number[] = [];
      for (let multiple = candidate * candidate; multiple < limit; multiple += candidate) {
        if (!crossed.has(multiple)) newlyCrossed.push(multiple);
        crossed.add(multiple);
      }
      frames.push({ title: `Вычёркиваем кратные ${candidate}`, description: `Число ${candidate} простое. Начинаем с $${candidate}^2 = ${candidate * candidate}$: меньшие кратные уже обработаны предыдущими простыми. Вычеркнуто на этом шаге: $${newlyCrossed.length}$.`, candidate, crossed: [...crossed], newlyCrossed });
    }
  }
  const result = countPrimes(limit);
  frames.push({ title: 'Остались только простые числа', description: `Все составные вычеркнуты: у каждого есть простой делитель $\\le \\sqrt{n}$. Количество простых, строго меньших ${limit}: $${result}$.`, crossed: [...crossed], newlyCrossed: [], result });
  return frames;
}
export function formatResult(value: number | boolean): string {
  return typeof value === 'boolean' ? value ? 'True' : 'False' : String(value);
}
export const repositoryFiles: Record<string, string> = { 'homework_1/README.md': readme };
for (const task of tasks) {
  repositoryFiles[`homework_1/${task.id}/solution.py`] = task.code;
  repositoryFiles[`homework_1/${task.id}/test_solution.py`] = task.tests;
  repositoryFiles[`homework_1/${task.id}/README.md`] = task.readme;
}
Object.assign(repositoryFiles, {
  'homework_1/visualization/README.md': visualizationReadme,
  'homework_1/visualization/package.json': visualizationPackage,
  'homework_1/visualization/index.html': visualizationIndex,
  'homework_1/visualization/vite.config.ts': visualizationViteConfig,
  'homework_1/visualization/tsconfig.json': visualizationTsConfig,
  'homework_1/visualization/src/App.tsx': visualizationApp,
  'homework_1/visualization/src/algorithms.ts': visualizationAlgorithms,
  'homework_1/visualization/src/main.tsx': visualizationMain,
  'homework_1/visualization/src/index.css': visualizationCss,
  'homework_1/visualization/src/utils/cn.ts': visualizationCn,
});
