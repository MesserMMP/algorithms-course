"""Run from this directory: python -m unittest -v."""
import unittest
from math import isqrt
from solution import count_primes


def reference_prime_count(limit):
    return sum(
        all(number % divisor != 0 for divisor in range(2, isqrt(number) + 1))
        for number in range(2, limit)
    )


class PrimeCountTests(unittest.TestCase):
    def test_examples_and_boundaries(self):
        examples = [
            (10, 4), (1, 0), (0, 0), (-10, 0), (2, 0), (3, 1),
            (4, 2), (5, 2), (6, 3), (9, 4), (25, 9), (26, 9),
            (30, 10), (49, 15), (50, 15), (100, 25),
            (1000, 168), (100000, 9592),
        ]
        for limit, expected in examples:
            with self.subTest(limit=limit):
                self.assertEqual(count_primes(limit), expected)

    def test_every_limit_against_independent_reference(self):
        for limit in range(-5, 301):
            with self.subTest(limit=limit):
                self.assertEqual(count_primes(limit), reference_prime_count(limit))

    def test_strict_upper_bound(self):
        for prime in (2, 3, 5, 7, 11, 97):
            self.assertEqual(count_primes(prime + 1), count_primes(prime) + 1)

    def test_invalid_types(self):
        for value in (True, False, 10.5, "10", None, []):
            with self.subTest(value=value), self.assertRaises(TypeError):
                count_primes(value)


if __name__ == "__main__":
    unittest.main()
