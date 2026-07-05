from backend.app.access.level_policy import AccessTier

class AccessState:
    _current_tier: AccessTier = AccessTier.GUEST

    @classmethod
    def get_tier(cls) -> AccessTier:
        return cls._current_tier

    @classmethod
    def set_tier(cls, tier: AccessTier):
        cls._current_tier = tier
