# Визуализация алгоритмов (ДЗ-1)

Интерактивный веб-практикум: пошаговые трассировки решений задач ДЗ-1
(палиндром, максимальная чётная сумма, простые числа) на React + Vite + Tailwind.

Приложение подхватывает Python-файлы задач напрямую из репозитория
(`../palindrome/solution.py?raw` и т.д.), поэтому код во вкладках «Код»
всегда совпадает с тем, что сдаётся.

## Требования

- Для Docker-запуска: только Docker (с Compose).
- Для локального запуска: Node.js 18+ (использовалась 22.x) и npm.

## Запуск через Docker Compose (рекомендуется)

Из корня репозитория — одна команда:

```bash
docker compose -f homework_1/visualization/docker-compose.yml up
```

Откройте http://localhost:8080. При первом запуске соберётся образ (несколько минут), дальше — мгновенно.

Остановить: `Ctrl+C` или `docker compose -f homework_1/visualization/docker-compose.yml down`.

Если порт 8080 занят — поправьте левую часть в `docker-compose.yml` (`"3000:80"` → http://localhost:3000).

## Запуск через Docker (без Compose)

Сборка из корня репозитория (контекст — корень репозитория):

```bash
docker build -f homework_1/visualization/Dockerfile -t homework1-visualization .
docker run --rm -p 8080:80 homework1-visualization
```

Откройте http://localhost:8080. Внутри контейнера — двухэтапная сборка:
node:22-alpine собирает статику (`npm ci` + `vite build`), затем nginx:1.27-alpine
раздаёт готовый единственный `index.html`. Проверяющему не нужно ставить
Node.js — достаточно Docker.

Порт 8080 можно заменить на любой свободный: `-p 3000:80` → http://localhost:3000.

## Локальный запуск в режиме разработки

```bash
cd homework_1/visualization
npm install
npm run dev
```

Откройте в браузере адрес, который выведет Vite (по умолчанию http://localhost:5173).

## Продакшен-сборка

```bash
npm run build
```

Благодаря плагину `vite-plugin-singlefile` весь app (JS, CSS, шрифты) собирается
в один файл `dist/index.html` — его можно открыть в браузере двойным кликом
или куда-нибудь выложить без сервера.

```bash
npm run preview   # локальный просмотр собранной версии
```

## Структура

```
visualization/
├── Dockerfile            # двухэтапная сборка: node (build) → nginx (раздача)
├── docker-compose.yml    # одна команда: docker compose up
├── index.html            # входная HTML-страница
├── package.json          # скрипты и зависимости
├── vite.config.ts        # конфиг Vite (react, tailwind, singlefile)
├── tsconfig.json
└── src/
    ├── main.tsx          # точка входа React
    ├── App.tsx           # UI: вкладки, шаги трассировки, модалки
    ├── algorithms.ts     # модели алгоритмов + raw-импорты Python-файлов задач
    ├── Latex.tsx         # рендер математических формул через KaTeX
    ├── index.css         # стили (Tailwind 4)
    └── utils/cn.ts       # объединение классов
```

## Важно

- Визуализация — наглядное дополнение; она **не заменяет** запуск Python-тестов
  (`python -m unittest -v` в папках `palindrome/`, `sum/`, `prime/`).
- Приложение читает файлы задач по относительным путям. Если перемещаете папку
  `visualization/`, сохраняйте её соседством с `palindrome/`, `sum/`, `prime/`
  внутри `homework_1/`, либо поправьте пути в `src/algorithms.ts`.
