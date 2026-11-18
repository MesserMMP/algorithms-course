import {useState} from 'react';
import {FileCode2} from 'lucide-react';
import type {Algorithm, Task} from './content';
import './reading.css';

const sources = import.meta.glob<string>('../../{compare,iterative,kth}/*.py', {
  eager: true, import: 'default', query: '?raw',
});

type Method = {
  name: string;
  idea: string;
  time: string;
  memory: string;
};

const methods: Record<Task, Partial<Record<Algorithm, Method>>> = {
  compare: {
    merge: {
      name: 'Merge sort',
      idea: 'Делим диапазон пополам до одиночных элементов. При возврате из рекурсии обе половины уже упорядочены. Сравниваем первые ещё не взятые элементы и переносим меньший в результат. При равенстве берём левый, сохраняя исходный порядок повторов.',
      time: 'O(n log n) при любом порядке. На каждом из O(log n) уровней через слияния проходят все n элементов.',
      memory: 'O(n) на буфер слияния и O(log n) на стек вызовов. Отдельный список результата занимает ещё O(n).',
    }, quick: {
      name: 'Quicksort',
      idea: 'Выбираем первый элемент диапазона как опору. Один проход собирает слева значения меньше опоры, в середине равные ей, справа большие. Средний блок уже на своём месте. Меньшую боковую часть обрабатываем рекурсивно, большую продолжаем в цикле.',
      time: 'В среднем O(n log n) на случайной перестановке, в худшем случае O(n²). Если все числа равны, хватает O(n).',
      memory: 'Стек O(log n) даже при неудачных опорах, поскольку рекурсивный вызов получает не более половины диапазона. Вместе с копией для результата — O(n).',
    },
  },
  iterative: {
    merge: {
      name: 'Merge sort',
      idea: 'Начинаем с упорядоченных серий длины 1. Сливаем соседние серии попарно и удваиваем их ширину после полного прохода. Короткую последнюю серию без пары оставляем до следующего прохода. Когда ширина достигает длины массива, остаётся одна упорядоченная серия.',
      time: 'O(n log n). Ширина растёт вдвое, а каждый проход просматривает не более n элементов.',
      memory: 'O(n) на буфер слияния и O(n) на список результата. Индексы и ширина серии занимают O(1).',
    }, quick: {
      name: 'Quicksort',
      idea: 'В стеке храним границы участков. Снимаем верхний, разбиваем его относительно первого значения и добавляем боковые части длиной от двух. Большую кладём первой, поэтому следующей со стека снимается меньшая. Когда стек пуст, весь массив упорядочен.',
      time: 'В среднем O(n log n) на случайной перестановке, O(n²) в худшем случае и O(n) для массива равных значений.',
      memory: 'Стек O(log n). Пока в стеке растёт число отложенных частей, обрабатываемая часть уменьшается как минимум вдвое. С учётом копии результата — O(n).',
    },
  },
  kth: {select: {
    name: 'Quickselect',
    idea: 'Искомому рангу k по убыванию соответствует индекс n − k по возрастанию. Разбиваем рабочую копию на три группы вокруг случайной опоры. Если индекс попал в блок равных, ответ найден. Иначе продолжаем только в той боковой группе, где лежит индекс. Каждый такой шаг уменьшает диапазон и сохраняет искомое значение.',
    time: 'Ожидаемое время O(n). Случайная опора с постоянной вероятностью отсекает существенную долю диапазона. Если каждый раз отсекается лишь один элемент, потребуется O(n²).',
    memory: 'Разбиение и границы диапазона требуют O(1). Вместе с рабочей копией массива функция использует O(n). Ответ — одно значение.',
  }},
};

const files: Record<Task, [string, string][]> = {
  compare: [
    ['compare/sorts.py', 'Рекурсивные сортировки'],
    ['compare/_operations.py', 'Слияние и разбиение'],
    ['compare/timing.py', 'Декоратор времени'],
    ['compare/benchmark.py', 'Эксперимент'],
    ['compare/test_compare.py', 'Тесты'],
  ],
  iterative: [
    ['iterative/sorts.py', 'Итеративные сортировки'],
    ['compare/_operations.py', 'Слияние и разбиение'],
    ['iterative/test_iterative.py', 'Тесты'],
  ],
  kth: [
    ['kth/quickselect.py', 'Quickselect'],
    ['compare/_operations.py', 'Разбиение'],
    ['kth/test_quickselect.py', 'Тесты'],
  ],
};

function Source({task}: {task: Task}) {
  const [path, setPath] = useState(files[task][0][0]);
  return <div className="reader-source">
    <label className="reader-file"><FileCode2 size={17} aria-hidden="true" />
      <select value={path} onChange={e => setPath(e.target.value)} aria-label="Исходный файл">
        {files[task].map(([value, label]) => <option key={value} value={value}>{label} · {value.split('/').pop()}</option>)}
      </select>
    </label>
    <pre tabIndex={0} aria-label={path}><code>{sources['../../' + path]}</code></pre>
  </div>;
}

export default function Reading({task, algorithm = task === 'kth' ? 'select' : 'merge'}: {task: Task; algorithm?: Algorithm}) {
  const method = methods[task][algorithm];
  if (!method) return null;
  return <section className="reader" aria-label="Разбор выбранного метода">
    <div className="reader-notes">
      <h3>{method.name}</h3>
      <p>{method.idea}</p>
      <dl>
        <dt>Время</dt><dd>{method.time}</dd>
        <dt>Память</dt><dd>{method.memory}</dd>
      </dl>
      {task === 'compare' && <p className="reader-cli">Сравнить время двух методов на трёх массивах можно командой <code>python3 -m homework_6.compare.benchmark</code>.</p>}
    </div>
    <Source key={task} task={task}/>
  </section>;
}
