# The Autonomous AI Startup Architecture

<div align="center">

🤖 **A Unified Multi-Agent Orchestration System**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Agents](https://img.shields.io/badge/Agents-112+-purple.svg)](#-agent-roster)
[![Phase](https://img.shields.io/badge/Phase-2%20Complete-success.svg)](docs/PHASE_ROADMAP.md)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Instead of 51 prompts → 1 AI company with 112+ specialized agents**

</div>

---

## 🎯 Overview

The Autonomous AI Startup Architecture is a production-ready, multi-agent orchestration platform that transforms specialized AI agents into a cohesive, autonomous startup operation. It combines the power of:

- **Mission Control** - Real-time agent management and task orchestration
- **Agency Agents** - 112+ specialized AI agent personalities across 14 divisions
- **OpenClaw** - Personal AI gateway for multi-channel connectivity

## ✨ Key Features

### Phase 2 Complete ✅

| Feature | Description |
|---------|-------------|
| **Task Planner Agent** | Central orchestrator with multi-agent collaboration support |
| **Dynamic Agent Hiring** | Automatically creates new agents when tasks require new capabilities |
| **Agent Import System** | Import specialized agents from agency-agents repository |
| **112+ AI Agents** | Spanning 14 divisions from Engineering to Game Development |
| **Multi-Agent Collaboration** | Tasks can involve multiple agents working together |
| **Task Dependencies** | Support for complex task workflows with dependencies |
| **Workload Balancing** | Intelligent distribution of work across agents |
| **Real-time Updates** | WebSocket-based live monitoring and events |
| **OpenClaw Integration** | Ed25519 device identity and gateway connectivity |

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

# Initialize database and import agents
pnpm run db:migrate
pnpm exec tsx scripts/seed-agents.ts
pnpm exec tsx scripts/import-specialized-agents.ts

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

## 📊 Agent Roster

**112+ agents** organized across **14 specialized divisions**:

| Division | Count | Examples |
|----------|-------|----------|
| 🎮 Game Development | 19 | Unity Architect, Unreal Engineer, Godot Developer |
| 💻 Engineering | 18 | AI Engineer, Backend Architect, DevOps, Security |
| 📣 Marketing | 18 | SEO Specialist, TikTok Strategist, Content Creator |
| 🧪 Testing | 8 | API Tester, Performance Benchmarker, QA |
| 🎨 Design | 8 | UX Architect, Brand Guardian, UI Designer |
| 💰 Paid Media | 7 | PPC Strategist, Programmatic Buyer, Auditor |
| ⚙️ Operations | 7 | Compliance Auditor, Finance Tracker |
| 📋 Project Management | 6 | Jira Steward, Studio Producer |
| 💬 Support | 6 | Support Responder, Infrastructure Maintainer |
| 🌐 Spatial Computing | 6 | visionOS Engineer, XR Developer |
| 📦 Product | 4 | Behavioral Nudge Engine, Sprint Prioritizer |
| ♟️ Strategy | 3 | NEXUS Framework |
| 👔 Executive | 1 | CEO |
| 💼 Sales | 1 | Chief Revenue Officer |

See [AGENTS.md](docs/AGENTS.md) for the complete agent directory.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, agent import, and task orchestration |
| [AGENTS.md](docs/AGENTS.md) | Complete agent directory organized by division |
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

## 🏗️ Project Structure

```
autonomous-ai-startup/
├── src/
│   ├── app/                    # Next.js app router
│   │   └── api/               # REST API routes
│   ├── components/             # React components
│   ├── lib/                    # Core libraries
│   │   ├── db.ts              # SQLite database
│   │   ├── task-planner.ts    # Enhanced task routing & collaboration
│   │   ├── agent-hiring.ts    # Dynamic agent creation
│   │   ├── agent-importer.ts  # Import agents from agency-agents
│   │   └── agent-sync.ts      # Workspace synchronization
│   ├── store/                  # Zustand state management
│   └── types/                  # TypeScript definitions
├── workspace/
│   └── agents/                 # 112+ agent soul.md files
├── scripts/
│   ├── seed-agents.ts          # Initial agent setup
│   ├── import-agents.ts        # Batch agent import
│   └── import-specialized-agents.ts
├── docs/                       # Documentation
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

# Import from agency-agents
POST /api/agents/import
{"division": "game-development"}
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

| Phase | Status | Features |
|-------|--------|----------|
| **Phase 1** | ✅ Complete | Core system, 6 essential agents, dashboard UI |
| **Phase 2** | ✅ Complete | 112+ agents, agent import system, multi-agent collaboration, task dependencies |
| **Phase 3** | 🔮 Planned | Multi-tenant workspaces, advanced analytics, enterprise integrations |

See [PHASE_ROADMAP.md](docs/PHASE_ROADMAP.md) for details.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ for the autonomous AI future</strong>
</div>
