"""Check an integer for symmetry without converting it to a string."""


def is_palindrome(number: int) -> bool:
    """Return whether number is a palindrome; negative integers are not."""
    if type(number) is not int:
        raise TypeError("number must be an integer")
    if number < 0 or (number != 0 and number % 10 == 0):
        return False

    remaining_number = number
    reversed_half = 0
    while remaining_number > reversed_half:
        last_digit = remaining_number % 10
        reversed_half = reversed_half * 10 + last_digit
        remaining_number //= 10

    return (
        remaining_number == reversed_half
        or remaining_number == reversed_half // 10
    )


if __name__ == "__main__":
    print(is_palindrome(int(input().strip())))
