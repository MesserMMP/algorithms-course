import itertools
import unittest

if __package__:
    from .solution import validate_stack_sequences as validate
else:
    from solution import validate_stack_sequences as validate


def possible_outputs(n):
    """Независимый эталон: перебор всех допустимых путей push/pop."""
    outputs = set()

    def visit(i, stack, out):
        if len(out) == n:
            outputs.add(tuple(out))
        if i < n:
            visit(i + 1, stack + [i], out)
        if stack:
            visit(i, stack[:-1], out + [stack[-1]])

    visit(0, [], [])
    return outputs


class ValidateTests(unittest.TestCase):
    def test_examples_and_edges(self):
        cases = [([1, 2, 3, 4, 5], [1, 3, 5, 4, 2], True),
                 ([1, 2, 3], [3, 1, 2], False),
                 ([7], [7], True), ([], [], True),
                 ([1], [], False), ([1], [2], False),
                 ([-5, 0, 8], [0, 8, -5], True)]
        for pushed, popped, expected in cases:
            with self.subTest(pushed=pushed, popped=popped):
                before = pushed[:], popped[:]
                self.assertEqual(validate(pushed, popped), expected)
                self.assertEqual((pushed, popped), before)

    def test_exhaustive_permutations(self):
        for n in range(1, 8):
            allowed = possible_outputs(n)
            for popped in itertools.permutations(range(n)):
                self.assertEqual(validate(list(range(n)), list(popped)), popped in allowed)

    def test_limit(self):
        pushed = list(range(100_000))
        self.assertTrue(validate(pushed, pushed))
        self.assertTrue(validate(pushed, pushed[::-1]))
        self.assertFalse(validate(pushed, [99_999] + list(range(99_999))))


if __name__ == '__main__':
    unittest.main()
