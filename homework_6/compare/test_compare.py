import unittest
from unittest.mock import patch

from .benchmark import run_benchmark
from .sorts import mergesort, quicksort
from .timing import timed


class CompareTests(unittest.TestCase):
    def test_common_inputs_are_sorted_without_modifying_the_argument(self):
        cases = [[], [4], [7, 7, 7], [3, 2, 1], [2, -1, -1, 0, 9, -12],
                 [10**80, -(10**90), 0, 10**80], list(range(27))]
        for values in cases:
            for sort in (mergesort, quicksort):
                with self.subTest(values=values, sort=sort.__name__):
                    original = values.copy()
                    actual = sort(values)
                    self.assertEqual(actual, sorted(original))
                    self.assertIsNot(actual, values)
                    self.assertEqual(values, original)

    def test_one_sided_partitions_do_not_overflow_call_stack(self):
        values = list(range(1300, 0, -1))
        self.assertEqual(quicksort(values), list(range(1, 1301)))

    def test_timer_preserves_metadata_result_and_keyword_arguments(self):
        measurements = []

        @timed(report=lambda name, duration: measurements.append((name, duration)))
        def add(x, *, y):
            """Return a sum."""
            return x + y

        with patch("homework_6.compare.timing.perf_counter_ns", side_effect=[12, 103]):
            self.assertEqual(add(11, y=9), 20)
        self.assertEqual(add.__name__, "add")
        self.assertEqual(add.__doc__, "Return a sum.")
        self.assertEqual(measurements, [("add", 91)])

    def test_timer_also_measures_failed_call(self):
        measurements = []

        @timed(report=lambda _, elapsed: measurements.append(elapsed))
        def fail():
            raise RuntimeError("failed")

        with self.assertRaisesRegex(RuntimeError, "failed"):
            fail()
        self.assertEqual(len(measurements), 1)
        self.assertGreaterEqual(measurements[0], 0)

    def test_plain_decorator_prints_duration(self):
        @timed
        def constant():
            return 5

        with patch("builtins.print") as output:
            self.assertEqual(constant(), 5)
        self.assertRegex(output.call_args.args[0], r"^constant: [0-9]+\.[0-9]{3} мс$")

    def test_benchmark_uses_measured_median_for_each_algorithm(self):
        # Make the middle observation differ from the mean.
        stamps = []
        for _ in range(3):
            for delta in (6, 3, 10, 1, 100, 100):
                stamps.extend([1000, 1000 + delta])

        with patch("homework_6.compare.timing.perf_counter_ns", side_effect=stamps):
            result = run_benchmark(size=16, repeats=3)
        self.assertEqual((result["size"], result["repeats"]), (16, 3))
        self.assertEqual([row["id"] for row in result["rows"]], ["shuffle", "equal", "descending"])
        for row in result["rows"]:
            self.assertAlmostEqual(row["merge_ms"] * 1_000_000, 6)
            self.assertAlmostEqual(row["quick_ms"] * 1_000_000, 10)

    def test_benchmark_rejects_nonpositive_or_noninteger_parameters(self):
        for size, repeats in [(0, 3), (3, 0), (True, 3), (3, 2.5)]:
            with self.subTest(size=size, repeats=repeats), self.assertRaises(ValueError):
                run_benchmark(size=size, repeats=repeats)

    def test_partition_frames_preserve_identity_and_separate_equal_block(self):
        values = [8, 3, 5, 3, 8, 2, 1, 7, 5, 3, 9, 3]
        frames = []
        quicksort(values, on_event=frames.append)
        partitions = [f for f in frames if f["kind"] == "partition"]
        self.assertGreater(len(partitions), 1)
        for frame in frames:
            self.assertEqual(sorted(frame["ids"]), list(range(len(values))))
            self.assertEqual(frame["values"], [values[i] for i in frame["ids"]])
        for f in partitions:
            a, lo, hi, lt, gt, pivot = (f[key] for key in ("values", "lo", "hi", "lt", "gt", "pivot"))
            self.assertTrue(lo <= lt < gt <= hi)
            self.assertTrue(all(x < pivot for x in a[lo:lt]))
            self.assertTrue(all(x == pivot for x in a[lt:gt]))
            self.assertTrue(all(x > pivot for x in a[gt:hi]))

    def test_animation_moves_replay_each_classification_and_exchange(self):
        original = [4, 7, 5, 4, -1, 4, 2, 7]
        frames = []
        quicksort(original, on_event=frames.append)
        for previous, frame in zip(frames, frames[1:]):
            if frame["kind"] != "partition":
                continue
            ids = previous["ids"].copy()
            lo, hi, pivot = frame["lo"], frame["hi"], frame["pivot"]
            cursor = lo
            for move in frame["moves"]:
                index, dest = move["scan"], move["dest"]
                self.assertEqual(index, cursor)
                value = original[ids[index]]
                relation = "lt" if value < pivot else "gt" if value > pivot else "eq"
                self.assertEqual(move["relation"], relation)
                ids[index], ids[dest] = ids[dest], ids[index]
                values = [original[i] for i in ids]
                lt, cursor, gt = move["lt"], move["next_scan"], move["gt"]
                self.assertTrue(lo <= lt <= cursor <= gt <= hi)
                self.assertTrue(all(v < pivot for v in values[lo:lt]))
                self.assertTrue(all(v == pivot for v in values[lt:cursor]))
                self.assertTrue(all(v > pivot for v in values[gt:hi]))
            self.assertEqual(cursor, frame["gt"])
            self.assertEqual(ids, frame["ids"])
