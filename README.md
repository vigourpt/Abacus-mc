# The Autonomous AI Startup Architecture

<div align="center">

🤖 **A Unified Multi-Agent Orchestration System**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Instead of 51 prompts → 1 AI company**

</div>

---

## 🎯 Overview

The Autonomous AI Startup Architecture is a production-ready, multi-agent orchestration platform that transforms specialized AI agents into a cohesive, autonomous startup operation. It combines the power of:

- **Mission Control** - Real-time agent management and task orchestration
- **Agency Agents** - 113+ specialized AI agent personalities
- **OpenClaw** - Personal AI gateway for multi-channel connectivity

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Task Planner Agent** | Central orchestrator that routes tasks to specialized agents |
| **Dynamic Agent Hiring** | Automatically creates new agents when tasks require new capabilities |
| **Five Core Agents** | CEO, Developer, Marketing, Sales, Operations |
| **Real-time Updates** | WebSocket-based live monitoring and events |
| **OpenClaw Integration** | Ed25519 device identity and gateway connectivity |
| **Quality Gates** | Built-in review system for task completion |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/vigourpt/The-Autonomous-AI-Startup-Architecture.git
cd The-Autonomous-AI-Startup-Architecture

# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env

# Seed the database with core agents
pnpm run db:migrate
pnpm exec tsx scripts/seed-agents.ts

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and component interactions |
| [AGENTS.md](docs/AGENTS.md) | Agent descriptions and capabilities |
| [SETUP.md](docs/SETUP.md) | Installation and configuration guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guidelines for extending the system |
| [PHASE_ROADMAP.md](docs/PHASE_ROADMAP.md) | Feature roadmap for all phases |

## 🧱 Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 3.4 |
| Language | TypeScript 5.7 |
| Database | SQLite (better-sqlite3, WAL mode) |
| State | Zustand 5 |
| Real-time | WebSocket + SSE |
| Validation | Zod 4 |

## 🤖 Core Agents

| Agent | Role | Division |
|-------|------|----------|
| 👑 CEO Agent | Strategic decision-making | Executive |
| 👨‍💻 Developer Agent | Software development | Engineering |
| 📣 Marketing Agent | Marketing and growth | Marketing |
| 💰 Sales Agent | Customer acquisition | Sales |
| ⚙️ Operations Agent | Process management | Operations |
| 🎯 Task Planner | Task routing and orchestration | System |

## 🏗️ Project Structure

```
autonomous-ai-startup/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # REST API routes
│   │   │   ├── agents/        # Agent CRUD
│   │   │   ├── tasks/         # Task management
│   │   │   └── gateways/      # Gateway connections
│   │   ├── page.tsx           # Main dashboard
│   │   └── layout.tsx         # Root layout
│   ├── components/             # React components
│   │   ├── layout/            # Navigation, header
│   │   └── dashboard/         # Dashboard panels
│   ├── lib/                    # Core libraries
│   │   ├── db.ts              # SQLite database
│   │   ├── task-planner.ts    # Task routing logic
│   │   ├── agent-hiring.ts    # Dynamic agent creation
│   │   ├── agent-sync.ts      # OpenClaw sync
│   │   └── websocket.ts       # Gateway connection
│   ├── store/                  # Zustand state management
│   └── types/                  # TypeScript definitions
├── workspace/
│   └── agents/                 # Agent soul.md files
│       ├── ceo/
│       ├── developer/
│       ├── marketing/
│       ├── sales/
│       ├── operations/
│       └── task-planner/
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
└── .data/                      # Runtime data (SQLite)
```

## 🔌 API Reference

### Agents

```bash
# List all agents
GET /api/agents

# Create agent
POST /api/agents
{"name": "New Agent", "division": "engineering"}

# Sync from workspace
POST /api/agents/sync
```

### Tasks

```bash
# List tasks
GET /api/tasks?status=in_progress

# Create task (auto-assign)
POST /api/tasks
{"title": "Build feature", "autoAssign": true}

# Get next task for agent
GET /api/tasks/queue?agent=<agent_id>
```

## 📈 Roadmap

- **Phase 1** (Current): Core system with 5 essential agents
- **Phase 2**: Full agent hiring automation, inter-agent messaging
- **Phase 3**: Multi-tenant workspaces, advanced analytics

See [PHASE_ROADMAP.md](docs/PHASE_ROADMAP.md) for details.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ for the autonomous AI future</strong>
</div>
