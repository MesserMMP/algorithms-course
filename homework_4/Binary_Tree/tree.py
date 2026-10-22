"""Общий узел бинарного дерева для всех трёх задач."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(eq=False)
class Node:
    """Узел с целым значением; отсутствующий ребёнок обозначается None.

    Вход алгоритмов — конечное дерево без циклов и общих поддеревьев.
    Значения могут повторяться в произвольном дереве, но не в строгом BST.
    """

    value: int
    left: Node | None = None
    right: Node | None = None
