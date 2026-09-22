import random
import unittest

if __package__:
    from .solution import ListNode, merge_with_dummy, merge_without_dummy
else:
    from solution import ListNode, merge_with_dummy, merge_without_dummy


def build(values):
    head = None
    nodes = []
    for value in reversed(values):
        head = ListNode(value, head)
        nodes.append(head)
    return head, nodes[::-1]


class MergeTests(unittest.TestCase):
    def check_merge(self, a, b):
        for merge in [merge_with_dummy, merge_without_dummy]:
            left, left_nodes = build(a)
            right, right_nodes = build(b)
            original_values = {id(node): node.val for node in left_nodes + right_nodes}
            head = merge(left, right)
            nodes, seen = [], set()
            while head is not None:
                self.assertNotIn(id(head), seen, 'Цикл или повторный узел')
                seen.add(id(head))
                nodes.append(head)
                head = head.next
            self.assertEqual([node.val for node in nodes], sorted(a + b))
            self.assertEqual(seen, set(original_values), 'Нужны именно исходные узлы')
            for node in nodes:
                self.assertEqual(node.val, original_values[id(node)])
            # При равенстве выбирается list1; порядок внутри списков сохраняется.
            expected = sorted(left_nodes + right_nodes, key=lambda node: node.val)
            self.assertEqual(nodes, expected)

    def test_examples_and_edges(self):
        for a, b in [([], []), ([], [1, 2]), ([1], []), ([1], [1]),
                     ([1, 2, 4], [1, 3, 4]), ([-8, -2, 0], [-9, -2, 5]),
                     ([1, 2], [3, 4, 5]), ([8, 9], [1, 2, 3]),
                     ([2, 2, 2], [2, 2])]:
            with self.subTest(a=a, b=b):
                self.check_merge(a, b)

    def test_random(self):
        rng = random.Random(42)
        for _ in range(200):
            self.check_merge(sorted(rng.randrange(-20, 21) for _ in range(rng.randrange(50))),
                             sorted(rng.randrange(-20, 21) for _ in range(rng.randrange(50))))

    def test_long_lists_no_recursion(self):
        self.check_merge(list(range(0, 100_000, 2)), list(range(1, 100_000, 2)))


if __name__ == '__main__':
    unittest.main()
