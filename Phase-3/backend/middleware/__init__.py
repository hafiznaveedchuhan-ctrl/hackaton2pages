"""Middleware module"""

from .performance import (
    ResponseCache,
    response_cache,
    cached_response,
    PerformanceMonitor,
    performance_monitor,
    monitor_performance,
    QueryOptimizer,
    BulkOperationOptimizer,
    PerformanceAdvisor,
    get_cache_stats,
    get_performance_stats,
    clear_cache,
    reset_performance_stats
)

__all__ = [
    "ResponseCache",
    "response_cache",
    "cached_response",
    "PerformanceMonitor",
    "performance_monitor",
    "monitor_performance",
    "QueryOptimizer",
    "BulkOperationOptimizer",
    "PerformanceAdvisor",
    "get_cache_stats",
    "get_performance_stats",
    "clear_cache",
    "reset_performance_stats"
]
