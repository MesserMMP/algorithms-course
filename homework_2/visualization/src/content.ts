import type { TaskId } from './algorithms';
import stackCode from '../../stack_vs_queue/solution.py?raw';
import validateCode from '../../validate/solution.py?raw';
import mergeCode from '../../merge_lists/solution.py?raw';
import stackTests from '../../stack_vs_queue/test_solution.py?raw';
import validateTests from '../../validate/test_solution.py?raw';
import mergeTests from '../../merge_lists/test_solution.py?raw';

export type Task = {
  id: TaskId; title: string; short: string; description: string;
  labels: string[]; defaults: [string, string]; presets: { label: string; values: [string, string] }[];
  time: string; memory: string; costNote: string; code: string; tests: string;
  explanation: { title: string; text: string }[];
};
export const tasks: Task[] = [
  {
    id: 'stack_vs_queue', title: 'Stack vs Queue', short: 'Стек и очередь',
    description: 'Стек и очередь на односвязных списках. Один набор чисел — два порядка извлечения.',
    labels: ['Добавляемые числа'], defaults: ['4 8 15 16', ''],
    presets: [{ label: 'Обычный', values: ['4 8 15 16', ''] }, { label: 'Повторы', values: ['3 -1 3 0', ''] }, { label: 'Пустые', values: ['', ''] }],
    time: 'O(1)', memory: 'O(n)', costNote: 'Время одной операции. Память всей структуры.', code: stackCode, tests: stackTests,
    explanation: [
      { title: 'Стек · LIFO', text: 'push создаёт узел перед вершиной. pop возвращает её значение и сдвигает указатель на next. Последний добавленный элемент извлекается первым.' },
      { title: 'Очередь · FIFO', text: 'enqueue добавляет узел после tail, dequeue удаляет head. Первый добавленный элемент извлекается первым. После удаления последнего узла head и tail равны None.' },
      { title: 'Сложность и корректность', text: 'Операции меняют постоянное число указателей: O(1) времени. Цепочка стека сохраняет обратный порядок добавления, цепочка очереди — прямой. Для n значений нужно n узлов: O(n) памяти.' },
    ],
  },
  {
    id: 'validate', title: 'Validate', short: 'Последовательности стека',
    description: 'Можно ли получить popped из pushed с помощью операций push и pop на пустом стеке?',
    labels: ['pushed', 'popped'], defaults: ['1 2 3 4 5', '1 3 5 4 2'],
    presets: [{ label: 'True', values: ['1 2 3 4 5', '1 3 5 4 2'] }, { label: 'False', values: ['1 2 3', '3 1 2'] }, { label: 'Обратный', values: ['1 2 3 4', '4 3 2 1'] }],
    time: 'O(n)', memory: 'O(n)', costNote: 'Каждое число добавляется и извлекается не более одного раза.', code: validateCode, tests: validateTests,
    explanation: [
      { title: 'Добавление', text: 'Проходим pushed слева направо и добавляем числа в стек. Индекс j указывает на очередной элемент popped, который нужно получить.' },
      { title: 'Извлечение', text: 'Пока вершина равна popped[j], извлекаем её и увеличиваем j. При несовпадении извлекать нельзя: это нарушит порядок. Остаётся добавить следующее число.' },
      { title: 'Результат', text: 'Если j равен длине popped, получен нужный порядок. Иначе оставшийся стек мешает извлечь ожидаемое число. При уникальных элементах жадное извлечение не упускает допустимого решения. Суммарно O(n) времени и O(n) памяти.' },
    ],
  },
  {
    id: 'merge_lists', title: 'Merge lists', short: 'Слияние списков',
    description: 'Объединение двух отсортированных списков перестановкой исходных узлов.',
    labels: ['list1', 'list2'], defaults: ['1 2 4', '1 3 4'],
    presets: [{ label: 'Из условия', values: ['1 2 4', '1 3 4'] }, { label: 'Чередование', values: ['-3 2 8', '-1 4 9'] }, { label: 'Пустой вход', values: ['', '1 2 3'] }],
    time: 'O(n + m)', memory: 'O(1)', costNote: 'Дополнительная память. Узлы используются повторно.', code: mergeCode, tests: mergeTests,
    explanation: [
      { title: 'Выбор меньшей головы', text: 'Головы списков — минимальные оставшиеся элементы. Меньшую присоединяем к результату, затем сдвигаем указатель этого списка. При равенстве выбираем list1.' },
      { title: 'Два способа', text: 'Фиктивный узел dummy позволяет одинаково обработать первый и последующие узлы. Без него отдельно выбираем head и tail. Когда один вход пуст, остаток второго присоединяется целиком.' },
      { title: 'Сохранение узлов', text: 'Меняются только ссылки next. Входы должны быть без циклов и общих узлов. Выбранный префикс остаётся отсортированным, каждый узел используется ровно один раз. Время O(n+m), дополнительная память O(1), рекурсии нет.' },
    ],
  },
];
