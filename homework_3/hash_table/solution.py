"""Хеш-таблица: только list для хранения, коллизии методом цепочек."""


class HashTable:
    """Hashable-ключи, произвольные значения, рост при нагрузке > 0.75.

    Все контейнеры внутри таблицы — списки: массив корзин, цепочки,
    записи [hash, key, value]. Встроенный dict/set не используется.
    Ключ должен сохранять hash и равенство всё время хранения.
    """

    def __init__(self, capacity: int = 8):
        if isinstance(capacity, bool) or not isinstance(capacity, int):
            raise TypeError("Ёмкость должна быть целым числом")
        if capacity < 1:
            raise ValueError("Ёмкость должна быть положительной")
        self._buckets: list[list[list]] = [[] for _ in range(capacity)]
        self._size = 0

    def __len__(self) -> int:
        return self._size

    @property
    def capacity(self) -> int:
        return len(self._buckets)

    @property
    def load_factor(self) -> float:
        return self._size / self.capacity

    def _find(self, key, key_hash: int):
        for entry in self._buckets[key_hash % self.capacity]:
            if entry[0] == key_hash and (entry[1] is key or entry[1] == key):
                return entry
        return None

    def _resize(self) -> None:
        buckets: list[list[list]] = [[] for _ in range(self.capacity * 2)]
        for chain in self._buckets:
            for entry in chain:
                buckets[entry[0] % len(buckets)].append(entry)
        self._buckets = buckets

    def insert(self, key, value) -> None:
        """Вставить ключ или заменить его значение без изменения размера."""
        key_hash = hash(key)  # Нехешируемые ключи вызывают TypeError.
        entry = self._find(key, key_hash)
        if entry is not None:
            entry[2] = value
            return
        if (self._size + 1) / self.capacity > 0.75:
            self._resize()
        self._buckets[key_hash % self.capacity].append([key_hash, key, value])
        self._size += 1

    def search(self, key):
        """Вернуть значение; отсутствующий ключ вызывает KeyError."""
        entry = self._find(key, hash(key))
        if entry is None:
            raise KeyError(key)
        return entry[2]

    def delete(self, key) -> None:
        """Удалить запись; отсутствующий ключ вызывает KeyError."""
        key_hash = hash(key)
        chain = self._buckets[key_hash % self.capacity]
        for index, entry in enumerate(chain):
            if entry[0] == key_hash and (entry[1] is key or entry[1] == key):
                chain.pop(index)
                self._size -= 1
                return
        raise KeyError(key)

    def __contains__(self, key) -> bool:
        return self._find(key, hash(key)) is not None

    __setitem__ = insert
    __getitem__ = search
    __delitem__ = delete


if __name__ == "__main__":
    table = HashTable()
    table.insert("language", "Python")
    print(table.search("language"))
    table.delete("language")
    print(len(table))
