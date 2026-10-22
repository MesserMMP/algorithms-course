"""Линейная проверка баланса с высотами на стеке текущего пути."""

from __future__ import annotations

from dataclasses import dataclass

if __package__:
    from .tree import Node
else:
    from tree import Node


@dataclass
class _Frame:
    node: Node
    phase: int = 0
    left_height: int = 0
    right_height: int = 0


def is_balanced(root: Node | None) -> bool:
    """Проверить разность высот детей ≤ 1 у каждого узла.

    Высота пустого дерева 0, листа 1. Время O(n), память O(h).
    Исходные узлы не меняются; словарь высот всех узлов не нужен.
    """
    if root is None:
        return True

    stack = [_Frame(root)]
    while stack:
        frame = stack[-1]
        if frame.phase == 0:
            frame.phase = 1
            if frame.node.left is not None:
                stack.append(_Frame(frame.node.left))
        elif frame.phase == 1:
            frame.phase = 2
            if frame.node.right is not None:
                stack.append(_Frame(frame.node.right))
        else:
            if abs(frame.left_height - frame.right_height) > 1:
                return False
            height = 1 + max(frame.left_height, frame.right_height)
            stack.pop()
            if stack:
                parent = stack[-1]
                if parent.phase == 1:
                    parent.left_height = height
                else:
                    parent.right_height = height
    return True
