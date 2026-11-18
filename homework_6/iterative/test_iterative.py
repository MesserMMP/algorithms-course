from itertools import product
from random import Random
import unittest

from homework_6.compare import sorts as recursive
from . import sorts as iterative


class Tagged:
    """Equal keys remain distinguishable by object identity."""
    def __init__(self, key):
        self.key = key

    def __lt__(self, other):
        return self.key < other.key


class IterativeTests(unittest.TestCase):
    def test_exhaustive_small_inputs_against_independent_reference(self):
        for length in range(6):
            for items in product([-2, 0, 3], repeat=length):
                expected = sorted(items)
                for sort in (recursive.mergesort, recursive.quicksort,
                             iterative.mergesort, iterative.quicksort):
                    values = list(items)
                    self.assertEqual(sort(values), expected, (sort, items))
                    self.assertEqual(values, list(items))

    def test_non_power_of_two_and_missing_right_run(self):
        rng = Random(42)
        for n in (1, 7, 8, 9, 127, 128, 129, 2049):
            values = [rng.randint(-30, 30) for _ in range(n)]
            for sort in (iterative.mergesort, iterative.quicksort):
                with self.subTest(n=n, sort=sort.__name__):
                    self.assertEqual(sort(values), sorted(values))

    def test_merges_are_stable_across_half_boundaries(self):
        values = [Tagged(k) for k in (1, 1, 2, 0, 1, 2, 0, 0, 1)]
        expected = sorted(values, key=lambda item: item.key)
        for sort in (recursive.mergesort, iterative.mergesort):
            self.assertEqual(sort(values), expected)

    def test_visualization_can_follow_each_merge_source(self):
        values = [2, 5, 3, 5, 8, 1, 8, 7, -1]
        for method in (recursive.mergesort, iterative.mergesort):
            frames = []
            method(values, on_event=frames.append)
            merges = [f for f in frames if f["kind"] == "merge"]
            self.assertTrue(merges)
            for frame in merges:
                start, stop = frame["lo"], frame["hi"]
                sources = frame["sources"]
                self.assertEqual(sorted(sources), list(range(start, stop)))
                self.assertEqual([frame["before"][i] for i in sources], frame["values"][start:stop])
                self.assertEqual(frame["values"][start:stop], sorted(frame["values"][start:stop]))
