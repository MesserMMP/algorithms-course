"""Итеративное слияние узлов двух отсортированных односвязных списков."""
from __future__ import annotations


class ListNode:
    __slots__ = ("val", "next")

    def __init__(self, val: int = 0, next: ListNode | None = None):
        self.val = val
        self.next = next


def merge_with_dummy(list1: ListNode | None,
                     list2: ListNode | None) -> ListNode | None:
    """Меняет связи исходных узлов. Списки не имеют общих узлов и циклов."""
    dummy = ListNode()
    tail = dummy
    while list1 is not None and list2 is not None:
        if list1.val <= list2.val:
            tail.next = list1
            list1 = list1.next
        else:
            tail.next = list2
            list2 = list2.next
        tail = tail.next
    tail.next = list1 if list1 is not None else list2
    return dummy.next


def merge_without_dummy(list1: ListNode | None,
                        list2: ListNode | None) -> ListNode | None:
    """То же слияние, но без создания даже вспомогательного узла."""
    if list1 is None:
        return list2
    if list2 is None:
        return list1
    if list1.val <= list2.val:
        head = tail = list1
        list1 = list1.next
    else:
        head = tail = list2
        list2 = list2.next
    while list1 is not None and list2 is not None:
        if list1.val <= list2.val:
            tail.next = list1
            list1 = list1.next
        else:
            tail.next = list2
            list2 = list2.next
        tail = tail.next
    tail.next = list1 if list1 is not None else list2
    return head
