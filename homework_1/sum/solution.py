"""Find the maximum even subset sum in a single pass."""
from collections.abc import Iterable


def maximum_even_sum(numbers: Iterable[int]) -> int:
    """Accept positive integers; an empty selection has sum zero."""
    total_sum = 0
    smallest_odd = None
    for number in numbers:
        if type(number) is not int:
            raise TypeError("all elements must be integers")
        if number <= 0:
            raise ValueError("all elements must be positive")
        total_sum += number
        if number % 2 != 0:
            if smallest_odd is None or number < smallest_odd:
                smallest_odd = number

    if total_sum % 2 == 0:
        return total_sum
    # An odd total necessarily contains at least one odd element.
    assert smallest_odd is not None
    return total_sum - smallest_odd


if __name__ == "__main__":
    input_numbers = map(int, input().split())
    print(maximum_even_sum(input_numbers))
