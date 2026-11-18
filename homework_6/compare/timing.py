"""Measure the elapsed time of a synchronous call while preserving its result."""

from functools import wraps
from time import perf_counter_ns
from typing import Callable, ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")
Reporter = Callable[[str, int], None]


def _print_elapsed(name: str, nanoseconds: int) -> None:
    print(f"{name}: {nanoseconds / 1_000_000:.3f} мс")


def timed(function=None, *, report: Reporter = _print_elapsed):
    """Use @timed or @timed(report=callback); the callback receives nanoseconds."""
    def decorate(target: Callable[P, R]) -> Callable[P, R]:
        @wraps(target)
        def measured(*args: P.args, **kwargs: P.kwargs) -> R:
            start = perf_counter_ns()
            try:
                return target(*args, **kwargs)
            finally:
                elapsed = perf_counter_ns() - start
                report(target.__name__, elapsed)

        return measured

    return decorate if function is None else decorate(function)
