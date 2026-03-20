# Setup Guide

Complete guide to installing, configuring, and deploying The Autonomous AI Startup Architecture with real OpenClaw connections.

## Prerequisites

### Required

- **Node.js 20+** - [Download](https://nodejs.org/)
- **pnpm** (recommended) - `npm install -g pnpm`

### Optional

- **OpenClaw** - For multi-channel messaging integration
- **Docker** - For containerized deployment

---

## Quick Start (Development)

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
cp .env.example .env
```

Edit `.env` with your settings (see [Environment Variables](#environment-variables) below).

### 4. Initialize Database

```bash
# Run migrations
pnpm run db:migrate

# Seed core agents (CEO, Developer, Marketing, Sales, Operations, Task Planner)
pnpm exec tsx scripts/seed-agents.ts
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` or `production` |
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `DATABASE_PATH` | `.data/startup.db` | SQLite database file path |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_USER` | `admin` | Dashboard admin username |
| `AUTH_PASS` | — | **Change this!** Dashboard admin password |
| `API_KEY` | — | **Change this!** API key for programmatic access |

### OpenClaw Gateway

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_GATEWAY_HOST` | — | Gateway hostname or IP address |
| `OPENCLAW_GATEWAY_PORT` | `18789` | Gateway port |
| `OPENCLAW_GATEWAY_TOKEN` | — | Gateway authentication token |
| `OPENCLAW_CONFIG_PATH` | — | Path to `openclaw.json` config file |
| `OPENCLAW_STATE_DIR` | — | Path to `.openclaw` state directory |
| `OPENCLAW_MEMORY_DIR` | — | Path to agent workspace directory |

### AI Models

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_MODEL` | `claude-3-opus` | Primary AI model |
| `FALLBACK_MODEL` | `claude-3-sonnet` | Fallback model |
| `OPENAI_API_KEY` | — | OpenAI API key (for embeddings) |

### Security (Production)

| Variable | Default | Description |
|----------|---------|-------------|
| `MC_ALLOWED_HOSTS` | — | Comma-separated allowed hostnames |
| `MC_ALLOW_ANY_HOST` | — | Set `true` to allow any host (not recommended) |

### Data Retention

| Variable | Default | Description |
|----------|---------|-------------|
| `MC_RETAIN_ACTIVITIES_DAYS` | `90` | Activity log retention (days) |
| `MC_RETAIN_AUDIT_DAYS` | `365` | Audit log retention (days) |
| `MC_RETAIN_TOKEN_USAGE_DAYS` | `90` | Token usage data retention (days) |

---

## OpenClaw Integration

### Installing OpenClaw

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

### Starting the Gateway

```bash
# Start the OpenClaw daemon
openclaw daemon start

# Verify it's running
openclaw status
```

### Connecting Mission Control to OpenClaw

#### Option A: Environment Variables (recommended)

```bash
# In .env
OPENCLAW_GATEWAY_HOST=127.0.0.1     # or your OpenClaw host IP
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_CONFIG_PATH=~/.openclaw/openclaw.json
OPENCLAW_STATE_DIR=~/.openclaw
```

Then restart Mission Control. The connection will be established automatically if `OPENCLAW_GATEWAY_HOST` is set.

#### Option B: Dashboard UI

1. Navigate to **Gateways** in the sidebar
2. Click **+ Add Gateway**
3. Enter your OpenClaw host and port (default: `18789`)
4. Click **Connect**

#### Option C: API

```bash
# Connect to OpenClaw gateway
curl -X POST http://localhost:3000/api/openclaw/connect \
  -H "Content-Type: application/json" \
  -d '{"host": "127.0.0.1", "port": 18789}'

# Check connection status
curl http://localhost:3000/api/openclaw/status

# Sync agents to OpenClaw
curl -X POST http://localhost:3000/api/openclaw/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "bidirectional"}'
```

### Channel Configuration

Once connected, configure messaging channels:

```bash
# Add a Slack channel
curl -X POST http://localhost:3000/api/openclaw/channels \
  -H "Content-Type: application/json" \
  -d '{
    "channel": {
      "id": "slack-general",
      "name": "General",
      "platform": "slack",
      "enabled": true,
      "config": { "slackChannel": "#general" },
      "agentMappings": [
        { "agentSlug": "ceo", "role": "responder" },
        { "agentSlug": "task-planner", "role": "listener" }
      ]
    }
  }'
```

Supported platforms: `slack`, `discord`, `telegram`, `whatsapp`, `teams`, `email`, `webchat`, `api`, `matrix`, `irc`

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set strong `AUTH_PASS` (not the default!)
- [ ] Generate random `API_KEY`
- [ ] Configure `MC_ALLOWED_HOSTS` with your domain
- [ ] Configure `OPENCLAW_GATEWAY_HOST` if using OpenClaw
- [ ] Ensure database volume is persistent
- [ ] Verify health endpoint: `GET /api/system/health`

### Docker Deployment (Recommended)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with production values

# 2. Build and start
docker compose up -d --build

# 3. Verify health
curl http://localhost:3000/api/system/health

# 4. Seed initial agents (first time only)
docker exec mission-control node -e "
  require('./scripts/seed-agents.ts')
" 2>/dev/null || echo "Agents may need manual seeding"

# 5. View logs
docker compose logs -f
```

#### Docker with OpenClaw on Same Host

If OpenClaw runs on the same host as Docker:

```bash
# In .env - use host.docker.internal to reach host network
OPENCLAW_GATEWAY_HOST=host.docker.internal
OPENCLAW_GATEWAY_PORT=18789
```

Or use `network_mode: host` in docker-compose.yml.

#### Docker with Remote OpenClaw

```bash
# In .env
OPENCLAW_GATEWAY_HOST=openclaw.your-server.com
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_GATEWAY_TOKEN=your-auth-token
```

### Manual Deployment

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Build
NODE_ENV=production pnpm build

# 3. Start
NODE_ENV=production node .next/standalone/server.js
```

### Health Check Endpoints

| Endpoint | Purpose | Use For |
|----------|---------|---------|
| `GET /api/system/health` | Full health status with DB, memory, OpenClaw checks | Monitoring dashboards |
| `GET /api/system/ready` | Lightweight readiness probe (200/503) | Container orchestration (K8s) |
| `GET /api/system/env` | Environment configuration status (no secrets) | Debugging deployment issues |

### Database Persistence

The SQLite database at `.data/startup.db` must persist across restarts:

- **Docker**: Use named volume (configured in `docker-compose.yml`)
- **Bare metal**: Ensure `.data/` directory has write permissions
- **Kubernetes**: Use a PersistentVolumeClaim

### Vercel Deployment

```bash
pnpm i -g vercel
vercel
```

> **Note:** Vercel's serverless functions don't support persistent SQLite. For production Vercel deployments, consider migrating to an external database (e.g., Turso, PlanetScale).

---

## API Reference

### System Endpoints

```
GET  /api/system/health     # Health check (full)
GET  /api/system/ready       # Readiness probe
GET  /api/system/env         # Environment status
```

### Agent Endpoints

```
GET  /api/agents             # List all agents
POST /api/agents             # Create new agent
POST /api/agents/sync        # Sync agents from workspace/OpenClaw config
POST /api/agents/import      # Import agents from external sources
```

### Task Endpoints

```
GET  /api/tasks              # List tasks (optional: ?status=...&assigned_to=...)
POST /api/tasks              # Create new task
GET  /api/tasks/queue?agent= # Poll next task for an agent
```

### OpenClaw Endpoints

```
POST   /api/openclaw/connect    # Connect to OpenClaw gateway
DELETE /api/openclaw/connect    # Disconnect from gateway
GET    /api/openclaw/status     # Connection status + stats
POST   /api/openclaw/sync       # Sync agents (push/pull/bidirectional)
GET    /api/openclaw/channels   # List channels
POST   /api/openclaw/channels   # Create/update channel
DELETE /api/openclaw/channels   # Remove channel
PATCH  /api/openclaw/channels   # Map/unmap agents to channels
POST   /api/openclaw/send       # Send message via channel
```

### Gateway Endpoints

```
GET  /api/gateways           # List gateway connections
POST /api/gateways           # Add gateway connection
```

### Analytics Endpoints

```
GET /api/analytics/agents            # Agent analytics
GET /api/analytics/tasks             # Task analytics
GET /api/analytics/performance       # Performance metrics
GET /api/analytics/system            # System analytics
GET /api/analytics/agent-performance # Per-agent performance
```

---

## Troubleshooting

### Common Issues

#### "Database is locked"

```bash
rm .data/*.db-journal .data/*.db-wal .data/*.db-shm 2>/dev/null
```

#### "Module not found: better-sqlite3"

```bash
pnpm rebuild better-sqlite3
```

#### "OpenClaw connection failed"

1. Check if OpenClaw is running: `openclaw status`
2. Start the daemon: `openclaw daemon start`
3. Verify host/port: `curl http://OPENCLAW_HOST:18789/health`
4. Check logs: `LOG_LEVEL=debug pnpm dev`

#### "OpenClaw connection timeout"

- Verify `OPENCLAW_GATEWAY_HOST` is reachable from the Mission Control server
- Check firewall rules allow port `18789`
- If using Docker, ensure the container can reach the OpenClaw host (see Docker deployment section)

#### Dashboard shows no agents

```bash
# Re-seed core agents
pnpm exec tsx scripts/seed-agents.ts

# Or sync from workspace
curl -X POST http://localhost:3000/api/agents/sync
```

#### Health check returns "degraded"

Check `GET /api/system/health` for details:
- High memory usage → Restart the application or increase memory
- Database errors → Check `.data/` directory permissions

### Logs

```bash
# Verbose logging
LOG_LEVEL=debug pnpm dev

# Production logs (Docker)
docker compose logs -f app
```

### Reset Everything

```bash
rm -rf .data/
pnpm run db:migrate
pnpm exec tsx scripts/seed-agents.ts
```

---

## Verification Checklist

After setup, verify the system:

1. ✅ **Dashboard loads** — Visit http://localhost:3000
2. ✅ **Agents visible** — Should see 6+ core agents
3. ✅ **API responds** — `curl http://localhost:3000/api/agents`
4. ✅ **Health check passes** — `curl http://localhost:3000/api/system/health`
5. ✅ **Tasks work** — Create a test task from the dashboard
6. ✅ **OpenClaw connects** (if configured) — `curl http://localhost:3000/api/openclaw/status`

---

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system
- Read [AGENTS.md](AGENTS.md) to learn about each agent
- Read [OPENCLAW_INTEGRATION.md](OPENCLAW_INTEGRATION.md) for detailed OpenClaw docs
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) to extend the system
