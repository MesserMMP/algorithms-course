"""AVL set of integer keys; height(empty)=0, duplicates are ignored."""
from dataclasses import dataclass


@dataclass
class Node:
    key: int
    left: "Node | None" = None
    right: "Node | None" = None
    height: int = 1


def height(node):
    return node.height if node else 0


def snapshot(node):
    if node is None:
        return None
    return dict(key=node.key, height=node.height,
                balance=height(node.left) - height(node.right),
                left=snapshot(node.left), right=snapshot(node.right))


class AVL:
    def __init__(self, values=(), *, on_event=None):
        self.root = None
        self.on_event = on_event
        for value in values:
            self.insert(value)

    @staticmethod
    def _key(key):
        if type(key) is not int:
            raise TypeError("AVL keys must be integers")

    def _emit(self, kind, node, **data):
        if self.on_event:
            self.on_event(dict(kind=kind, tree=snapshot(node), **data))

    @staticmethod
    def _update(node):
        node.height = 1 + max(height(node.left), height(node.right))

    def _rotate(self, node, right):
        direction = "right" if right else "left"
        self._emit("rotation_before", node, direction=direction)
        pivot = node.left if right else node.right
        if right:
            node.left, pivot.right = pivot.right, node
        else:
            node.right, pivot.left = pivot.left, node
        self._update(node)
        self._update(pivot)
        self._emit("rotation_after", pivot, direction=direction)
        return pivot

    def _balance(self, node):
        self._update(node)
        balance = height(node.left) - height(node.right)
        if balance > 1:
            if height(node.left.left) < height(node.left.right):
                node.left = self._rotate(node.left, False)
            return self._rotate(node, True)
        if balance < -1:
            if height(node.right.right) < height(node.right.left):
                node.right = self._rotate(node.right, True)
            return self._rotate(node, False)
        return node

    def insert(self, key):
        self._key(key)
        def add(node):
            if node is None:
                return Node(key)
            if key < node.key:
                node.left = add(node.left)
            elif key > node.key:
                node.right = add(node.right)
            else:
                return node
            return self._balance(node)
        self.root = add(self.root)
        self._emit("insert", self.root, key=key)

    def delete(self, key):
        self._key(key)
        def remove(node, target):
            if node is None:
                return None
            if target < node.key:
                node.left = remove(node.left, target)
            elif target > node.key:
                node.right = remove(node.right, target)
            else:
                if node.left is None:
                    return node.right
                if node.right is None:
                    return node.left
                successor = node.right
                while successor.left:
                    successor = successor.left
                node.key = successor.key
                node.right = remove(node.right, successor.key)
            return self._balance(node)
        self.root = remove(self.root, key)
        self._emit("delete", self.root, key=key)

    def search(self, key):
        self._key(key)
        node = self.root
        while node:
            self._emit("compare", self.root, key=key, active=node.key)
            if node.key == key:
                self._emit("found", self.root, key=key, active=key)
                return True
            node = node.left if key < node.key else node.right
        self._emit("missing", self.root, key=key)
        return False

    def inorder(self):
        result, stack, node = [], [], self.root
        while node or stack:
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            result.append(node.key)
            node = node.right
        return result
