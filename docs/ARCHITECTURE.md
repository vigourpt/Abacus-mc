# Architecture Documentation

This document describes the system architecture of The Autonomous AI Startup, including component interactions, data flow, and design decisions.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                 AUTONOMOUS AI STARTUP                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐   ┌─────────────────┐               │
│  │  Next.js 16    │   │   SQLite DB    │               │
│  │  App Router    │───│  (WAL mode)    │               │
│  └─────────────────┘   └─────────────────┘               │
│         │                    │                          │
│         │                    │                          │
│  ┌──────┴────────────────┴──────────────────┐         │
│  │          CORE LIBRARIES             │         │
│  ├───────────────────────────────────────┘         │
│  │                                               │
│  ├── task-planner.ts    (Task routing)          │
│  ├── agent-hiring.ts    (Dynamic agents)        │
│  ├── agent-sync.ts      (OpenClaw sync)         │
│  ├── websocket.ts       (Gateway connection)    │
│  └── device-identity.ts (Ed25519 identity)      │
│                                                         │
│  ┌─────────────────────────────────────────────┐     │
│  │              AGENT LAYER                   │     │
│  ├─────────────────────────────────────────────┤     │
│  │ 👑 CEO    👨‍💻 Dev   📣 Mkt   💰 Sales  ⚙️ Ops │     │
│  └─────────────────────────────────────────────┘     │
│                         │                              │
│                         ▼                              │
│  ┌─────────────────────────────────────────────┐     │
│  │         OpenClaw Gateway                   │     │
│  │     ws://127.0.0.1:18789 (v3)              │     │
│  └─────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Task Planner (Central Orchestrator)

**Location:** `src/lib/task-planner.ts`

The Task Planner is the brain of the system, responsible for:

- **Task Classification:** Analyzes incoming tasks to determine type (strategic, development, marketing, sales, operations)
- **Agent Matching:** Scores all available agents based on capabilities and availability
- **Task Assignment:** Routes tasks to the best-matched agent
- **Task Decomposition:** Breaks complex tasks into manageable subtasks

```typescript
// Task routing flow
User Request → Task Planner → Classify Task → Score Agents → Assign to Best Match
```

### 2. Agent Hiring Framework

**Location:** `src/lib/agent-hiring.ts`

Handles dynamic agent creation:

- **Capability Detection:** Analyzes tasks to identify required capabilities
- **Gap Analysis:** Compares requirements against existing agents
- **Role Suggestion:** Recommends new agent roles from templates
- **Agent Instantiation:** Creates new agents when approved

### 3. Agent SOUL System

**Location:** `workspace/agents/*/soul.md`

Each agent has a SOUL (System Of Unique Learning) file that defines:

- Identity and personality
- Core mission and objectives
- Critical rules and boundaries
- Templates and deliverables
- Success metrics

### 4. Database Layer

**Location:** `src/lib/db.ts`

SQLite database with WAL mode for concurrent access:

| Table | Purpose |
|-------|----------|
| `agents` | Agent profiles and configuration |
| `tasks` | Task queue and history |
| `agent_messages` | Inter-agent communication |
| `hiring_requests` | Dynamic agent creation requests |
| `gateway_connections` | OpenClaw gateway configs |
| `activity_log` | System activity tracking |
| `token_usage` | AI model token consumption |

### 5. State Management

**Location:** `src/store/index.ts`

Zustand store for client-side state:

- Agents and tasks cache
- UI state (panels, selections)
- Real-time events queue
- Gateway connection status

### 6. OpenClaw Integration

**Location:** `src/lib/websocket.ts`, `src/lib/device-identity.ts`

- **WebSocket Client:** Protocol v3 connection to OpenClaw Gateway
- **Device Identity:** Ed25519 key pair for secure authentication
- **Agent Sync:** Bidirectional sync with OpenClaw configuration

## Data Flow

### Task Lifecycle

```
1. Task Created
   │
   ▼
2. Task Planner Analyzes
   │
   ├── Can existing agent handle? → Yes → Assign to Agent
   │                               │
   └── No → Create Hiring Request   │
                                    │
   ┌───────────────────────────────┘
   │
3. Agent Receives Task (via /api/tasks/queue)
   │
   ▼
4. Agent Executes Task
   │
   ▼
5. Task Moves to Review
   │
   ▼
6. Quality Gate Check
   │
   ├── Pass → Complete
   └── Fail → Back to Agent
```

### Agent Communication

```
Agent A                    API                    Agent B
   │                        │                        │
   ├── POST /api/agents/comms ────────────────────→│
   │    (delegation request)  │                        │
   │                        │── Store message ────────→│
   │                        │                        │
   │                        │── GET /api/agents/comms ─┤
   │                        │                        │
   │─────────────────────────── Response ──────────────┤
```

## Design Decisions

### Why SQLite?

1. **Zero external dependencies** - No database server to manage
2. **WAL mode** - High concurrency support
3. **Portability** - Single file, easy backup
4. **Performance** - Excellent for read-heavy workloads

### Why Zustand?

1. **Minimal boilerplate** - Simple API
2. **TypeScript first** - Full type inference
3. **Middleware support** - Subscriptions, persistence
4. **React 19 compatible** - Works with concurrent features

### Why Ed25519?

1. **Industry standard** - Used by SSH, TLS, etc.
2. **Fast** - Excellent performance
3. **Secure** - 128-bit security level
4. **Small keys** - 32-byte public key

## Security Considerations

- Device identity keys stored locally (not in git)
- API key authentication for headless access
- Session-based auth with scrypt hashing
- CSRF protection enabled
- Input validation with Zod
