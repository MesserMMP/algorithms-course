import itertools
import random
import unittest

if __package__:
    from .solution import two_sum
else:
    from solution import two_sum


def brute_force(arr, k):
    return [(i, j) for i in range(len(arr)) for j in range(i + 1, len(arr))
            if arr[i] + arr[j] == k]


class TwoSumTests(unittest.TestCase):
    def test_examples_and_boundaries(self):
        cases = [([1, 3, 4, 10], 7, (1, 2)), ([5, 5, 1, 4], 10, (0, 1)),
                 ([0, 0], 0, (0, 1)), ([-8, -2, 5], -10, (0, 1)),
                 ([-4, 0, 4], 0, (0, 2)), ([3, 8], 11, (0, 1)),
                 ([10**100, -10**100], 0, (0, 1)),
                 ([7, 3, 2, 8], 15, (0, 3))]
        for arr, k, expected in cases:
            with self.subTest(arr=arr, k=k):
                before = arr[:]
                self.assertEqual(two_sum(arr, k), expected)
                self.assertEqual(arr, before)

    def test_no_pair_and_no_reusing_index(self):
        for arr, k in [([], 0), ([5], 10), ([1, 2, 5], 10), ([0], 0)]:
            with self.subTest(arr=arr), self.assertRaises(ValueError):
                two_sum(arr, k)

    def test_exhaustive_small_arrays(self):
        for n in range(6):
            for values in itertools.product(range(-2, 3), repeat=n):
                arr = list(values)
                for k in range(-4, 5):
                    pairs = brute_force(arr, k)
                    if not pairs:
                        with self.assertRaises(ValueError):
                            two_sum(arr, k)
                    else:
                        self.assertIn(two_sum(arr, k), pairs)

    def test_seeded_random_against_oracle(self):
        rng = random.Random(301)
        for _ in range(500):
            arr = [rng.randint(-100, 100) for _ in range(rng.randrange(40))]
            k = rng.randint(-200, 200)
            pairs = brute_force(arr, k)
            if pairs:
                self.assertIn(two_sum(arr, k), pairs)
            else:
                with self.assertRaises(ValueError):
                    two_sum(arr, k)

    def test_large_input(self):
        arr = list(range(100_000))
        self.assertEqual(two_sum(arr, 199_997), (99_998, 99_999))


if __name__ == "__main__":
    unittest.main()
