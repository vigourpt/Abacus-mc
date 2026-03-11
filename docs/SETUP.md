# Setup Guide

Complete guide to installing and configuring The Autonomous AI Startup Architecture.

## Prerequisites

### Required

- **Node.js 20+** - [Download](https://nodejs.org/)
- **pnpm** (recommended) - `npm install -g pnpm`

### Optional

- **OpenClaw** - For multi-channel messaging integration
- **Docker** - For containerized deployment

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/vigourpt/The-Autonomous-AI-Startup-Architecture.git
cd The-Autonomous-AI-Startup-Architecture
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
# Copy example configuration
cp .env.example .env

# Edit with your settings
nano .env
```

**Key Configuration Options:**

```bash
# Authentication
AUTH_USER=admin
AUTH_PASS=your-secure-password
API_KEY=your-api-key

# Database
DATABASE_PATH=.data/startup.db

# OpenClaw (optional)
OPENCLAW_GATEWAY_HOST=127.0.0.1
OPENCLAW_GATEWAY_PORT=18789
```

### 4. Initialize Database

```bash
# Run migrations
pnpm run db:migrate

# Seed core agents
pnpm exec tsx scripts/seed-agents.ts
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## OpenClaw Integration

### Installing OpenClaw

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

### Configure Connection

```bash
# In .env
OPENCLAW_CONFIG_PATH=/path/to/.openclaw/openclaw.json
OPENCLAW_STATE_DIR=/path/to/.openclaw
OPENCLAW_GATEWAY_HOST=127.0.0.1
OPENCLAW_GATEWAY_PORT=18789
```

### Sync Agents

```bash
curl -X POST http://localhost:3000/api/agents/sync
```

## Production Deployment

### Docker Deployment

```bash
# Build image
docker build -t autonomous-ai-startup .

# Run container
docker run -p 3000:3000 -v $(pwd)/.data:/app/.data autonomous-ai-startup
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3000
AUTH_USER=admin
AUTH_PASS=strong-password-here
API_KEY=random-api-key
MC_ALLOWED_HOSTS=your-domain.com
```

### Vercel Deployment

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel
```

**Note:** SQLite requires a persistent filesystem. Use Vercel's serverless functions with an external database for production.

## Troubleshooting

### Common Issues

#### "Database is locked"

```bash
# Remove stale locks
rm .data/*.db-journal
rm .data/*.db-wal
rm .data/*.db-shm
```

#### "Module not found: better-sqlite3"

```bash
# Rebuild native modules
pnpm rebuild better-sqlite3
```

#### "OpenClaw connection failed"

```bash
# Check if OpenClaw is running
openclaw status

# Start the daemon
openclaw daemon start
```

### Logs

```bash
# Set log level
LOG_LEVEL=debug pnpm dev
```

### Reset Database

```bash
# Delete database
rm -rf .data/

# Reinitialize
pnpm run db:migrate
pnpm exec tsx scripts/seed-agents.ts
```

## Verification

After setup, verify the system:

1. **Dashboard loads** - Visit http://localhost:3000
2. **Agents visible** - Should see 6 core agents
3. **API responds** - `curl http://localhost:3000/api/agents`
4. **Tasks work** - Create a test task from dashboard

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system
- Read [AGENTS.md](AGENTS.md) to learn about each agent
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) to extend the system
