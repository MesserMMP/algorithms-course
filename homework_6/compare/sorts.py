"""Рекурсивные сортировки. Обе возвращают новый список."""

from ._operations import Trace, merge, partition


def mergesort(values, *, on_event=None):
    data = list(values)
    buffer = data.copy()
    trace = Trace(data, on_event) if on_event is not None else None

    def sort(lo, hi, depth):
        if hi - lo < 2:
            return
        mid = (lo + hi) // 2
        if trace is not None:
            trace.emit("split", lo, hi, mid=mid, depth=depth)
        sort(lo, mid, depth + 1)
        sort(mid, hi, depth + 1)
        merge(data, buffer, lo, mid, hi, trace, depth=depth)

    if trace is not None:
        trace.emit("start", 0, len(data))
    sort(0, len(data), 0)
    if trace is not None:
        trace.emit("done", 0, len(data))
    return data


def quicksort(values, *, on_event=None):
    data = list(values)
    trace = Trace(data, on_event) if on_event is not None else None

    def sort(lo, hi, depth):
        while hi - lo > 1:
            lt, gt = partition(data, lo, hi, lo, trace, depth=depth)
            # Рекурсия только для меньшей части ограничивает глубину стека.
            if lt - lo < hi - gt:
                sort(lo, lt, depth + 1)
                lo = gt
            else:
                sort(gt, hi, depth + 1)
                hi = lt

    if trace is not None:
        trace.emit("start", 0, len(data))
    sort(0, len(data), 0)
    if trace is not None:
        trace.emit("done", 0, len(data))
    return data
