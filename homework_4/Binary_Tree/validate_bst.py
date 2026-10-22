"""Проверка строгого BST с границами от всех предков."""

from __future__ import annotations

if __package__:
    from .tree import Node
else:
    from tree import Node


def is_valid_bst(root: Node | None) -> bool:
    """Вернуть, удовлетворяет ли каждый узел строгим границам BST.

    None — корректное пустое BST. Дубликаты запрещены. Время O(n),
    дополнительная память O(h); исходное дерево не изменяется.
    """
    if root is None:
        return True

    stack: list[tuple[Node, int | None, int | None]] = [(root, None, None)]
    while stack:
        node, lower, upper = stack.pop()
        if lower is not None and node.value <= lower:
            return False
        if upper is not None and node.value >= upper:
            return False

        if node.right is not None:
            stack.append((node.right, node.value, upper))
        if node.left is not None:
            stack.append((node.left, lower, node.value))
    return True
