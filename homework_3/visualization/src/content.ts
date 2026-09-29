import { examples } from './examples';
import twoCode from '../../two_sum/solution.py?raw';
import anaCode from '../../anagrams/solution.py?raw';
import hashCode from '../../hash_table/solution.py?raw';
import twoTests from '../../two_sum/test_solution.py?raw';
import anaTests from '../../anagrams/test_solution.py?raw';
import hashTests from '../../hash_table/test_solution.py?raw';
import type { Task } from './algorithms';
export const content: Record<Task, {name: string; tag: string; subtitle: string; time: string; memory: string; code: string; tests: string; idea: string; proof: string; complexity: string; pseudo: string[]; examples: {name: string; input: string; target?: string}[]}> = {
  two_sum: {
    name: 'Two sum', tag: '01', subtitle: 'Поиск двух индексов с заданной суммой', time: 'O(n)', memory: 'O(n)', code: twoCode, tests: twoTests,
    idea: 'Для каждого числа x ищем дополнение k − x в словаре уже пройденных чисел. Если оно есть, возвращаем сохранённый индекс и текущий. Иначе запоминаем x и его индекс.',
    proof: 'Перед итерацией j словарь содержит числа с индексами строго меньше j. Поэтому найденная пара использует два разных элемента и имеет возрастающие индексы. Когда дойдём до правого элемента единственной пары, левый уже будет в словаре.',
    complexity: 'Ожидаемое время O(n), дополнительная память O(n). При патологических коллизиях словаря время O(n²). Оценка предполагает O(1) для арифметики и хеширования целых. В Python числа произвольной длины. Если пары нет, выбрасывается ValueError.',
    pseudo: ['seen = {}', 'for j, x in enumerate(arr):', '    if k - x in seen:', '        return seen[k - x], j', '    seen[x] = j', 'raise ValueError'],
    examples: examples.two_sum,
  },
  anagrams: {
    name: 'Anagrams', tag: '02', subtitle: 'Группировка слов-анаграмм', time: 'O(n · m log m)', memory: 'O(n · m)', code: anaCode, tests: anaTests,
    idea: 'Сортируем символы каждого слова. Анаграммы получают одну и ту же подпись: eat, tea и ate превращаются в aet. Используем подпись как ключ словаря, а слова добавляем в список этой группы.',
    proof: 'Две строки имеют одинаковую отсортированную последовательность тогда и только тогда, когда количества всех символов совпадают. Поэтому в одну группу попадают все и только анаграммы. Повторы сохраняются.',
    complexity: 'n — число слов, m — максимальная длина. Ожидаемое время O(n · (1 + m log(m + 1))), дополнительная память O(n · (m + 1)) вместе с результатом. Краткие оценки сверху используют m ≥ 2. Регистр, пробелы и кодовые точки Unicode значимы; нормализации нет. Порядок групп произвольный по условию, здесь он соответствует первому появлению.',
    pseudo: ['groups = {}', 'for word in strs:', '    key = "".join(sorted(word))', '    groups.setdefault(key, []).append(word)', 'return list(groups.values())'],
    examples: examples.anagrams,
  },
  hash_table: {
    name: 'Хеш-таблица', tag: '03', subtitle: 'Вставка, поиск, удаление и разрешение коллизий', time: 'O(1)*', memory: 'O(n + c)', code: hashCode, tests: hashTests,
    idea: 'Массив корзин состоит только из списков. Каждая корзина — цепочка записей [hash, key, value]. Индекс корзины: hash(key) % capacity. При совпадении индекса сравниваем ключи. Существующий ключ обновляем, новый добавляем.',
    proof: 'Каждая запись хранится в корзине, определяемой её хешем и текущей ёмкостью. Все операции просматривают эту корзину и сравнивают ключи. При удвоении ёмкости перераспределяем каждую запись, сохраняя этот инвариант. Нехешируемые ключи вызывают TypeError, отсутствующие — KeyError.',
    complexity: '* Ожидаемое O(1) для поиска и удаления; ожидаемое амортизированное O(1) для вставки при равномерном хешировании. Худший случай O(n + c) у вставки с расширением, O(n) у поиска и удаления. Память O(n + c), где c — ёмкость; после удаления она не уменьшается. В модели — целочисленные ключи и стартовая ёмкость 4; Python поддерживает любые hashable-ключи и по умолчанию начинает с 8.',
    pseudo: ['buckets = [[] for _ in range(capacity)]', 'index = hash(key) % capacity', 'if key exists: update value', 'if load > 0.75: resize and rehash', 'append [hash, key, value]', 'search / delete: scan the chain'],
    examples: examples.hash_table,
  },
};
