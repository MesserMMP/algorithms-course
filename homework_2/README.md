# Алгоритмы на Python · Домашняя работа 2

Python 3.10+. В Python-решениях и их тестах нет сторонних библиотек.
Визуализация — отдельное приложение на React, TypeScript, React Flow и Motion.

| Задача | Файлы | Сложность |
| --- | --- | --- |
| [Stack vs Queue](stack_vs_queue/README.md) | Связные стек и очередь, тесты | O(1) на операцию, O(n) хранение |
| [Validate](validate/README.md) | Проверка порядка операций, тесты | O(n) время и память |
| [Merge lists](merge_lists/README.md) | Слияние с dummy и без, тесты | O(n+m) время, O(1) доп. память |
| [Визуализация](visualization/README.md) | Интерактивный практикум и Docker | Отдельное веб-приложение |

В каждой задаче: `solution.py`, `test_solution.py`, `README.md` с идеей,
обоснованием корректности, оценкой сложности и пошаговым примером.

## Все Python-тесты

Из корня репозитория:

```bash
python3 -m unittest discover -s homework_2 -t . -v
```

Можно запускать `python3 -m unittest -v` из любой из трёх папок задач.
10 тестовых методов включают тысячи проверок, полный перебор малых
перестановок, случайные входы с фиксированным seed и границы в 100 000 элементов.

## Визуализация через Docker

Из корня репозитория:

```bash
docker compose -f homework_2/visualization/docker-compose.yml up --build -d
```

Открыть [http://localhost:8082](http://localhost:8082).

Остановить:

```bash
docker compose -f homework_2/visualization/docker-compose.yml down
```

Без Docker:

```bash
cd homework_2/visualization
npm ci
npm run dev
```

Для локальной разработки нужен Node.js 24+. Адрес: [http://localhost:5174](http://localhost:5174).
Для запуска через Docker достаточно самого Docker.

Проверки визуализации: `npm test --prefix homework_2/visualization`.
Проверка TypeScript и сборка: `npm run build --prefix homework_2/visualization`.
