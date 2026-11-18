"""Reproducible timing experiment: python3 -m homework_6.compare.benchmark."""

from random import Random
from statistics import median

from .sorts import mergesort, quicksort
from .timing import timed


def _datasets(size: int):
    shuffled = list(range(size))
    Random(42).shuffle(shuffled)
    return [
        ("shuffle", "Случайный порядок", shuffled),
        ("equal", "Все значения равны", [7] * size),
        ("descending", "По убыванию", list(range(size, 0, -1))),
    ]


def run_benchmark(size: int = 1200, repeats: int = 5) -> dict:
    """Compare identical inputs, warm up first, and alternate execution order."""
    if type(size) is not int or size < 1:
        raise ValueError("size must be a positive integer")
    if type(repeats) is not int or repeats < 1:
        raise ValueError("repeats must be a positive integer")

    rows = []
    for case_id, label, values in _datasets(size):
        expected = sorted(values)
        samples = {"mergesort": [], "quicksort": []}

        def collect(name, elapsed):
            samples[name].append(elapsed)

        methods = (timed(mergesort, report=collect), timed(quicksort, report=collect))
        for method in (mergesort, quicksort):
            if method(values) != expected:
                raise AssertionError(f"Incorrect warm-up result: {method.__name__}")

        for trial in range(repeats):
            for method in (methods if trial % 2 == 0 else reversed(methods)):
                if method(values) != expected:
                    raise AssertionError(f"Incorrect result: {method.__name__}")
        rows.append({
            "id": case_id,
            "label": label,
            "merge_ms": median(samples["mergesort"]) / 1_000_000,
            "quick_ms": median(samples["quicksort"]) / 1_000_000,
        })
    return {"size": size, "repeats": repeats, "rows": rows}


if __name__ == "__main__":
    result = run_benchmark()
    print(f"Длина {result['size']}, медиана по {result['repeats']} измерениям (мс)")
    print(f"{'Набор':<24}{'Mergesort':>12}{'Quicksort':>12}")
    for row in result["rows"]:
        print(f"{row['label']:<24}{row['merge_ms']:>12.3f}{row['quick_ms']:>12.3f}")
