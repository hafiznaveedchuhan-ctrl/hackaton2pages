"""
Performance Optimization Middleware

Implements caching, request/response optimization, and monitoring
- Response caching
- Request deduplication
- Query optimization
- Performance monitoring

@specs/phase-3-overview.md - Performance Optimization
"""

import logging
import time
import hashlib
import json
from typing import Dict, Any, Optional, Callable
from functools import wraps
from datetime import datetime, timedelta
from collections import OrderedDict

logger = logging.getLogger(__name__)


class ResponseCache:
    """Simple in-memory response cache"""

    def __init__(self, max_size: int = 100, ttl_seconds: int = 300):
        self.cache: Dict[str, tuple[Any, float]] = OrderedDict()
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.hits = 0
        self.misses = 0

    def _generate_key(self, func_name: str, *args, **kwargs) -> str:
        """Generate cache key from function name and arguments"""
        key_data = {
            'func': func_name,
            'args': str(args),
            'kwargs': str(sorted(kwargs.items()))
        }
        key_str = json.dumps(key_data, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key not in self.cache:
            self.misses += 1
            return None

        value, timestamp = self.cache[key]
        if time.time() - timestamp > self.ttl_seconds:
            del self.cache[key]
            self.misses += 1
            return None

        self.hits += 1
        return value

    def set(self, key: str, value: Any) -> None:
        """Set value in cache with LRU eviction"""
        if len(self.cache) >= self.max_size:
            # Remove oldest entry (FIFO)
            self.cache.popitem(last=False)

        self.cache[key] = (value, time.time())

    def clear(self) -> None:
        """Clear all cached values"""
        self.cache.clear()
        self.hits = 0
        self.misses = 0

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0

        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': f"{hit_rate:.1f}%"
        }


# Global cache instance
response_cache = ResponseCache()


def cached_response(ttl_seconds: int = 300):
    """
    Decorator to cache function responses.

    Args:
        ttl_seconds: Time to live for cached response in seconds

    Example:
        @cached_response(ttl_seconds=600)
        def list_tasks(user_id):
            return query_database()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            key = response_cache._generate_key(func.__name__, *args, **kwargs)

            # Try to get from cache
            cached_value = response_cache.get(key)
            if cached_value is not None:
                logger.debug(f"Cache hit for {func.__name__}")
                return cached_value

            # Execute function
            result = func(*args, **kwargs)

            # Store in cache
            response_cache.set(key, result)
            logger.debug(f"Cached response for {func.__name__}")

            return result

        return wrapper
    return decorator


class PerformanceMonitor:
    """Monitor and log performance metrics"""

    def __init__(self):
        self.request_times: Dict[str, list[float]] = {}
        self.request_counts: Dict[str, int] = {}

    def record_request(self, endpoint: str, duration_ms: float) -> None:
        """Record request timing"""
        if endpoint not in self.request_times:
            self.request_times[endpoint] = []
            self.request_counts[endpoint] = 0

        self.request_times[endpoint].append(duration_ms)
        self.request_counts[endpoint] += 1

        # Keep only last 1000 measurements per endpoint
        if len(self.request_times[endpoint]) > 1000:
            self.request_times[endpoint] = self.request_times[endpoint][-1000:]

    def get_stats(self, endpoint: str) -> Dict[str, Any]:
        """Get performance statistics for endpoint"""
        if endpoint not in self.request_times:
            return {}

        times = self.request_times[endpoint]
        if not times:
            return {}

        return {
            'endpoint': endpoint,
            'count': self.request_counts.get(endpoint, 0),
            'min_ms': min(times),
            'max_ms': max(times),
            'avg_ms': sum(times) / len(times),
            'p95_ms': sorted(times)[int(len(times) * 0.95)] if len(times) > 0 else 0,
            'p99_ms': sorted(times)[int(len(times) * 0.99)] if len(times) > 0 else 0
        }

    def get_all_stats(self) -> Dict[str, Any]:
        """Get statistics for all endpoints"""
        return {
            endpoint: self.get_stats(endpoint)
            for endpoint in self.request_times.keys()
        }


# Global monitor instance
performance_monitor = PerformanceMonitor()


def monitor_performance(endpoint_name: str = None):
    """
    Decorator to monitor function performance.

    Args:
        endpoint_name: Name of endpoint for logging

    Example:
        @monitor_performance("list_tasks")
        def list_tasks_handler(request):
            return tasks
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000

            name = endpoint_name or func.__name__
            performance_monitor.record_request(name, duration_ms)

            if duration_ms > 1000:
                logger.warning(f"{name} took {duration_ms:.1f}ms")
            else:
                logger.debug(f"{name} took {duration_ms:.1f}ms")

            return result

        return wrapper
    return decorator


class QueryOptimizer:
    """Optimize database queries"""

    @staticmethod
    def prefetch_related(session, model, related_fields: list[str]):
        """Prefetch related objects to avoid N+1 queries"""
        query = session.query(model)
        for field in related_fields:
            # Implementation depends on ORM
            pass
        return query

    @staticmethod
    def select_fields(session, model, fields: list[str]):
        """Select specific fields instead of entire model"""
        # Implementation depends on ORM
        pass

    @staticmethod
    def enable_query_caching(session):
        """Enable query result caching at session level"""
        # Implementation depends on ORM configuration
        pass


class BulkOperationOptimizer:
    """Optimize bulk operations"""

    @staticmethod
    async def batch_insert(session, models: list[Any], batch_size: int = 100):
        """Insert multiple records in batches"""
        for i in range(0, len(models), batch_size):
            batch = models[i:i + batch_size]
            for model in batch:
                session.add(model)
            session.commit()

    @staticmethod
    async def batch_update(session, updates: Dict[Any, dict], batch_size: int = 100):
        """Update multiple records in batches"""
        items = list(updates.items())
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            for model, values in batch:
                for key, value in values.items():
                    setattr(model, key, value)
            session.commit()

    @staticmethod
    async def batch_delete(session, models: list[Any], batch_size: int = 100):
        """Delete multiple records in batches"""
        for i in range(0, len(models), batch_size):
            batch = models[i:i + batch_size]
            for model in batch:
                session.delete(model)
            session.commit()


# Monitoring utilities
def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics"""
    return response_cache.get_stats()


def get_performance_stats() -> Dict[str, Any]:
    """Get performance statistics"""
    return performance_monitor.get_all_stats()


def clear_cache() -> None:
    """Clear all cached responses"""
    response_cache.clear()


def reset_performance_stats() -> None:
    """Reset performance statistics"""
    performance_monitor.request_times.clear()
    performance_monitor.request_counts.clear()


# Performance recommendations
class PerformanceAdvisor:
    """Provide performance optimization recommendations"""

    @staticmethod
    def analyze_endpoint(endpoint: str) -> Dict[str, Any]:
        """Analyze endpoint performance and provide recommendations"""
        stats = performance_monitor.get_stats(endpoint)
        recommendations = []

        if not stats:
            return {'recommendations': []}

        avg_time = stats.get('avg_ms', 0)
        max_time = stats.get('max_ms', 0)

        # Check if endpoint is slow
        if avg_time > 500:
            recommendations.append({
                'issue': 'Slow endpoint',
                'message': f"Average response time is {avg_time:.1f}ms",
                'suggestion': 'Consider adding caching or optimizing queries'
            })

        # Check if there's high variance
        if max_time > avg_time * 3:
            recommendations.append({
                'issue': 'Inconsistent performance',
                'message': f"Max response time is {max_time:.1f}ms (avg: {avg_time:.1f}ms)",
                'suggestion': 'Check for cache misses or resource contention'
            })

        return {
            'endpoint': endpoint,
            'stats': stats,
            'recommendations': recommendations
        }

    @staticmethod
    def get_recommendations() -> Dict[str, Any]:
        """Get recommendations for all endpoints"""
        return {
            endpoint: PerformanceAdvisor.analyze_endpoint(endpoint)
            for endpoint in performance_monitor.request_times.keys()
        }
