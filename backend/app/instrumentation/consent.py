import structlog

logger = structlog.get_logger()

class ConsentManager:
    """
    Manages user consent for privileged operations (e.g., eBPF, ETW).
    Follows ADR-0005: explicit consent gating.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.granted = False
        return cls._instance

    def request_consent(self, reason: str) -> None:
        """
        Record that consent was explicitly requested and granted.
        In a real application, this would be tied to an API endpoint triggered by UI interaction.
        """
        logger.info("consent_requested", reason=reason)
        self.granted = True
        logger.info("consent_granted", privileged_features_unlocked=True)

    def revoke_consent(self) -> None:
        """Revoke elevated privileges."""
        self.granted = False
        logger.info("consent_revoked", privileged_features_unlocked=False)

    def is_granted(self) -> bool:
        """Check if elevated privileges are currently allowed."""
        return self.granted

# Singleton access
consent_manager = ConsentManager()
