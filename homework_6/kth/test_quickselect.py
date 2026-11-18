from itertools import product
from random import Random
import unittest

from .quickselect import kth_largest


class KthTests(unittest.TestCase):
    def test_assignment_examples(self):
        self.assertEqual(kth_largest([3, 2, 1, 5, 6, 4], 2), 5)
        self.assertEqual(kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4), 4)

    def test_every_rank_with_negatives_duplicates_and_pivot_choices(self):
        rng = Random(19)
        for length in range(1, 6):
            for items in product([-3, 0, 2], repeat=length):
                reference = sorted(items, reverse=True)
                values = list(items)
                for k, expected in enumerate(reference, start=1):
                    self.assertEqual(kth_largest(values, k, rng=rng), expected, (items, k))
                self.assertEqual(values, list(items))

    def test_invalid_rank(self):
        for values, k in [([], 1), ([2], 0), ([2], -1), ([2, 5], 3)]:
            with self.subTest(values=values, k=k), self.assertRaises(ValueError):
                kth_largest(values, k)
        for k in (False, True, 1.5, "1"):
            with self.subTest(k=k), self.assertRaises(TypeError):
                kth_largest([2, 5], k)

    def test_large_equal_block_and_extreme_ranks(self):
        values = [8] * 3000 + [10**50, -(10**80)]
        for k, expected in [(1, 10**50), (2, 8), (3000, 8), (3002, -(10**80))]:
            self.assertEqual(kth_largest(values, k, rng=Random(11)), expected)

    def test_trace_only_keeps_ranges_containing_target(self):
        values = [23, -5, 8, 11, 2, 32, 0, 4, 19, 6, 4, 1]
        frames = []
        k = 7
        result = kth_largest(values, k, on_event=frames.append, rng=Random(2))
        target = len(values) - k
        self.assertEqual(frames[-1]["kind"], "found")
        self.assertEqual(frames[-1]["index"], target)
        self.assertEqual(frames[-1]["values"][target], result)
        for frame in frames:
            self.assertEqual(frame["target"], target)
            self.assertTrue(frame["lo"] <= target < frame["hi"])
