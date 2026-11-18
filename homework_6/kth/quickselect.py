"""Поиск k-го по убыванию с трёхсторонним разбиением."""

import random

from ..compare._operations import Trace, partition


def kth_largest(values, k, *, on_event=None, rng=None):
    """Вернуть k-й по убыванию элемент, учитывая каждое вхождение."""
    if not isinstance(k, int) or isinstance(k, bool):
        raise TypeError("k должно быть целым числом")
    data = list(values)
    size = len(data)
    if not 1 <= k <= size:
        raise ValueError("k должно быть от 1 до длины массива")
    target = size - k
    trace = Trace(data, on_event, target=target) if on_event is not None else None
    choose = random.randrange if rng is None else rng.randrange
    lo, hi = 0, size
    if trace is not None:
        trace.emit("start", lo, hi)

    while hi - lo > 1:
        lt, gt = partition(data, lo, hi, choose(lo, hi), trace)
        if target < lt:
            hi = lt
        elif target >= gt:
            lo = gt
        else:
            break
        if trace is not None:
            trace.emit("keep", lo, hi)

    if trace is not None:
        trace.emit("found", lo, hi, index=target, value=data[target])
    return data[target]
