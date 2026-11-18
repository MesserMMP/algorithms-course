"""Сортировки без рекурсивных вызовов, результат — отдельный список."""

from ..compare._operations import Trace, merge, partition


def mergesort(values, *, on_event=None):
    data = list(values)
    size = len(data)
    buffer = data.copy()
    trace = Trace(data, on_event) if on_event is not None else None
    if trace is not None:
        trace.emit("start", 0, size)
    width = 1
    while width < size:
        if trace is not None:
            trace.emit("pass", 0, size, width=width)
        for lo in range(0, size - width, 2 * width):
            mid = lo + width
            hi = min(mid + width, size)
            merge(data, buffer, lo, mid, hi, trace, width=width)
        width *= 2
    if trace is not None:
        trace.emit("done", 0, size)
    return data


def quicksort(values, *, on_event=None):
    data = list(values)
    size = len(data)
    stack = [(0, size)] if size > 1 else []
    trace = Trace(data, on_event) if on_event is not None else None
    if trace is not None:
        trace.emit("start", 0, size, stack=stack.copy())

    while stack:
        lo, hi = stack.pop()
        context = {"stack": stack.copy()} if trace is not None else {}
        lt, gt = partition(data, lo, hi, lo, trace, **context)
        left, right = (lo, lt), (gt, hi)
        # Меньшую часть помещаем последней, чтобы первой снять её со стека.
        if lt - lo < hi - gt:
            left, right = right, left
        for start, stop in (left, right):
            if stop - start > 1:
                stack.append((start, stop))

    if trace is not None:
        trace.emit("done", 0, size, stack=[])
    return data
