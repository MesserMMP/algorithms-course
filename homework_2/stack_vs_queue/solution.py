"""Стек и очередь на односвязных списках; Python 3.10+."""
from __future__ import annotations

from typing import Generic, Iterator, TypeVar

T = TypeVar("T")


class _Node(Generic[T]):
    __slots__ = ("value", "next")

    def __init__(self, value: T, next_node: _Node[T] | None = None):
        self.value = value
        self.next = next_node


class Stack(Generic[T]):
    """LIFO: итерация от вершины к основанию. Пустой pop/peek: IndexError."""

    def __init__(self):
        self._head: _Node[T] | None = None
        self._size = 0

    def push(self, value: T) -> None:
        self._head = _Node(value, self._head)
        self._size += 1

    def pop(self) -> T:
        if self._head is None:
            raise IndexError("pop from empty stack")
        node = self._head
        self._head = node.next
        self._size -= 1
        return node.value

    def peek(self) -> T:
        if self._head is None:
            raise IndexError("peek from empty stack")
        return self._head.value

    def is_empty(self) -> bool:
        return self._head is None

    def __len__(self) -> int:
        return self._size

    def __iter__(self) -> Iterator[T]:
        node = self._head
        while node is not None:
            yield node.value
            node = node.next


class Queue(Generic[T]):
    """FIFO: добавление в хвост, извлечение из головы, итерация от головы."""

    def __init__(self):
        self._head: _Node[T] | None = None
        self._tail: _Node[T] | None = None
        self._size = 0

    def enqueue(self, value: T) -> None:
        node = _Node(value)
        if self._tail is None:
            self._head = node
        else:
            self._tail.next = node
        self._tail = node
        self._size += 1

    def dequeue(self) -> T:
        if self._head is None:
            raise IndexError("dequeue from empty queue")
        node = self._head
        self._head = node.next
        if self._head is None:
            self._tail = None
        self._size -= 1
        return node.value

    def peek(self) -> T:
        if self._head is None:
            raise IndexError("peek from empty queue")
        return self._head.value

    def is_empty(self) -> bool:
        return self._head is None

    def __len__(self) -> int:
        return self._size

    def __iter__(self) -> Iterator[T]:
        node = self._head
        while node is not None:
            yield node.value
            node = node.next
