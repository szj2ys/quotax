# QuotaX Deployment Guide

## Overview

QuotaX uses Docker containers with GitHub Actions for CI/CD automation.

## Prerequisites

- Docker and Docker Compose
- Access to GitHub Container Registry (ghcr.io)
- MongoDB instance (or use the provided docker-compose)

## Local Development

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Manual Setup

```bash
cd server
npm install
npm run dev
```

## Environments

### Staging

- **API**: https://staging-api.quotax.com
- **Health Check**: https://staging-api.quotax.com/health

### Production

- **API**: https://api.quotax.com
- **Health Check**: https://api.quotax.com/health

## CI/CD Pipeline

### Continuous Integration (CI)

Triggered on every PR and push to `main` or `develop`:

1. **Server Tests**: Run Jest tests with MongoDB in-memory
2. **Client Build**: Build WeChat mini-program
3. **Lint Check**: Run ESLint

### Continuous Deployment (CD)

Triggered only on push to `main`:

1. **Build**: Create Docker image
2. **Push**: Push to GitHub Container Registry
3. **Deploy Staging**: Auto-deploy to staging
4. **Health Check**: Verify staging deployment
5. **Deploy Production**: Manual approval required
6. **Health Check**: Verify production deployment

## Deployment Commands

### Automated Deployment (via GitHub Actions)

Simply merge to `main` branch and the pipeline will handle deployment.

### Manual Deployment

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy specific version to production
./scripts/deploy.sh production v1.2.3
```

### Health Check

```bash
# Check local deployment
./scripts/health-check.sh

# Check specific endpoint
API_URL=https://api.quotax.com ./scripts/health-check.sh
```

## Rollback

If deployment fails health checks, automatic rollback is performed. For manual rollback:

```bash
# Stop current containers
docker-compose down

# Revert to previous image
docker pull ghcr.io/szj/quotax:PREVIOUS_TAG
docker-compose up -d
```

## Monitoring

- Health endpoint: `/health`
- Detailed health: `/health/detailed`
- Logs: `docker-compose logs -f api`

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs api

# Verify environment variables
env | grep -E '(JWT|MONGODB)'
```

### Database connection issues

```bash
# Check MongoDB connectivity
docker-compose exec api nc -zv mongo 27017
```

### Image pull failures

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```
