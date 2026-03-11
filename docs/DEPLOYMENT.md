# Deployment Guide

This guide covers deploying The Autonomous AI Startup Architecture from local development to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Platforms](#cloud-platforms)
5. [Database Setup](#database-setup)
6. [OpenClaw Gateway](#openclaw-gateway)
7. [Environment Configuration](#environment-configuration)
8. [Scaling](#scaling)
9. [Security](#security)
10. [Monitoring](#monitoring)

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x+ | Runtime |
| pnpm | 8.x+ | Package manager |
| SQLite | 3.x+ | Database |
| Docker | 24.x+ | Containerization (optional) |

### System Requirements

| Environment | CPU | RAM | Storage |
|-------------|-----|-----|---------|
| Development | 2 cores | 4GB | 10GB |
| Production (small) | 4 cores | 8GB | 50GB |
| Production (large) | 8+ cores | 16GB+ | 100GB+ |

## Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/vigourpt/The-Autonomous-AI-Startup-Architecture.git
cd The-Autonomous-AI-Startup-Architecture

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Seed initial agents
pnpm db:seed

# Import specialized agents (optional)
pnpm tsx scripts/import-specialized-agents.ts

# Start development server
pnpm dev
```

### Development Scripts

```bash
# Start with hot reload
pnpm dev

# Type checking
pnpm type-check

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code
pnpm format

# Database optimization
pnpm db:optimize

# Performance report
pnpm perf:report
```

## Docker Deployment

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/workspace ./workspace

# Set permissions
RUN mkdir -p .data && chown nextjs:nodejs .data
USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/.data/ai-startup.db
    volumes:
      - app-data:/app/.data
      - ./workspace:/app/workspace:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  openclaw-gateway:
    image: openclaw/gateway:latest
    ports:
      - "18789:18789"
    environment:
      - OPENCLAW_PORT=18789
    volumes:
      - openclaw-data:/data
    restart: unless-stopped

volumes:
  app-data:
  openclaw-data:
```

### Build and Run

```bash
# Build image
docker build -t ai-startup:latest .

# Run container
docker run -d \
  --name ai-startup \
  -p 3000:3000 \
  -v ai-startup-data:/app/.data \
  ai-startup:latest

# Or use Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Cloud Platforms

### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**vercel.json:**
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_PATH": ".data/ai-startup.db"
  }
}
```

### AWS ECS

```yaml
# task-definition.json
{
  "family": "ai-startup",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "your-ecr-repo/ai-startup:latest",
      "portMappings": [
        { "containerPort": 3000, "protocol": "tcp" }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-startup",
          "awslogs-region": "us-east-1"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "512",
  "memory": "1024"
}
```

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-startup

# Deploy
gcloud run deploy ai-startup \
  --image gcr.io/PROJECT_ID/ai-startup \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --allow-unauthenticated
```

### Railway

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/api/health"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 5
```

## Database Setup

### SQLite (Default)

SQLite is the default database and works well for most deployments:

```bash
# Set database path
export DATABASE_PATH=.data/ai-startup.db

# Run migrations
pnpm db:migrate

# Optimize database
pnpm db:optimize

# Check database status
pnpm db:status
```

### Database Optimization

```bash
# Run optimization script
pnpm tsx scripts/db-optimize.ts

# Or via API
curl -X POST http://localhost:3000/api/admin/db/optimize
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

DB_PATH=".data/ai-startup.db"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
sqlite3 "$DB_PATH" ".backup '${BACKUP_DIR}/ai-startup-${DATE}.db'"

# Compress
gzip "${BACKUP_DIR}/ai-startup-${DATE}.db"

# Cleanup old backups (keep 7 days)
find "$BACKUP_DIR" -name "*.db.gz" -mtime +7 -delete
```

### Data Migration

```bash
# Export data
sqlite3 .data/ai-startup.db ".mode json" ".output export.json" "SELECT * FROM agents;"

# Import to new database
pnpm tsx scripts/import-data.ts --file export.json
```

## OpenClaw Gateway

### Local Gateway

```bash
# Start local gateway (if using Docker)
docker run -d \
  --name openclaw-gateway \
  -p 18789:18789 \
  -v openclaw-data:/data \
  openclaw/gateway:latest
```

### Cloud Gateway Deployment

For production, deploy OpenClaw gateway separately:

```yaml
# kubernetes/openclaw.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openclaw-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: openclaw-gateway
  template:
    metadata:
      labels:
        app: openclaw-gateway
    spec:
      containers:
      - name: gateway
        image: openclaw/gateway:latest
        ports:
        - containerPort: 18789
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
---
apiVersion: v1
kind: Service
metadata:
  name: openclaw-gateway
spec:
  selector:
    app: openclaw-gateway
  ports:
  - port: 18789
    targetPort: 18789
```

## Environment Configuration

### Required Variables

```bash
# .env.production

# Authentication
AUTH_USER=admin
AUTH_PASS=secure-password
API_KEY=your-api-key

# Database
DATABASE_PATH=.data/ai-startup.db

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# OpenClaw (if using)
OPENCLAW_GATEWAY_HOST=openclaw.yourdomain.com
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_GATEWAY_TOKEN=gateway-token
```

### Optional Variables

```bash
# AI Models
DEFAULT_MODEL=gpt-4-turbo
FALLBACK_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=sk-...

# Network
MC_ALLOWED_HOSTS=*.yourdomain.com
MC_ALLOW_ANY_HOST=false

# Data Retention
DATA_RETENTION_DAYS=90
```

### Secrets Management

For production, use secrets management:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name ai-startup/production \
  --secret-string '{"AUTH_PASS":"secret","API_KEY":"key"}'

# Kubernetes Secrets
kubectl create secret generic ai-startup-secrets \
  --from-literal=AUTH_PASS=secret \
  --from-literal=API_KEY=key
```

## Scaling

### Horizontal Scaling

```yaml
# kubernetes/deployment.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-startup-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-startup
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Performance Tuning

```typescript
// Cache configuration
export const CACHE_CONFIG = {
  maxSize: 10000,           // Max cached items
  defaultTTL: 300,          // 5 minutes
  cleanupInterval: 60,      // Cleanup every minute
  analyticsCache: 30,       // Analytics cache 30s
};

// Database optimization
export const DB_CONFIG = {
  wal_autocheckpoint: 1000,
  cache_size: -64000,       // 64MB cache
  mmap_size: 268435456,     // 256MB mmap
};
```

### Load Testing

```bash
# Run load tests
pnpm perf:load-test

# Or use k6
k6 run --vus 50 --duration 5m tests/load/api.js
```

## Security

### Production Checklist

- [ ] Use HTTPS/TLS everywhere
- [ ] Set strong AUTH_USER/AUTH_PASS
- [ ] Generate unique API_KEY
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use WSS for OpenClaw
- [ ] Rotate Ed25519 keys periodically
- [ ] Restrict network access
- [ ] Enable audit logging
- [ ] Set up intrusion detection

### Network Security

```yaml
# kubernetes/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-startup-policy
spec:
  podSelector:
    matchLabels:
      app: ai-startup
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress
    ports:
    - protocol: TCP
      port: 3000
```

### Rate Limiting

```typescript
// Configure in API routes
const RATE_LIMIT = {
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per minute
  skipSuccessfulRequests: false,
};
```

## Monitoring

### Health Check

```typescript
// GET /api/health
{
  "status": "healthy",
  "timestamp": "2026-03-11T12:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "openclaw": "connected",
  "agents": {
    "total": 112,
    "active": 15
  }
}
```

### Metrics Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/analytics/system` | System health metrics |
| `/api/analytics/agents` | Agent performance |
| `/api/analytics/tasks` | Task analytics |
| `/api/analytics/performance` | Performance metrics |

### Logging

```bash
# Production logging
LOG_LEVEL=info node server.js

# Structured JSON logs
pino-pretty < /var/log/ai-startup/app.log

# Log aggregation with Loki
promtail -config.file=/etc/promtail/config.yaml
```

### Alerting

Set up alerts for:
- High error rates (>1%)
- Response time (>2s p95)
- Memory usage (>80%)
- Database size growth
- OpenClaw disconnections
- Agent failures

## Troubleshooting Deployment

### Common Issues

**Build fails:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

**Database locked:**
```bash
# Enable WAL mode
sqlite3 .data/ai-startup.db "PRAGMA journal_mode=WAL;"
```

**Memory issues:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm start
```

**Port conflicts:**
```bash
# Check port usage
lsof -i :3000
kill -9 <PID>
```

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - System design
- [OpenClaw Integration](./OPENCLAW_INTEGRATION.md) - Gateway setup
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [API Reference](./API_REFERENCE.md) - API documentation
