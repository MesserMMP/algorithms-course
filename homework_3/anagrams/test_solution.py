import itertools
import random
import unittest
from collections import Counter

if __package__:
    from .solution import group_anagrams
else:
    from solution import group_anagrams


def oracle(words):
    groups = []
    for word in words:
        for group in groups:
            if Counter(word) == Counter(group[0]):
                group.append(word)
                break
        else:
            groups.append([word])
    return groups


class AnagramsTests(unittest.TestCase):
    def test_examples_and_boundaries(self):
        cases = [([], []), ([""], [[""]]), (["", ""], [["", ""]]),
                 (["eat", "tea", "tan", "ate", "nat", "bat"],
                  [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]),
                 (["a", "a", "aa", "b"], [["a", "a"], ["aa"], ["b"]]),
                 (["Ab", "bA", "ab"], [["Ab", "bA"], ["ab"]]),
                 (["кот", "ток", "🙂a", "a🙂"], [["кот", "ток"], ["🙂a", "a🙂"]]),
                 (["a b", "ba ", "ab"], [["a b", "ba "], ["ab"]]),
                 (["é", "e\u0301"], [["é"], ["e\u0301"]])]
        for words, expected in cases:
            with self.subTest(words=words):
                before = words[:]
                result = group_anagrams(words)
                self.assertEqual(result, expected)
                self.assertEqual(words, before)

    def test_exhaustive_small_lists(self):
        for n in range(5):
            for words in itertools.product(["", "a", "ab", "ba", "aa"], repeat=n):
                self.assertEqual(group_anagrams(list(words)), oracle(words))

    def test_random_against_frequency_oracle(self):
        rng = random.Random(302)
        for _ in range(300):
            words = ["".join(rng.choices("abcЯ🙂", k=rng.randrange(9)))
                     for _ in range(rng.randrange(30))]
            self.assertEqual(group_anagrams(words), oracle(words))

    def test_large_and_long_words(self):
        self.assertEqual(group_anagrams(["ab", "ba"] * 50_000), [["ab", "ba"] * 50_000])
        a = "a" * 10_000 + "b"
        self.assertEqual(group_anagrams([a, a[::-1]]), [[a, a[::-1]]])

    def test_groups_are_independent(self):
        result = group_anagrams(["a", "b"])
        result[0].append("a")
        self.assertEqual(result[1], ["b"])
        self.assertEqual(group_anagrams(["a"]), [["a"]])


if __name__ == "__main__":
    unittest.main()
