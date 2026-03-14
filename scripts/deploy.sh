#!/bin/bash
set -e

# QuotaX Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh staging

ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    error "Invalid environment. Must be 'staging' or 'production'"
    exit 1
fi

log "Starting deployment to ${ENVIRONMENT}..."

# Pull latest image
log "Pulling image: ghcr.io/szj/quotax:${IMAGE_TAG}"
docker pull ghcr.io/szj/quotax:${IMAGE_TAG} || {
    error "Failed to pull image"
    exit 1
}

# Backup current state
if [ -f "docker-compose.yml" ]; then
    log "Creating backup..."
    cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
fi

# Deploy
log "Deploying with docker-compose..."
export IMAGE_TAG=${IMAGE_TAG}
docker-compose -f docker-compose.yml -f docker-compose.${ENVIRONMENT}.yml up -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 10

# Health check
log "Running health check..."
./health-check.sh || {
    error "Health check failed! Rolling back..."
    # Rollback logic here
    exit 1
}

log "Deployment to ${ENVIRONMENT} completed successfully!"
