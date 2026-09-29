"""Поиск двух различных индексов за один проход."""


def two_sum(arr: list[int], k: int) -> tuple[int, int]:
    """Вернуть i < j, для которых arr[i] + arr[j] == k.

    По условию пара единственная. Если пары нет, выбросить ValueError.
    Входной массив не изменяется.
    """
    seen: dict[int, int] = {}
    for j, value in enumerate(arr):
        complement = k - value
        if complement in seen:
            return seen[complement], j
        seen[value] = j
    raise ValueError("Пара с заданной суммой не найдена")


if __name__ == "__main__":
    print(*two_sum([1, 3, 4, 10], 7))
    print(*two_sum([5, 5, 1, 4], 10))
