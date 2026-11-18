# ДЗ 6 · Сортировки

| Задача | Решение и разбор |
| --- | --- |
| [Compare](compare/README.md) | Рекурсивные mergesort и quicksort, декоратор времени и [эксперимент на трёх типах входа](compare/BENCHMARK.md). |
| [Iterative](iterative/README.md) | Слияние снизу вверх и quicksort с явным стеком диапазонов. |
| [K-th](kth/README.md) | Quickselect находит k-е наибольшее число с учётом повторов. |

В каждой папке есть реализация, разбор корректности, оценка времени и памяти, пошаговый пример и тесты. Сортировки возвращают новый список. Все три задачи сохраняют входной массив.

## Запуск визуализации

Из корня репозитория:

```sh
docker compose -f homework_6/visualization/docker-compose.yml up --build -d
```

Откройте [визуализацию ДЗ6](http://localhost:8086/visualization/). В каждом режиме можно выбрать пример, ввести свой массив, менять скорость и переходить к любому шагу. Для Compare эксперимент по времени запускается командой из раздела ниже. События для анимации записываются в самих алгоритмах. Для воспроизводимости Quickselect в визуализации получает генератор со стартовым значением 42.

Остановить сервис:

```sh
docker compose -f homework_6/visualization/docker-compose.yml down
```

## Тесты и измерения

```sh
python3 -m unittest discover -s homework_6 -t . -v
python3 -m homework_6.compare.benchmark
```

Запуск тестов в Docker:

```sh
docker compose -f homework_6/visualization/docker-compose.yml --profile tests run --build --rm tests
```

Локальная разработка и проверка интерфейса описаны в [визуализации](visualization/README.md).
