#!/bin/bash

# Health Collector Script
# Gathers system and service health metrics for Resilience Monitoring

echo "📊 Starting Health Collection - $(date)"

# 1. System Load
echo "System Load:"
uptime

# 2. Memory Usage
echo "Memory Usage:"
free -m

# 3. K8s Pod Status (if kubectl is available)
if command -v kubectl &> /dev/null; then
    echo "K8s Pod Status:"
    kubectl get pods -n college-media
fi

# 4. Redis Health
if command -v redis-cli &> /dev/null; then
    echo "Redis Info:"
    redis-cli -h ${REDIS_HOST:-127.0.0.1} info memory | grep 'used_memory_human'
fi

# 5. MongoDB Status
# In a container, we'd use mongosh
echo "Health Collection Complete."
