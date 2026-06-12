"""
Rate limiting in-memory por clave (típicamente IP).

Suficiente para una instancia única. Si se escala a múltiples instancias,
reemplazar por Redis o delegar completamente en el rate limiting de nginx.
"""
from collections import defaultdict
from datetime import datetime, timedelta


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = timedelta(seconds=window_seconds)
        self._log: dict[str, list[datetime]] = defaultdict(list)

    def allow(self, key: str) -> bool:
        """True si la clave puede hacer otra request dentro de la ventana."""
        now = datetime.now()
        cutoff = now - self.window
        bucket = [t for t in self._log[key] if t > cutoff]
        if len(bucket) >= self.max_requests:
            self._log[key] = bucket
            return False
        bucket.append(now)
        self._log[key] = bucket
        self._prune(cutoff)
        return True

    def _prune(self, cutoff: datetime) -> None:
        # Purga periódica: sin esto el dict crece sin límite con cada IP nueva
        # (vector de agotamiento de memoria ante floods con IPs spoofeadas).
        if len(self._log) > 10_000:
            alive = {
                k: v for k, v in self._log.items()
                if v and v[-1] > cutoff
            }
            self._log = defaultdict(list, alive)
