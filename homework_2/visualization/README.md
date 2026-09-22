# Визуализация homework_2

React 19, TypeScript 7, Vite 8, React Flow 12, Motion 13.
Версии зависимостей закреплены в `package-lock.json`.

Три задачи: Stack vs Queue, Validate, Merge lists. Для каждой доступны
вкладки с визуализацией, объяснением, исходным Python-кодом и тестами.

- Узлы и ссылки `next`, выбор узла для просмотра значения и связи.
- Масштабирование и перемещение схемы, автоматическое размещение узлов.
- Схема всегда вписывается в область: ни один узел не уходит за край,
  высота области подстраивается под экран, есть режим на весь экран.
- Пошаговый режим, шаг назад, перемотка, проигрывание, пауза, скорость.
- Собственные входы, готовые примеры и проверка введённых значений.
- Оба варианта слияния: с dummy и без него.
- Исходные `solution.py` и `test_solution.py` загружаются из соседних папок
  при сборке через `?raw`, их можно просмотреть, скопировать и скачать.
- Адаптивная компоновка, клавиатурное управление и reduced motion.

## Docker

Из корня репозитория:

```bash
docker compose -f homework_2/visualization/docker-compose.yml up --build -d
```

Открыть [http://localhost:8082](http://localhost:8082).
Прежний адрес [http://localhost:8082/visualization/](http://localhost:8082/visualization/)
также работает.

```bash
# Остановить
docker compose -f homework_2/visualization/docker-compose.yml down
# Другой порт
PORT=8092 docker compose -f homework_2/visualization/docker-compose.yml up --build -d
```

Двухэтапная сборка: Node.js 24 собирает TypeScript и фронтенд, nginx раздаёт
статику. Контейнер работает без root с файловой системой только для чтения
и временной директорией в памяти. Для Docker-запуска локальный Node.js не нужен.
Внешние шрифты и CDN не используются.

## Разработка без Docker

Node.js 24 LTS или новее. Из корня репозитория:

```bash
cd homework_2/visualization
npm ci
npm run dev
```

Открыть [http://localhost:5174](http://localhost:5174). Изменения применяются
через Vite HMR. `npm run build` проверяет TypeScript и создаёт `dist/`.
`npm run preview` открывает собранную версию на порту 4174.

## Тесты

Из корня репозитория:

```bash
npm test --prefix homework_2/visualization
npm run build --prefix homework_2/visualization
python3 -m unittest discover -s homework_2 -t . -v
```

Vitest проверяет ввод, неизменность кадров, порядок LIFO/FIFO, все
перестановки Validate для n ≤ 6 по независимому перебору операций,
сохранность ID и объектов при слиянии, ссылки графа, вписывание схемы
во все экраны и браузерные примеры.

Проверки во вкладке «Тесты» действительно исполняются на TypeScript-модели.
Они не запускают Python: команда для Python-тестов показана отдельно.

## Структура

```text
visualization/
├── src/
│   ├── App.tsx                 # Интерфейс и управление воспроизведением
│   ├── Diagram.tsx             # Узлы, связи и интерактивная схема React Flow
│   ├── algorithms.ts           # Типизированные модели и снимки состояний
│   ├── algorithms.test.ts      # Vitest
│   ├── checks.ts               # Запускаемые в интерфейсе проверки
│   ├── content.ts              # Содержание задач и импорты Python
│   ├── CodeView.tsx            # Просмотр кода
│   ├── main.tsx
│   └── styles.css
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

Интерфейс ограничивает примеры 16 числами на вход и безопасными целыми
JavaScript. Python-решения не ограничены этими рамками и проверяются
на 100 000 элементах. При слиянии схема показывает выбранный префикс
и оставшиеся части: временные ссылки между ними опущены. Сохранение
всех кадров требует дополнительной памяти; оценки сложности в интерфейсе
относятся к Python-алгоритмам.
