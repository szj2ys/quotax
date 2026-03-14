#!/bin/bash

# QuotaX Health Check Script
# Returns 0 if healthy, 1 if unhealthy

API_URL=${API_URL:-http://localhost:3000}
TIMEOUT=${TIMEOUT:-10}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Checking health at ${API_URL}..."

# Check API health endpoint
if ! curl -sf --max-time ${TIMEOUT} "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}Health check FAILED${NC}: API is not responding"
    exit 1
fi

# Check detailed health if available
HEALTH_RESPONSE=$(curl -sf --max-time ${TIMEOUT} "${API_URL}/health" 2>/dev/null || echo '{}')

# Parse status from JSON (if jq is available)
if command -v jq &> /dev/null; then
    STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status // "unknown"')
    if [ "$STATUS" != "healthy" ]; then
        echo -e "${RED}Health check FAILED${NC}: Status is ${STATUS}"
        echo "Response: $HEALTH_RESPONSE"
        exit 1
    fi
fi

echo -e "${GREEN}Health check PASSED${NC}"
exit 0
