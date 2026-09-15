"""Count primes strictly below a limit using the sieve of Eratosthenes."""
from math import isqrt


def count_primes(limit: int) -> int:
    """Return the number of primes in the half-open interval [2, limit)."""
    if type(limit) is not int:
        raise TypeError("limit must be an integer")
    if limit <= 2:
        return 0

    is_prime = bytearray([1]) * limit
    is_prime[0] = is_prime[1] = 0
    for candidate in range(2, isqrt(limit - 1) + 1):
        if is_prime[candidate]:
            for multiple in range(candidate * candidate, limit, candidate):
                is_prime[multiple] = 0
    return sum(is_prime)


if __name__ == "__main__":
    print(count_primes(int(input().strip())))
