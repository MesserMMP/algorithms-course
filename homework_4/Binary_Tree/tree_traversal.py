"""Вставка в BST и шесть итеративных обходов бинарного дерева."""

from __future__ import annotations

from collections.abc import Iterable

if __package__:
    from .tree import Node
else:
    from tree import Node


class BST:
    """Строгое дерево поиска: слева значения меньше, справа больше.

    Дубликат не добавляется. Балансировка при вставке не выполняется.
    """

    def __init__(self, values: Iterable[int] = ()) -> None:
        self.root: Node | None = None
        for value in values:
            self.insert(value)

    def insert(self, value: int) -> bool:
        """Добавить значение; вернуть True для нового, False для дубликата.

        Время O(h), дополнительная память O(1), где h — высота дерева.
        """
        if self.root is None:
            self.root = Node(value)
            return True

        current = self.root
        while True:
            if value == current.value:
                return False
            if value < current.value:
                if current.left is None:
                    current.left = Node(value)
                    return True
                current = current.left
            else:
                if current.right is None:
                    current.right = Node(value)
                    return True
                current = current.right


def _traverse(root: Node | None, order: str) -> list[int]:
    """Исполнить порядок N/L/R; стек хранит поддеревья и посещения."""
    if root is None:
        return []

    result: list[int] = []
    stack: list[tuple[Node, bool]] = [(root, False)]
    while stack:
        node, visit = stack.pop()
        if visit:
            result.append(node.value)
            continue

        # LIFO: действия кладутся в обратном порядке исполнения.
        for action in reversed(order):
            if action == "N":
                stack.append((node, True))
            elif action == "L" and node.left is not None:
                stack.append((node.left, False))
            elif action == "R" and node.right is not None:
                stack.append((node.right, False))
    return result


def preorder(root: Node | None) -> list[int]:
    """NLR: узел → левое поддерево → правое поддерево."""
    return _traverse(root, "NLR")


def inorder(root: Node | None) -> list[int]:
    """LNR: левое поддерево → узел → правое поддерево."""
    return _traverse(root, "LNR")


def postorder(root: Node | None) -> list[int]:
    """LRN: левое поддерево → правое поддерево → узел."""
    return _traverse(root, "LRN")


def reverse_preorder(root: Node | None) -> list[int]:
    """NRL: узел → правое поддерево → левое поддерево."""
    return _traverse(root, "NRL")


def reverse_inorder(root: Node | None) -> list[int]:
    """RNL: правое поддерево → узел → левое поддерево."""
    return _traverse(root, "RNL")


def reverse_postorder(root: Node | None) -> list[int]:
    """RLN: правое поддерево → левое поддерево → узел."""
    return _traverse(root, "RLN")
