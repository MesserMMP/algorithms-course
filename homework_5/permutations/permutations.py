"""Unique permutations in input encounter order, without mutating the input."""
from homework_5.tracer.tracer import tracer


def permutations(nums, *, emit=None, on_event=None):
    values = list(nums)
    result = []

    @tracer(emit=emit, on_event=on_event)
    def visit(path, remaining):
        if not remaining:
            result.append(path[:])
            return 1
        count = 0
        tried = []
        for i, value in enumerate(remaining):
            if value in tried:
                continue
            tried.append(value)
            count += visit(path + [value], remaining[:i] + remaining[i + 1:])
        return count

    visit([], values)
    return result
