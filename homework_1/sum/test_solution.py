"""Run from this directory: python -m unittest -v."""
import itertools
import random
import unittest
from solution import maximum_even_sum


def brute_force_even_sum(numbers):
    best_sum = 0
    for subset_size in range(len(numbers) + 1):
        for subset in itertools.combinations(numbers, subset_size):
            subset_sum = sum(subset)
            if subset_sum % 2 == 0:
                best_sum = max(best_sum, subset_sum)
    return best_sum


class MaximumEvenSumTests(unittest.TestCase):
    def test_examples_and_boundaries(self):
        examples = [
            ([5, 7, 13, 2, 14], 36), ([3], 0), ([], 0),
            ([2], 2), ([1], 0), ([2, 4, 6], 12), ([1, 3], 4),
            ([1, 3, 5], 8), ([9, 9, 9], 18), ([8, 3, 2], 10),
            ([1, 1, 1], 2), ([10 ** 100, 3], 10 ** 100),
        ]
        for numbers, expected in examples:
            with self.subTest(numbers=numbers):
                original_numbers = numbers.copy()
                self.assertEqual(maximum_even_sum(numbers), expected)
                self.assertEqual(numbers, original_numbers)

    def test_exhaustive_small_arrays(self):
        for length in range(6):
            for numbers in itertools.product(range(1, 5), repeat=length):
                with self.subTest(numbers=numbers):
                    self.assertEqual(maximum_even_sum(numbers), brute_force_even_sum(numbers))

    def test_seeded_random_arrays(self):
        generator = random.Random(42)
        for _ in range(100):
            numbers = [generator.randint(1, 100) for _ in range(generator.randint(0, 10))]
            self.assertEqual(maximum_even_sum(numbers), brute_force_even_sum(numbers))

    def test_iterator_and_large_input(self):
        self.assertEqual(maximum_even_sum(iter([5, 7, 13, 2, 14])), 36)
        self.assertEqual(maximum_even_sum(2 for _ in range(100000)), 200000)

    def test_invalid_elements(self):
        for value in (0, -1):
            with self.subTest(value=value), self.assertRaises(ValueError):
                maximum_even_sum([2, value])
        for value in (True, 1.5, "3", None):
            with self.subTest(value=value), self.assertRaises(TypeError):
                maximum_even_sum([2, value])


if __name__ == "__main__":
    unittest.main()
