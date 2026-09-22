import random
import unittest

if __package__:
    from .solution import Queue, Stack
else:
    from solution import Queue, Stack


class LinkedStructuresTests(unittest.TestCase):
    def test_empty_and_reuse(self):
        for cls, add, remove in [(Stack, 'push', 'pop'), (Queue, 'enqueue', 'dequeue')]:
            with self.subTest(cls=cls):
                obj = cls()
                self.assertTrue(obj.is_empty())
                for _ in range(3):
                    with self.assertRaises(IndexError):
                        getattr(obj, remove)()
                    with self.assertRaises(IndexError):
                        obj.peek()
                    getattr(obj, add)(None)
                    self.assertIsNone(obj.peek())
                    self.assertEqual(len(obj), 1)
                    self.assertIsNone(getattr(obj, remove)())
                    self.assertEqual(len(obj), 0)
                    self.assertTrue(obj.is_empty())

    def test_order_duplicates_and_iteration(self):
        stack, queue = Stack(), Queue()
        values = [4, -2, 4, 0, 9]
        for value in values:
            stack.push(value)
            queue.enqueue(value)
        self.assertEqual(list(stack), values[::-1])
        self.assertEqual(list(queue), values)
        self.assertEqual([stack.pop() for _ in values], values[::-1])
        self.assertEqual([queue.dequeue() for _ in values], values)

    def test_random_interleaving(self):
        for cls, add, remove, index in [(Stack, 'push', 'pop', -1),
                                         (Queue, 'enqueue', 'dequeue', 0)]:
            rng = random.Random(42)
            obj, reference = cls(), []
            for _ in range(3000):
                if not reference or rng.random() < 0.55:
                    value = rng.randrange(-100, 101)
                    getattr(obj, add)(value)
                    reference.append(value)
                else:
                    self.assertEqual(getattr(obj, remove)(), reference.pop(index))
                self.assertEqual(len(obj), len(reference))
                self.assertEqual(obj.is_empty(), not reference)
                if reference:
                    self.assertEqual(obj.peek(), reference[index])

    def test_large(self):
        stack, queue = Stack(), Queue()
        for i in range(100_000):
            stack.push(i)
            queue.enqueue(i)
        for i in range(100_000):
            self.assertEqual(stack.pop(), 99_999 - i)
            self.assertEqual(queue.dequeue(), i)


if __name__ == '__main__':
    unittest.main()
