import random
import unittest
from homework_5.AVL.avl import AVL

class Tests(unittest.TestCase):
    def check(self, tree, expected):
        def walk(node,low=float('-inf'),high=float('inf')):
            if node is None: return 0
            self.assertTrue(low<node.key<high)
            a,b=walk(node.left,low,node.key),walk(node.right,node.key,high)
            self.assertLessEqual(abs(a-b),1)
            self.assertEqual(node.height,1+max(a,b))
            return node.height
        walk(tree.root)
        self.assertEqual(tree.inorder(),sorted(expected))
    def test_rotations(self):
        for values in ([30,20,10],[10,20,30],[30,10,20],[10,30,20]):
            tree=AVL(values)
            self.check(tree,set(values))
            self.assertEqual(tree.root.key,20)
    def test_empty_duplicate_and_deletion(self):
        tree=AVL()
        tree.delete(5)
        self.assertFalse(tree.search(5))
        for k in [8,4,12,2,6,10,14,1,3,8]: tree.insert(k)
        expected={8,4,12,2,6,10,14,1,3}
        for k in [999,1,2,8,4,12,14,6,10,3]:
            tree.delete(k); expected.discard(k); self.check(tree,expected)
        self.assertIsNone(tree.root)
    def test_random_operations(self):
        rng=random.Random(7)
        tree,expected=AVL(),set()
        for _ in range(2500):
            key=rng.randrange(-100,101)
            if rng.randrange(2): tree.insert(key); expected.add(key)
            else: tree.delete(key); expected.discard(key)
            self.check(tree,expected)
            self.assertEqual(tree.search(key),key in expected)
    def test_sorted_and_invalid(self):
        tree=AVL(range(500))
        self.check(tree,set(range(500)))
        self.assertLessEqual(tree.root.height,10)
        for operation in [tree.insert,tree.delete,tree.search]:
            for value in [True,1.5,'1',None]:
                with self.assertRaises(TypeError): operation(value)
