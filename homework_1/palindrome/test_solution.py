"""Run from this directory: python -m unittest -v."""
import unittest
from solution import is_palindrome


class PalindromeTests(unittest.TestCase):
    def test_examples_and_boundaries(self):
        examples = [
            (121, True), (31, False), (0, True), (1, True), (9, True),
            (10, False), (11, True), (100, False), (101, True),
            (1001, True), (1221, True), (1234321, True), (12345, False),
            (123421, False), (10001, True), (-121, False), (-1, False),
            (10 ** 100 + 1, True), (10 ** 100, False),
        ]
        for number, expected in examples:
            with self.subTest(number=number):
                self.assertEqual(is_palindrome(number), expected)

    def test_all_small_integers_against_reference(self):
        # Strings are used only in the independent test oracle.
        for number in range(10000):
            digits = str(number)
            with self.subTest(number=number):
                self.assertEqual(is_palindrome(number), digits == digits[::-1])

    def test_invalid_types(self):
        for value in (True, False, 1.5, "121", None, [], {}):
            with self.subTest(value=value):
                with self.assertRaises(TypeError):
                    is_palindrome(value)


if __name__ == "__main__":
    unittest.main()
