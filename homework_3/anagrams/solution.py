"""Группировка анаграмм по отсортированным символам."""


def group_anagrams(strs: list[str]) -> list[list[str]]:
    """Сохранить порядок появления групп и слов, включая повторы.

    Регистр, пробелы и Unicode-кодовые точки значимы. Вход не меняется.
    """
    groups: dict[str, list[str]] = {}
    for word in strs:
        signature = "".join(sorted(word))
        if signature not in groups:
            groups[signature] = []
        groups[signature].append(word)
    return list(groups.values())


if __name__ == "__main__":
    print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
