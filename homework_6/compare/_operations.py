"""Операции над полуинтервалами [lo, hi), общие для трёх задач."""


class Trace:
    """Снимки создаются только при подключённом наблюдателе."""

    def __init__(self, values, callback, **context):
        self.values = values
        self.ids = list(range(len(values)))
        self.callback = callback
        self.context = context

    def emit(self, kind, lo, hi, **details):
        self.callback({
            "kind": kind,
            "values": self.values.copy(),
            "ids": self.ids.copy(),
            "lo": lo,
            "hi": hi,
            **self.context,
            **details,
        })


def merge(values, buffer, lo, mid, hi, trace=None, **context):
    """Слить две соседние упорядоченные серии с сохранением порядка равных."""
    buffer[lo:hi] = values[lo:hi]
    if trace is not None:
        before = values.copy()
        old_ids = trace.ids[lo:hi]
        sources = []

    left, right = lo, mid
    for dest in range(lo, hi):
        if right < hi and (left == mid or buffer[right] < buffer[left]):
            source = right
            right += 1
        else:
            source = left
            left += 1
        values[dest] = buffer[source]
        if trace is not None:
            trace.ids[dest] = old_ids[source - lo]
            sources.append(source)

    if trace is not None:
        trace.emit("merge", lo, hi, mid=mid, before=before, sources=sources, **context)


def partition(values, lo, hi, pivot_index, trace=None, **context):
    """Вернуть границы группы равных опоре и разделить значения на три части."""
    pivot = values[pivot_index]
    if trace is not None:
        swaps = []
        moves = []
        trace.emit("pivot", lo, hi, pivot=pivot, pivot_index=pivot_index, **context)

    lt, scan, gt = lo, lo, hi
    while scan < gt:
        # Четыре области: меньше | равные | ещё не проверены | больше.
        inspected = scan
        if values[scan] < pivot:
            destination, relation = lt, "lt"
            lt += 1
            scan += 1
        elif pivot < values[scan]:
            gt -= 1
            destination, relation = gt, "gt"
        else:
            destination, relation = scan, "eq"
            scan += 1

        if inspected != destination:
            values[inspected], values[destination] = values[destination], values[inspected]
        if trace is not None:
            if inspected != destination:
                ids = trace.ids
                ids[inspected], ids[destination] = ids[destination], ids[inspected]
                swaps.append((inspected, destination))
            moves.append(dict(scan=inspected, dest=destination, relation=relation,
                              lt=lt, gt=gt, next_scan=scan))

    if trace is not None:
        trace.emit("partition", lo, hi, pivot=pivot, pivot_index=pivot_index,
                   lt=lt, gt=gt, swaps=swaps, moves=moves, **context)
    return lt, gt
