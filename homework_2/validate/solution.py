"""Проверка последовательностей стека за O(n) времени и O(n) памяти."""


def validate_stack_sequences(pushed: list[int], popped: list[int]) -> bool:
    """По условию элементы уникальны, popped — перестановка pushed.

    Входные списки не изменяются. Пара пустых списков также допустима.
    Для разных длин возвращаем False.
    """
    if len(pushed) != len(popped):
        return False
    stack: list[int] = []
    j = 0
    for value in pushed:
        stack.append(value)
        while stack and j < len(popped) and stack[-1] == popped[j]:
            stack.pop()
            j += 1
    return j == len(popped)
