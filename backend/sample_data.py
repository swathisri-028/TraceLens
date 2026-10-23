"""
TraceLens Sample Datasets and Labeled Ground Truth Benchmark
Provides realistic application logs including normal operations, ordinary handled errors,
and genuine cascading anomalies with ground truth labels for model evaluation.
"""

from typing import List, Dict, Any, Tuple

# Sample 1: E-Commerce Payment Gateway & Database Outage
SAMPLE_ECOMMERCE_OUTAGE = """2026-10-23 14:00:01.102 [INFO] [web-gateway] GET /products/featured HTTP/1.1 200 - 12ms
2026-10-23 14:00:02.340 [INFO] [cart-service] Item added to cart: user_id=9412 item_id=sku_8829
2026-10-23 14:00:03.119 [INFO] [web-gateway] GET /cart HTTP/1.1 200 - 8ms
2026-10-23 14:00:04.550 [WARN] [promo-service] Promo code EXPIRED_FALL rejected for user_id=9412
2026-10-23 14:00:05.120 [INFO] [inventory-service] Inventory reserved: item_id=sku_8829 qty=1
2026-10-23 14:00:06.210 [INFO] [payment-api] Initiating payment intent: order_id=ord_9841 amount=129.50
2026-10-23 14:00:07.450 [INFO] [web-gateway] GET /products/electronics HTTP/1.1 200 - 14ms
2026-10-23 14:00:08.890 [ERROR] [web-gateway] GET /static/missing-banner.png HTTP/1.1 404 - 2ms
2026-10-23 14:00:10.150 [INFO] [order-service] Order created successfully: order_id=ord_9841
2026-10-23 14:00:12.330 [INFO] [notification-worker] Sent order confirmation email to user_id=9412
2026-10-23 14:00:15.010 [INFO] [web-gateway] GET /account/orders HTTP/1.1 200 - 18ms
2026-10-23 14:00:18.220 [WARN] [db-pool] Connection pool utilization reached 78% (15/20 active)
2026-10-23 14:00:20.100 [INFO] [web-gateway] GET /products/apparel HTTP/1.1 200 - 15ms
2026-10-23 14:00:22.440 [WARN] [db-pool] Connection pool utilization reached 92% (18/20 active)
2026-10-23 14:00:25.012 [CRITICAL] [db-pool] Connection pool exhausted! Max capacity 20 reached. Request waiting...
2026-10-23 14:00:25.820 [ERROR] [checkout-service] DBConnectionTimeoutException: Unable to acquire connection within 5000ms
   at com.tracelens.db.HikariPool.getConnection(HikariPool.java:182)
   at com.tracelens.checkout.OrderDao.save(OrderDao.java:94)
   at com.tracelens.checkout.Service.processOrder(Service.java:44)
2026-10-23 14:00:26.110 [ERROR] [checkout-service] DBConnectionTimeoutException: Unable to acquire connection within 5000ms
2026-10-23 14:00:26.340 [ERROR] [checkout-service] DBConnectionTimeoutException: Unable to acquire connection within 5000ms
2026-10-23 14:00:26.550 [ERROR] [payment-api] Payment webhook dispatch failed: database unreachable
2026-10-23 14:00:26.890 [ERROR] [checkout-service] DBConnectionTimeoutException: Unable to acquire connection within 5000ms
2026-10-23 14:00:27.120 [CRITICAL] [web-gateway] Cascading 503 Service Unavailable: /checkout/submit downstream failed
2026-10-23 14:00:27.400 [ERROR] [checkout-service] DBConnectionTimeoutException: Unable to acquire connection within 5000ms
2026-10-23 14:00:27.750 [ERROR] [checkout-service] DBConnectionTimeoutException: Unable to acquire connection within 5000ms
2026-10-23 14:00:28.100 [ERROR] [web-gateway] POST /checkout/submit HTTP/1.1 503 - 5210ms
2026-10-23 14:00:28.450 [ERROR] [web-gateway] POST /checkout/submit HTTP/1.1 503 - 5180ms
2026-10-23 14:00:28.910 [CRITICAL] [circuit-breaker] Circuit breaker OPEN for checkout-service (failure rate: 89%)
2026-10-23 14:00:30.120 [WARN] [recovery-worker] Evicting stale idle connections from pool
2026-10-23 14:00:32.400 [INFO] [recovery-worker] Resetting database connection pool: purged 18 dead sockets
2026-10-23 14:00:35.100 [INFO] [circuit-breaker] Circuit breaker transitioning to HALF-OPEN state
2026-10-23 14:00:38.200 [INFO] [web-gateway] POST /checkout/submit HTTP/1.1 200 - 320ms
2026-10-23 14:00:40.500 [INFO] [circuit-breaker] Circuit breaker CLOSED: downstream healthy
2026-10-23 14:00:42.110 [INFO] [web-gateway] GET /products HTTP/1.1 200 - 11ms
"""

# Sample 2: Microservice Memory Leak & OOM Killer
SAMPLE_MEMORY_LEAK = """2026-10-23 16:10:00.100 [INFO] [worker-stream] Stream consumer started partition=0 offset=98210
2026-10-23 16:10:05.200 [INFO] [worker-stream] Processed 1000 messages in 5.1s
2026-10-23 16:10:10.350 [INFO] [worker-stream] Processed 1000 messages in 5.0s
2026-10-23 16:10:15.500 [WARN] [runtime-gc] Full GC invoked: pause_duration=480ms heap_used=82%
2026-10-23 16:10:18.120 [ERROR] [metrics-collector] Metric export to statsd dropped: buffer overflow
2026-10-23 16:10:20.600 [WARN] [runtime-gc] Full GC invoked: pause_duration=1420ms heap_used=91%
2026-10-23 16:10:22.900 [WARN] [worker-stream] Heartbeat delay to cluster coordinator: 1850ms (threshold 1000ms)
2026-10-23 16:10:25.100 [CRITICAL] [runtime-gc] OutOfMemoryError: Java heap space cannot allocate 16384 bytes
   at java.util.Arrays.copyOf(Arrays.java:3215)
   at java.io.ByteArrayOutputStream.grow(ByteArrayOutputStream.java:118)
   at com.tracelens.aggregator.Buffer.append(Buffer.java:82)
2026-10-23 16:10:25.400 [CRITICAL] [kernel] Process worker-stream (pid 8419) killed by Linux OOM killer: score 992
2026-10-23 16:10:26.100 [ERROR] [supervisor] Child process 8419 terminated unexpectedly with signal 9 (SIGKILL)
2026-10-23 16:10:28.000 [INFO] [supervisor] Spawning replacement container instance worker-stream-repl-1
2026-10-23 16:10:32.400 [INFO] [worker-stream-repl-1] Container initialized. Resuming stream consumer partition=0
2026-10-23 16:10:35.100 [INFO] [worker-stream-repl-1] Processing resumed successfully
"""

# Sample 3: Ground Truth Benchmark Dataset with Verified Labels
# Contains 60 carefully curated log records spanning normal background operations,
# ordinary single handled user errors (NOT anomalies), and genuine cascading system anomalies (TRUE anomalies).
LABELED_BENCHMARK_ENTRIES = [
    # 0 - 9: Baseline Normal Traffic
    {"ts": "2026-10-23 10:00:01", "level": "INFO", "service": "auth-service", "msg": "User login session created: user_id=1029", "ground_truth": False, "reason": "Normal user activity"},
    {"ts": "2026-10-23 10:00:02", "level": "INFO", "service": "api-gateway", "msg": "GET /api/v1/profile HTTP/1.1 200 - 15ms", "ground_truth": False, "reason": "Normal HTTP 200 response"},
    {"ts": "2026-10-23 10:00:03", "level": "DEBUG", "service": "cache-service", "msg": "Cache hit for key user:profile:1029", "ground_truth": False, "reason": "Nominal cache hit"},
    {"ts": "2026-10-23 10:00:04", "level": "INFO", "service": "api-gateway", "msg": "GET /api/v1/feed HTTP/1.1 200 - 45ms", "ground_truth": False, "reason": "Normal feed request"},
    {"ts": "2026-10-23 10:00:05", "level": "WARN", "service": "auth-service", "msg": "Password reset token expired for user_id=4091", "ground_truth": False, "reason": "Expected user workflow warning"},
    {"ts": "2026-10-23 10:00:06", "level": "INFO", "service": "api-gateway", "msg": "POST /api/v1/settings HTTP/1.1 200 - 22ms", "ground_truth": False, "reason": "Normal request"},
    {"ts": "2026-10-23 10:00:07", "level": "ERROR", "service": "api-gateway", "msg": "GET /favicon.ico HTTP/1.1 404 - 1ms", "ground_truth": False, "reason": "Ordinary handled 404 error - not a system anomaly"},
    {"ts": "2026-10-23 10:00:08", "level": "INFO", "service": "order-service", "msg": "Draft order saved: draft_id=df_8291", "ground_truth": False, "reason": "Normal workflow"},
    {"ts": "2026-10-23 10:00:09", "level": "WARN", "service": "billing-service", "msg": "Card exp date in past: user_id=8812 card=ending_4011", "ground_truth": False, "reason": "Standard client validation warning"},
    {"ts": "2026-10-23 10:00:10", "level": "INFO", "service": "api-gateway", "msg": "GET /api/v1/items HTTP/1.1 200 - 19ms", "ground_truth": False, "reason": "Normal endpoint traffic"},
    
    # 10 - 14: Routine Handled Failures (Ordinary Errors, Still NOT Anomaly Incidents)
    {"ts": "2026-10-23 10:00:12", "level": "ERROR", "service": "auth-service", "msg": "Invalid credentials provided for user: test_account", "ground_truth": False, "reason": "Ordinary failed login attempt - isolated"},
    {"ts": "2026-10-23 10:00:14", "level": "INFO", "service": "order-service", "msg": "Order validation passed: order_id=ord_1102", "ground_truth": False, "reason": "Nominal order validation"},
    {"ts": "2026-10-23 10:00:15", "level": "ERROR", "service": "inventory-api", "msg": "SKU not found in catalog: sku_missing_99", "ground_truth": False, "reason": "Ordinary business validation error"},
    {"ts": "2026-10-23 10:00:16", "level": "INFO", "service": "api-gateway", "msg": "GET /api/v1/search?q=shoes HTTP/1.1 200 - 32ms", "ground_truth": False, "reason": "Normal query"},
    {"ts": "2026-10-23 10:00:18", "level": "INFO", "service": "billing-service", "msg": "Subscription renewed: sub_4482 user_id=3120", "ground_truth": False, "reason": "Normal billing event"},

    # 15 - 26: ANOMALY INCIDENT 1: Cascading Database Connection Pool Exhaustion & Circuit Breaker Trip
    {"ts": "2026-10-23 10:00:20", "level": "WARN", "service": "db-pool", "msg": "HikariPool-1 connection acquisition wait 1840ms exceeds threshold 1000ms", "ground_truth": True, "reason": "Early anomaly signal: severe DB lock latency"},
    {"ts": "2026-10-23 10:00:21", "level": "CRITICAL", "service": "db-pool", "msg": "HikariPool-1 pool exhausted! 50/50 active connections held > 15s", "ground_truth": True, "reason": "Severe resource exhaustion anomaly"},
    {"ts": "2026-10-23 10:00:21", "level": "ERROR", "service": "order-service", "msg": "ConnectionTimeoutException: Request timed out after 30000ms waiting for connection", "ground_truth": True, "reason": "Cascading failure storm"},
    {"ts": "2026-10-23 10:00:22", "level": "ERROR", "service": "order-service", "msg": "ConnectionTimeoutException: Request timed out after 30000ms waiting for connection", "ground_truth": True, "reason": "Cascading failure storm"},
    {"ts": "2026-10-23 10:00:22", "level": "ERROR", "service": "order-service", "msg": "ConnectionTimeoutException: Request timed out after 30000ms waiting for connection", "ground_truth": True, "reason": "Cascading failure storm"},
    {"ts": "2026-10-23 10:00:23", "level": "ERROR", "service": "order-service", "msg": "ConnectionTimeoutException: Request timed out after 30000ms waiting for connection", "ground_truth": True, "reason": "Cascading failure storm"},
    {"ts": "2026-10-23 10:00:23", "level": "ERROR", "service": "billing-service", "msg": "Transaction aborted: could not acquire write lock on ledger", "ground_truth": True, "reason": "Cross-service deadlock cascade"},
    {"ts": "2026-10-23 10:00:24", "level": "CRITICAL", "service": "api-gateway", "msg": "HTTP 503 Service Unavailable spike: 18 downstream RPC timeouts in 2s", "ground_truth": True, "reason": "System-wide gateway outage"},
    {"ts": "2026-10-23 10:00:24", "level": "CRITICAL", "service": "circuit-breaker", "msg": "OrderService circuit tripped to OPEN. Rejecting all incoming requests", "ground_truth": True, "reason": "Protective circuit breaker trip"},
    {"ts": "2026-10-23 10:00:25", "level": "ERROR", "service": "api-gateway", "msg": "POST /api/v1/orders HTTP/1.1 503 - 30050ms", "ground_truth": True, "reason": "Failed customer checkout requests during incident"},
    {"ts": "2026-10-23 10:00:25", "level": "ERROR", "service": "api-gateway", "msg": "POST /api/v1/orders HTTP/1.1 503 - 30048ms", "ground_truth": True, "reason": "Failed customer checkout requests during incident"},
    {"ts": "2026-10-23 10:00:26", "level": "ERROR", "service": "api-gateway", "msg": "POST /api/v1/orders HTTP/1.1 503 - 30052ms", "ground_truth": True, "reason": "Failed customer checkout requests during incident"},

    # 27 - 35: System Recovery & Nominal Operations
    {"ts": "2026-10-23 10:00:30", "level": "INFO", "service": "db-pool", "msg": "Pool auto-healer flushed dead connections. Active: 4/50", "ground_truth": False, "reason": "Recovery telemetry"},
    {"ts": "2026-10-23 10:00:32", "level": "INFO", "service": "circuit-breaker", "msg": "OrderService circuit state changed to HALF-OPEN", "ground_truth": False, "reason": "Recovery telemetry"},
    {"ts": "2026-10-23 10:00:35", "level": "INFO", "service": "order-service", "msg": "Canary order processed successfully: order_id=ord_1103", "ground_truth": False, "reason": "Normal operation restored"},
    {"ts": "2026-10-23 10:00:38", "level": "INFO", "service": "circuit-breaker", "msg": "OrderService circuit CLOSED: healthy", "ground_truth": False, "reason": "Fully recovered"},
    {"ts": "2026-10-23 10:00:40", "level": "INFO", "service": "api-gateway", "msg": "GET /api/v1/feed HTTP/1.1 200 - 38ms", "ground_truth": False, "reason": "Normal traffic"},
    {"ts": "2026-10-23 10:00:42", "level": "INFO", "service": "auth-service", "msg": "User login session created: user_id=2081", "ground_truth": False, "reason": "Normal traffic"},
    {"ts": "2026-10-23 10:00:45", "level": "DEBUG", "service": "cache-service", "msg": "Cache set key user:profile:2081 ttl=3600", "ground_truth": False, "reason": "Normal traffic"},
    {"ts": "2026-10-23 10:00:48", "level": "INFO", "service": "billing-service", "msg": "Payment method attached: user_id=2081 pm_9182", "ground_truth": False, "reason": "Normal traffic"},
    {"ts": "2026-10-23 10:00:50", "level": "WARN", "service": "api-gateway", "msg": "Client closed connection before response completed (client abort)", "ground_truth": False, "reason": "Standard client network hiccup"},

    # 36 - 45: ANOMALY INCIDENT 2: Credential Stuffing Bot Attack & Rate Limiter Exhaustion
    {"ts": "2026-10-23 10:01:00", "level": "WARN", "service": "auth-service", "msg": "High volume authentication attempts from CIDR 198.51.100.0/24", "ground_truth": True, "reason": "Brute force attack burst start"},
    {"ts": "2026-10-23 10:01:01", "level": "ERROR", "service": "auth-service", "msg": "Failed login for root from IP 198.51.100.41", "ground_truth": True, "reason": "Credential stuffing storm"},
    {"ts": "2026-10-23 10:01:01", "level": "ERROR", "service": "auth-service", "msg": "Failed login for admin from IP 198.51.100.42", "ground_truth": True, "reason": "Credential stuffing storm"},
    {"ts": "2026-10-23 10:01:02", "level": "ERROR", "service": "auth-service", "msg": "Failed login for test from IP 198.51.100.43", "ground_truth": True, "reason": "Credential stuffing storm"},
    {"ts": "2026-10-23 10:01:02", "level": "ERROR", "service": "auth-service", "msg": "Failed login for user1 from IP 198.51.100.44", "ground_truth": True, "reason": "Credential stuffing storm"},
    {"ts": "2026-10-23 10:01:02", "level": "ERROR", "service": "auth-service", "msg": "Failed login for supervisor from IP 198.51.100.45", "ground_truth": True, "reason": "Credential stuffing storm"},
    {"ts": "2026-10-23 10:01:03", "level": "CRITICAL", "service": "rate-limiter", "msg": "Redis token bucket cluster saturated: dropped 450 requests/sec", "ground_truth": True, "reason": "Security rate limiter saturation anomaly"},
    {"ts": "2026-10-23 10:01:03", "level": "CRITICAL", "service": "waf-firewall", "msg": "Automated IP block enacted: blacklisting 198.51.100.0/24", "ground_truth": True, "reason": "Security defense emergency action"},
    {"ts": "2026-10-23 10:01:04", "level": "WARN", "service": "auth-service", "msg": "Blocked 312 subsequent requests from banned subnet", "ground_truth": True, "reason": "Attack mitigation spillover"},

    # 46 - 54: Post-attack Normal Steady-state
    {"ts": "2026-10-23 10:01:10", "level": "INFO", "service": "auth-service", "msg": "Nominal authentication load restored: 4 req/sec", "ground_truth": False, "reason": "Normal operational steady-state"},
    {"ts": "2026-10-23 10:01:12", "level": "INFO", "service": "api-gateway", "msg": "GET /api/v1/feed HTTP/1.1 200 - 33ms", "ground_truth": False, "reason": "Normal traffic"},
    {"ts": "2026-10-23 10:01:15", "level": "INFO", "service": "order-service", "msg": "Order created: order_id=ord_1104 total=$49.99", "ground_truth": False, "reason": "Normal transaction"},
    {"ts": "2026-10-23 10:01:18", "level": "INFO", "service": "billing-service", "msg": "Capture payment succeeded: ch_9921", "ground_truth": False, "reason": "Normal transaction"},
    {"ts": "2026-10-23 10:01:20", "level": "DEBUG", "service": "worker-pool", "msg": "Async job queue depth: 2 jobs pending", "ground_truth": False, "reason": "Nominal queue metrics"},
    {"ts": "2026-10-23 10:01:22", "level": "ERROR", "service": "api-gateway", "msg": "POST /api/v1/comments HTTP/1.1 400 - Validation error: comment text empty", "ground_truth": False, "reason": "Handled client validation 400 error - not anomaly"},
    {"ts": "2026-10-23 10:01:25", "level": "INFO", "service": "api-gateway", "msg": "GET /api/v1/profile HTTP/1.1 200 - 12ms", "ground_truth": False, "reason": "Normal traffic"},
    {"ts": "2026-10-23 10:01:30", "level": "INFO", "service": "scheduler", "msg": "Hourly cleanup job completed: removed 0 expired sessions", "ground_truth": False, "reason": "Routine housekeeping"},
]

def get_benchmark_log_text_and_labels() -> Tuple[str, List[Dict[str, Any]]]:
    """Format benchmark entries into raw log text and metadata with ground truth."""
    lines = []
    labels = []
    for idx, e in enumerate(LABELED_BENCHMARK_ENTRIES):
        line = f"{e['ts']} [{e['level']}] [{e['service']}] {e['msg']}"
        lines.append(line)
        labels.append({
            "id": idx,
            "ground_truth": e["ground_truth"],
            "ground_truth_reason": e["reason"],
            "expected_label": "ANOMALY" if e["ground_truth"] else "NORMAL",
        })
    return "\n".join(lines), labels

def get_sample_catalog() -> List[Dict[str, Any]]:
    """Return catalog of available samples."""
    return [
        {
            "id": "ecommerce_outage",
            "name": "E-Commerce Database Outage & Cascading 503s",
            "description": "Simulates a payment service timeout cascading into Hikari database connection pool exhaustion and circuit breaker tripping.",
            "type": "Production Incident",
            "line_count": len(SAMPLE_ECOMMERCE_OUTAGE.strip().splitlines()),
            "raw": SAMPLE_ECOMMERCE_OUTAGE.strip(),
        },
        {
            "id": "memory_leak",
            "name": "Microservice Memory Leak & Linux OOM Killer",
            "description": "Demonstrates gradual heap saturation, GC pause spikes, JVM OutOfMemoryError, and container restart loop.",
            "type": "System Crash",
            "line_count": len(SAMPLE_MEMORY_LEAK.strip().splitlines()),
            "raw": SAMPLE_MEMORY_LEAK.strip(),
        },
        {
            "id": "labeled_benchmark",
            "name": "Labeled Benchmark Dataset (for Model Evaluation)",
            "description": "54 verified log records containing normal traffic, ordinary handled errors (404s, validation errors), and 2 genuine incident clusters with documented ground truth.",
            "type": "Benchmark Dataset",
            "line_count": len(LABELED_BENCHMARK_ENTRIES),
            "raw": get_benchmark_log_text_and_labels()[0],
        }
    ]
