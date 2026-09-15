# Алгоритмы на Python · Домашняя работа 1

Python 3.10+, внешних зависимостей нет.

- palindrome/ — проверка палиндрома без строк;
- sum/ — максимальная чётная сумма;
- prime/ — количество простых чисел строго меньше N.

В каждой папке: solution.py, test_solution.py и README.md с идеей, доказательством, сложностью, пошаговым примером и инструкцией запуска.

Запускайте тесты каждой задачи отдельно из её папки:

    cd homework_1/palindrome
    python -m unittest -v

Повторите для sum и prime. Или из корня репозитория:

    python -m unittest discover -s homework_1/palindrome -p 'test_*.py' -v
    python -m unittest discover -s homework_1/sum -p 'test_*.py' -v
    python -m unittest discover -s homework_1/prime -p 'test_*.py' -v

Веб-приложение предоставляет интерактивные трассировки тех же алгоритмов и быстрые проверки на JavaScript. Эти проверки не заменяют запуск Python unittest. Полное покрытие бесконечного множества входов невозможно; набор сочетает категории границ, исчерпывающую проверку ограниченных диапазонов и независимые эталоны.

## Как посмотреть визуализацию

Визуализация лежит в visualization/. Самый простой способ — Docker Compose: одна команда, ничего устанавливать не нужно (кроме самого Docker). Из корня репозитория:

    docker compose -f homework_1/visualization/docker-compose.yml up

Затем откройте http://localhost:8080. При первом запуске соберётся образ (несколько минут), дальше — мгновенно. Остановить: Ctrl+C или `docker compose down`.

Альтернатива без Compose:

    docker build -f homework_1/visualization/Dockerfile -t homework1-visualization .
    docker run --rm -p 8080:80 homework1-visualization

Альтернатива без Docker — локальный запуск (Node.js 18+ и npm):

    cd homework_1/visualization
    npm install
    npm run dev

и откройте адрес, который выведет Vite (по умолчанию http://localhost:5173).

Подробности — в visualization/README.md.
