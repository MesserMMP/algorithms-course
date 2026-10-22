# Алгоритмы на Python · Домашняя работа 4

Три задачи находятся в [`Binary_Tree/`](Binary_Tree/README.md), как требует
формат сдачи. Отдельное приложение на TypeScript показывает алгоритмы
на деревьях пошагово. Для Python-решений не нужны сторонние библиотеки.

| Задача | Файлы решения | Идея |
|---|---|---|
| Tree Traversal | [`tree.py`](Binary_Tree/tree.py), [`tree_traversal.py`](Binary_Tree/tree_traversal.py) | Вставка по сравнению ключей и шесть порядков посещения узлов |
| Validate BST | [`validate_bst.py`](Binary_Tree/validate_bst.py) | Проверка границ, унаследованных от всех предков |
| Balanced Binary Tree | [`balanced_binary_tree.py`](Binary_Tree/balanced_binary_tree.py) | Вычисление высот снизу вверх и проверка каждого узла |

В [`Binary_Tree/README.md`](Binary_Tree/README.md) для каждой задачи приведены
пять обязательных частей: решение, объяснение корректности, сложность,
пошаговый пример и тесты. Обозначения: `n` — количество узлов, `h` — высота.

| Операция | Время | Дополнительная память |
|---|---|---|
| Вставка в обычное BST | O(h), в худшем случае O(n) | O(1) для итеративного поиска места |
| Любой обход | O(n) | O(h) для стека и O(n) для возвращаемого списка |
| Проверка BST | O(n) в худшем случае | O(h) |
| Проверка баланса | O(n) в худшем случае | O(h) |

Обычное BST не балансируется автоматически: для возрастающей
последовательности высота может стать линейной. Детали соглашений
о высоте и дубликатах описаны рядом с реализацией.

## Быстрый запуск в Docker

Из корня репозитория, с запущенным Docker Engine / Docker Desktop:

```bash
docker compose -f homework_4/visualization/docker-compose.yml up --build -d
```

Открыть [http://localhost:8084](http://localhost:8084).
Интерфейс доступен также по адресу `/visualization/`.
Для другого порта: `PORT=8094 docker compose -f homework_4/visualization/docker-compose.yml up --build -d`.

Python-тесты в отдельном контейнере:

```bash
docker compose -f homework_4/visualization/docker-compose.yml --profile tests run --build --rm tests
```

Остановка приложения:

```bash
docker compose -f homework_4/visualization/docker-compose.yml down
```

## Локальные проверки

Из корня репозитория:

```bash
python3 -m unittest discover -s homework_4 -t . -v
```

Для интерфейса нужен Node.js 24+:

```bash
cd homework_4/visualization
npm ci
npm test
npm run build
npm run dev
```

Открыть [http://localhost:5176](http://localhost:5176).
Проверки в браузере:

```bash
# Из homework_4/visualization
npx playwright install chromium
npm run test:e2e
```

Конфигурация Playwright содержит пять размеров экрана: 320, 390, 768,
1024 и 1440 px. Скриншоты и артефакты прогонов сохраняются локально
в `visualization/test-results/` и не входят в Git.

## Визуализация

[`visualization/`](visualization/README.md) — отдельное приложение React +
TypeScript. В нём показаны вставка и обходы, перенос допустимых границ
при проверке BST, а также расчёт высот и разности высот при проверке
баланса. Готовые нетривиальные сценарии и собственный ввод позволяют
исследовать правильные деревья и нарушения условий.

Управление включает переходы по шагам, воспроизведение, паузу и скорость.
Исходные Python-решения подключены из `Binary_Tree/` при сборке.
Браузер воспроизводит TypeScript-модель; Python проверяется отдельно
через `unittest`. Оценки сложности относятся к Python-алгоритмам,
без расходов на историю кадров и отрисовку интерфейса.
