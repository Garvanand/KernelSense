from fastapi import Request

class RateLimiter:
    """
    Placeholder for rate limiting middleware.
    In production, this relies on Redis (ADR-0001).
    """
    def __init__(self, requests: int, window: int):
        self.requests = requests
        self.window = window

    async def __call__(self, request: Request):
        return True
