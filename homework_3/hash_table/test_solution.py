import random
import unittest

if __package__:
    from .solution import HashTable
else:
    from solution import HashTable


class CollisionKey:
    def __init__(self, value):
        self.value = value

    def __hash__(self):
        return -7

    def __eq__(self, other):
        return isinstance(other, CollisionKey) and self.value == other.value


class HashTableTests(unittest.TestCase):
    def test_insert_update_delete_and_missing(self):
        table = HashTable()
        self.assertEqual(len(table), 0)
        table.insert("a", None)
        self.assertIsNone(table.search("a"))
        table["a"] = [1, 2]
        self.assertEqual(table["a"], [1, 2])
        self.assertEqual(len(table), 1)
        self.assertIn("a", table)
        del table["a"]
        self.assertNotIn("a", table)
        for action in [table.search, table.delete]:
            with self.assertRaises(KeyError):
                action("a")
        self.assertEqual(len(table), 0)

    def test_collisions_and_all_chain_positions(self):
        for removed in [0, 15, 29]:
            table = HashTable(1)
            for i in range(30):
                table[CollisionKey(i)] = i
            table[CollisionKey(5)] = "updated"
            del table[CollisionKey(removed)]
            for i in range(30):
                if i == removed:
                    self.assertNotIn(CollisionKey(i), table)
                else:
                    self.assertEqual(table[CollisionKey(i)], "updated" if i == 5 else i)
            table[CollisionKey(removed)] = "back"
            self.assertEqual(len(table), 30)

    def test_capacity_and_growth_threshold(self):
        for capacity in [0, -1]:
            with self.assertRaises(ValueError):
                HashTable(capacity)
        for capacity in [True, 1.5, "8", None]:
            with self.assertRaises(TypeError):
                HashTable(capacity)
        table = HashTable(4)
        for i in range(3):
            table[i] = i
        self.assertEqual(table.capacity, 4)
        table[0] = 9
        self.assertEqual(table.capacity, 4)
        table[3] = 3
        self.assertEqual(table.capacity, 8)
        self.assertEqual(table.load_factor, 0.5)

    def test_various_keys_and_identity(self):
        table = HashTable()
        keys = [None, "", (1, "a"), -10**100, "ключ", float("inf")]
        for i, key in enumerate(keys):
            table[key] = i
        for i, key in enumerate(keys):
            self.assertEqual(table[key], i)
        table[True] = "bool"
        table[1] = "int"
        self.assertEqual(table[True], "int")
        self.assertEqual(len(table), len(keys) + 1)
        nan = float("nan")
        table[nan] = 5
        self.assertEqual(table[nan], 5)
        del table[nan]

    def test_unhashable_does_not_mutate(self):
        table = HashTable()
        for key in [[], {}, set()]:
            for operation in [lambda k: table.insert(k, 1), table.search,
                              table.delete, table.__contains__]:
                with self.assertRaises(TypeError):
                    operation(key)
        self.assertEqual(len(table), 0)

    def test_random_operations_against_dict(self):
        rng = random.Random(303)
        table, expected = HashTable(1), {}
        for _ in range(10_000):
            key = rng.randrange(-100, 101)
            operation = rng.choice(["insert", "search", "delete"])
            if operation == "insert":
                value = rng.choice([None, rng.randrange(1000), "value"])
                table[key] = expected[key] = value
            elif key in expected:
                if operation == "search":
                    self.assertEqual(table[key], expected[key])
                else:
                    del table[key]
                    del expected[key]
            else:
                with self.assertRaises(KeyError):
                    getattr(table, operation)(key)
            self.assertEqual(len(table), len(expected))
            self.assertEqual(key in table, key in expected)
        for key, value in expected.items():
            self.assertEqual(table[key], value)

    def test_large_rehash_and_list_storage(self):
        table = HashTable(1)
        for i in range(100_000):
            table[i] = -i
        self.assertLessEqual(table.load_factor, 0.75)
        self.assertIsInstance(table._buckets, list)
        for chain in table._buckets:
            self.assertIsInstance(chain, list)
            for entry in chain:
                self.assertIsInstance(entry, list)
        for i in range(100_000):
            self.assertEqual(table[i], -i)
            del table[i]
        self.assertEqual(len(table), 0)
        table["again"] = 1
        self.assertEqual(table["again"], 1)


if __name__ == "__main__":
    unittest.main()
