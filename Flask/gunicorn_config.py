# Optimized for memory-constrained environments
workers = 1
worker_class = "gevent"  # More memory-efficient for I/O-bound tasks
worker_connections = 10  # Limit concurrent connections
timeout = 120  # Reduced from 600s, sufficient for most summarization tasks
keepalive = 5  # Optimize connection handling
preload_app = True  # Load model before workers fork