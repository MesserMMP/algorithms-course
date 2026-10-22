"""Границы, независимые эталоны, перебор форм и глубокие деревья."""

import random
import unittest
from functools import lru_cache

if __package__:
    from .balanced_binary_tree import is_balanced
    from .tree import Node
    from .tree_traversal import (
        BST, inorder, postorder, preorder,
        reverse_inorder, reverse_postorder, reverse_preorder,
    )
    from .validate_bst import is_valid_bst
else:
    from balanced_binary_tree import is_balanced
    from tree import Node
    from tree_traversal import (
        BST, inorder, postorder, preorder,
        reverse_inorder, reverse_postorder, reverse_preorder,
    )
    from validate_bst import is_valid_bst


TRAVERSALS = (
    preorder, inorder, postorder,
    reverse_preorder, reverse_inorder, reverse_postorder,
)


def recursive_traversals(node):
    """Независимый эталон: конкатенации без общего алгоритма стека."""
    if node is None:
        return ([], [], [], [], [], [])
    left = recursive_traversals(node.left)
    right = recursive_traversals(node.right)
    value = [node.value]
    return (
        value + left[0] + right[0],
        left[1] + value + right[1],
        left[2] + right[2] + value,
        value + right[3] + left[3],
        right[4] + value + left[4],
        right[5] + left[5] + value,
    )


def recursive_height(node):
    if node is None:
        return 0
    return 1 + max(recursive_height(node.left), recursive_height(node.right))


def recursive_balanced(node):
    # Намеренно простой эталон с повторным вычислением высот.
    return node is None or (
        abs(recursive_height(node.left) - recursive_height(node.right)) <= 1
        and recursive_balanced(node.left)
        and recursive_balanced(node.right)
    )


def reference_valid(node):
    values = recursive_traversals(node)[1]
    return all(a < b for a, b in zip(values, values[1:]))


@lru_cache(maxsize=None)
def shapes(size):
    if size == 0:
        return (None,)
    return tuple(
        (left, right)
        for left_size in range(size)
        for left in shapes(left_size)
        for right in shapes(size - left_size - 1)
    )


def from_shape(shape, values):
    if shape is None:
        return None
    return Node(next(values), from_shape(shape[0], values), from_shape(shape[1], values))


def random_tree(rng, size):
    if size == 0:
        return None
    left_size = rng.randrange(size)
    return Node(
        rng.randint(-20, 20),
        random_tree(rng, left_size),
        random_tree(rng, size - left_size - 1),
    )


def chain(size, *, left=False):
    root = None
    values = range(size) if left else reversed(range(size))
    for value in values:
        root = Node(value, root, None) if left else Node(value, None, root)
    return root


def snapshot(root):
    result = []
    stack = [root] if root is not None else []
    while stack:
        node = stack.pop()
        result.append((id(node), node.value, id(node.left), id(node.right)))
        if node.right is not None:
            stack.append(node.right)
        if node.left is not None:
            stack.append(node.left)
    return result


class BSTInsertionTests(unittest.TestCase):
    def test_empty_and_single_insertion(self):
        tree = BST()
        self.assertIsNone(tree.root)
        self.assertTrue(tree.insert(0))
        self.assertEqual(tree.root.value, 0)
        self.assertIsNone(tree.root.left)
        self.assertIsNone(tree.root.right)

    def test_insert_preserves_existing_nodes_and_shape(self):
        tree = BST([8, 4, 12, 2, 6, 10, 14])
        root, left, right = tree.root, tree.root.left, tree.root.right
        self.assertTrue(tree.insert(5))
        self.assertIs(tree.root, root)
        self.assertIs(root.left, left)
        self.assertIs(root.right, right)
        self.assertEqual(root.left.right.left.value, 5)
        self.assertTrue(is_valid_bst(root))

    def test_duplicates_are_ignored_at_every_depth(self):
        tree = BST([8, 4, 12, 2, 6, 10, 14, 5])
        before = snapshot(tree.root)
        for value in [8, 4, 12, 2, 6, 10, 14, 5]:
            self.assertFalse(tree.insert(value))
        self.assertEqual(snapshot(tree.root), before)

    def test_negative_zero_and_unbounded_integers(self):
        values = [0, -(10**100), 10**100, -1, 1, 0, -(10**100)]
        tree = BST(iter(values))
        self.assertEqual(inorder(tree.root), sorted(set(values)))
        self.assertTrue(is_valid_bst(tree.root))

    def test_sorted_insertions_form_deep_trees_without_recursion(self):
        for values in [range(1600), range(1599, -1, -1)]:
            with self.subTest(descending=values.start != 0):
                tree = BST(values)
                self.assertEqual(inorder(tree.root), list(range(1600)))
                self.assertFalse(tree.insert(800))
                self.assertTrue(is_valid_bst(tree.root))

    def test_seeded_random_insertions_against_set(self):
        rng = random.Random(401)
        for _ in range(60):
            tree, expected = BST(), set()
            for _ in range(100):
                value = rng.randint(-100, 100)
                self.assertEqual(tree.insert(value), value not in expected)
                expected.add(value)
                self.assertEqual(inorder(tree.root), sorted(expected))
                self.assertTrue(is_valid_bst(tree.root))


class TraversalTests(unittest.TestCase):
    def test_empty_and_single_node(self):
        for traversal in TRAVERSALS:
            with self.subTest(traversal=traversal.__name__):
                self.assertEqual(traversal(None), [])
                self.assertEqual(traversal(Node(-5)), [-5])

    def test_six_orders_on_nontrivial_asymmetric_tree(self):
        root = BST([8, 4, 12, 2, 6, 10, 14, 3, 5, 11, 13]).root
        expected = (
            [8, 4, 2, 3, 6, 5, 12, 10, 11, 14, 13],
            [2, 3, 4, 5, 6, 8, 10, 11, 12, 13, 14],
            [3, 2, 5, 6, 4, 11, 10, 13, 14, 12, 8],
            [8, 12, 14, 13, 10, 11, 4, 6, 5, 2, 3],
            [14, 13, 12, 11, 10, 8, 6, 5, 4, 3, 2],
            [13, 14, 11, 10, 12, 5, 6, 3, 2, 4, 8],
        )
        for traversal, answer in zip(TRAVERSALS, expected):
            with self.subTest(traversal=traversal.__name__):
                self.assertEqual(traversal(root), answer)

    def test_arbitrary_tree_duplicates_and_repeated_calls(self):
        root = Node(0, Node(8, Node(8)), Node(-7, None, Node(0)))
        before = snapshot(root)
        for traversal, expected in zip(TRAVERSALS, recursive_traversals(root)):
            self.assertEqual(traversal(root), expected)
            result = traversal(root)
            result.clear()
            self.assertEqual(traversal(root), expected)
        self.assertEqual(snapshot(root), before)

    def test_all_tree_shapes_up_to_six_nodes(self):
        for size in range(7):
            for shape in shapes(size):
                root = from_shape(shape, iter(range(size)))
                for traversal, expected in zip(TRAVERSALS, recursive_traversals(root)):
                    self.assertEqual(traversal(root), expected)

    def test_seeded_random_against_recursive_oracle(self):
        rng = random.Random(402)
        for _ in range(300):
            root = random_tree(rng, rng.randrange(80))
            for traversal, expected in zip(TRAVERSALS, recursive_traversals(root)):
                self.assertEqual(traversal(root), expected)

    def test_both_deep_chains_without_recursion(self):
        ascending = list(range(6000))
        descending = ascending[::-1]
        for left in (False, True):
            root = chain(6000, left=left)
            expected = (
                (descending, ascending, ascending, descending, descending, ascending)
                if left else
                (ascending, ascending, descending, ascending, descending, descending)
            )
            for traversal, answer in zip(TRAVERSALS, expected):
                with self.subTest(left=left, traversal=traversal.__name__):
                    self.assertEqual(traversal(root), answer)


class ValidateBSTTests(unittest.TestCase):
    def test_empty_single_and_valid_boundaries(self):
        for root in [None, Node(0), Node(-(10**100)),
                     BST([0, -10**100, 10**100, -1, 1]).root]:
            self.assertIs(is_valid_bst(root), True)

    def test_wrong_side_and_duplicate_values(self):
        trees = [
            Node(5, Node(6)), Node(5, None, Node(4)),
            Node(5, Node(5)), Node(5, None, Node(5)),
            Node(8, Node(4, None, Node(8))),
            Node(8, None, Node(12, Node(8))),
            Node(0, Node(0)), Node(0, None, Node(0)),
        ]
        for root in trees:
            self.assertIs(is_valid_bst(root), False)

    def test_ancestor_constraints_not_just_parent(self):
        trees = [
            Node(8, Node(4, None, Node(10)), Node(12)),
            Node(8, Node(4), Node(12, Node(6))),
            Node(0, Node(-5, None, Node(1))),
            Node(0, None, Node(5, Node(-1))),
        ]
        for root in trees:
            self.assertIs(is_valid_bst(root), False)

    def test_seeded_arbitrary_trees_against_sorted_inorder(self):
        rng = random.Random(403)
        for _ in range(600):
            root = random_tree(rng, rng.randrange(60))
            before = snapshot(root)
            self.assertEqual(is_valid_bst(root), reference_valid(root))
            self.assertEqual(snapshot(root), before)

    def test_all_shapes_with_valid_inorder_labels_and_deep_duplicates(self):
        for size in range(7):
            for shape in shapes(size):
                root = from_shape(shape, iter(range(size)))
                nodes = []

                def collect(node):
                    if node is not None:
                        collect(node.left)
                        nodes.append(node)
                        collect(node.right)

                collect(root)
                for value, node in enumerate(nodes):
                    node.value = value
                self.assertTrue(is_valid_bst(root))
                if len(nodes) >= 2:
                    nodes[-1].value = nodes[-2].value
                    self.assertFalse(is_valid_bst(root))

    def test_deep_chains_and_violation_at_last_node(self):
        for left in (False, True):
            root = chain(6000, left=left)
            self.assertTrue(is_valid_bst(root))
            current = root
            while (current.left if left else current.right) is not None:
                current = current.left if left else current.right
            current.value = root.value
            self.assertFalse(is_valid_bst(root))


class BalancedBinaryTreeTests(unittest.TestCase):
    def test_empty_leaf_and_two_nodes_are_balanced(self):
        for root in [None, Node(0), Node(0, Node(1)), Node(0, None, Node(-1))]:
            self.assertIs(is_balanced(root), True)

    def test_chain_of_three_in_each_direction_is_unbalanced(self):
        trees = [
            Node(0, Node(1, Node(2))),
            Node(0, Node(1, None, Node(2))),
            Node(0, None, Node(1, Node(2))),
            Node(0, None, Node(1, None, Node(2))),
        ]
        for root in trees:
            self.assertIs(is_balanced(root), False)

    def test_asymmetric_balanced_and_perfect_trees(self):
        for values in [[8, 4, 12, 2, 6, 10, 14, 3, 5, 11, 13],
                       [4, 2, 6, 1, 3, 5, 7], [8, 4, 12, 2]]:
            self.assertTrue(is_balanced(BST(values).root))

    def test_root_balanced_but_internal_node_unbalanced(self):
        left = Node(5, Node(4, Node(3)))
        right = Node(15, Node(13, Node(12), Node(14)), Node(17, Node(16), Node(18)))
        root = Node(10, left, right)
        self.assertEqual(recursive_height(left), recursive_height(right))
        self.assertFalse(is_balanced(root))
        root.left, root.right = root.right, root.left
        self.assertFalse(is_balanced(root))

    def test_balance_is_independent_of_bst_values(self):
        root = Node(0, Node(100, Node(100)), Node(-100))
        self.assertFalse(is_valid_bst(root))
        self.assertTrue(is_balanced(root))

    def test_all_tree_shapes_up_to_six_nodes(self):
        for size in range(7):
            for shape in shapes(size):
                root = from_shape(shape, iter(range(size)))
                self.assertEqual(is_balanced(root), recursive_balanced(root))

    def test_seeded_random_against_height_oracle_without_mutation(self):
        rng = random.Random(404)
        for _ in range(600):
            root = random_tree(rng, rng.randrange(80))
            before = snapshot(root)
            self.assertEqual(is_balanced(root), recursive_balanced(root))
            self.assertEqual(snapshot(root), before)

    def test_deep_chains_without_recursion(self):
        self.assertFalse(is_balanced(chain(6000)))
        self.assertFalse(is_balanced(chain(6000, left=True)))

    def test_large_complete_tree(self):
        nodes = [Node(i) for i in range(8191)]
        for index in range(len(nodes) // 2):
            nodes[index].left = nodes[2 * index + 1]
            nodes[index].right = nodes[2 * index + 2]
        self.assertTrue(is_balanced(nodes[0]))


if __name__ == "__main__":
    unittest.main()
