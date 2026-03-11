# Architecture Documentation

This document describes the system architecture of The Autonomous AI Startup, including component interactions, data flow, and design decisions.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AUTONOMOUS AI STARTUP                              │
│                     Phase 2 Complete - 112+ Agents                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐       │
│  │  Next.js 16     │   │   SQLite DB     │   │  Agency-Agents  │       │
│  │  App Router     │───│  (WAL mode)     │───│  Repository     │       │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘       │
│         │                    │                        │                 │
│         │                    │                        │                 │
│  ┌──────┴────────────────────┴────────────────────────┴─────────┐     │
│  │                    CORE LIBRARIES                              │     │
│  ├────────────────────────────────────────────────────────────────┤     │
│  │ ├── task-planner.ts     (Enhanced task routing & collab)     │     │
│  │ ├── agent-hiring.ts     (Dynamic agent creation)             │     │
│  │ ├── agent-importer.ts   (Import from agency-agents)          │     │
│  │ ├── agent-sync.ts       (Workspace synchronization)          │     │
│  │ ├── websocket.ts        (Gateway connection)                 │     │
│  │ └── device-identity.ts  (Ed25519 identity)                   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    AGENT LAYER (112+ Agents)                    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  🎮 Game Dev (19) │ 💻 Engineering (18) │ 📣 Marketing (18)    │   │
│  │  🧪 Testing (8)   │ 🎨 Design (8)       │ 💰 Paid Media (7)    │   │
│  │  ⚙️ Operations (7)│ 📋 Project Mgmt (6) │ 💬 Support (6)       │   │
│  │  🌐 Spatial (6)   │ 📦 Product (4)      │ ♟️ Strategy (3)      │   │
│  │  👔 Executive (1) │ 💼 Sales (1)        │                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    OpenClaw Gateway                              │   │
│  │                ws://127.0.0.1:18789 (v3)                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Task Planner (Enhanced Orchestrator)

**Location:** `src/lib/task-planner.ts`

The Task Planner is the brain of the system, now enhanced with Phase 2 features:

#### Core Responsibilities
- **Task Classification:** Analyzes tasks to determine type and complexity
- **Agent Matching:** Scores agents based on division, specialization, and workload
- **Multi-Agent Collaboration:** Coordinates tasks that require multiple agents
- **Task Dependencies:** Manages complex workflows with task dependencies
- **Workload Balancing:** Redistributes tasks to prevent agent overload

#### Task Routing Flow
```
User Request 
    │
    ▼
Task Planner
    │
    ├── Classify Task (type, complexity)
    │
    ├── Check Collaboration Need
    │       │
    │       └── If multi-agent → Create Collaboration
    │
    ├── Score Available Agents
    │       │
    │       ├── Division match
    │       ├── Specialization bonus
    │       ├── Workload factor
    │       └── Complexity assessment
    │
    ├── Best match found? 
    │       │
    │       ├── Yes → Assign to Agent
    │       └── No → Trigger Autonomous Hiring
    │
    └── Create Task Dependencies (if complex)
```

#### Complexity Assessment
```typescript
// Complexity factors
- Multi-step keywords: 'comprehensive', 'full-stack', 'end-to-end'
- Integration keywords: 'integrate', 'connect', 'sync'
- Advanced keywords: 'optimize', 'architect', 'design system'
- Scale keywords: 'enterprise', 'production', 'at scale'
```

### 2. Agent Import System (Phase 2)

**Location:** `src/lib/agent-importer.ts`

Imports specialized agents from the agency-agents repository:

#### Import Flow
```
agency-agents Repository
         │
         ▼
    AgentImporter
         │
    ├── fetchDivisionAgents() → List available .md files
    ├── fetchAgentMarkdown()  → Download agent content
    ├── parseAgentMarkdown()  → Extract metadata & capabilities
    ├── saveAgentToWorkspace() → Create soul.md file
    └── importAgentToDb()     → Insert/update database record
```

#### Division Mapping
| Source Folder | System Division |
|---------------|-----------------|
| engineering | engineering |
| design | design |
| marketing | marketing |
| paid-media | paid-media |
| product | product |
| project-management | project-management |
| testing | testing |
| support | support |
| spatial-computing | spatial-computing |
| game-development | game-development |
| strategy | strategy |

### 3. Agent Hiring Framework (Enhanced)

**Location:** `src/lib/agent-hiring.ts`

Dynamic agent creation with Phase 2 enhancements:

#### Features
- **Capability Detection:** Enhanced scoring for task requirements
- **Division Detection:** Automatically determines best division
- **Template Matching:** Uses expanded AGENT_TEMPLATES
- **Autonomous Hiring:** Can auto-create high-priority agents
- **Integration:** Works with AgentImporter for workspace setup

#### Hiring Flow
```
Task Analysis
     │
     ├── detectCapabilities() → Required skills
     ├── detectDivision()     → Best-fit division
     ├── findMatchingAgents() → Existing matches
     │
     └── evaluateHiringNeed()
              │
              ├── High confidence → Auto-create agent
              ├── Medium → Create hiring request
              └── Low → Manual review required
```

### 4. Agent SOUL System

**Location:** `workspace/agents/*/soul.md`

Each agent has a SOUL (System Of Unique Learning) file:

```yaml
---
name: "Agent Name"
description: "Agent description"
emoji: "🤖"
color: "#3b82f6"
division: "engineering"
specialization: "Backend Architecture"
source: "agency-agents"
source_url: "https://..."
vibe: "professional, skilled, collaborative"
---

# Agent Name

## Your Identity
...

## Core Capabilities
...

## Critical Rules
...
```

### 5. Database Layer (Extended Schema)

**Location:** `src/lib/db.ts`

SQLite database with Phase 2 schema extensions:

| Table | Purpose | Phase 2 Additions |
|-------|---------|-------------------|
| `agents` | Agent profiles | `specialization`, `source`, `technical_skills`, `personality_traits` |
| `tasks` | Task queue | `dependencies`, `estimated_hours`, `tags` |
| `task_dependencies` | Task workflow | **New table** |
| `agent_collaborations` | Multi-agent work | **New table** |
| `import_history` | Import tracking | **New table** |
| `hiring_requests` | Creation requests | `suggested_division`, `priority`, `justification` |

### 6. State Management

**Location:** `src/store/index.ts`

Zustand store with expanded state:

```typescript
interface AppState {
  agents: Agent[];           // 112+ agents
  tasks: Task[];
  events: AppEvent[];
  gatewayConnection: GatewayConnection | null;
  
  // UI state
  activePanel: string;
  sidebarOpen: boolean;
  isLoading: boolean;
  
  // Selectors
  selectAgentById: (id: string) => Agent | undefined;
  selectAgentsByDivision: (division: AgentDivision) => Agent[];
  // ...
}
```

### 7. OpenClaw Integration

**Location:** `src/lib/websocket.ts`, `src/lib/device-identity.ts`

- **WebSocket Client:** Protocol v3 connection to OpenClaw Gateway
- **Device Identity:** Ed25519 key pair for secure authentication
- **Agent Sync:** Bidirectional sync with OpenClaw configuration

## Data Flow

### Multi-Agent Collaboration Flow

```
Complex Task Created
        │
        ▼
Task Planner Analyzes
        │
        ├── Requires multiple agents? 
        │         │
        │         └── Yes → createCollaboration()
        │                       │
        │                       ├── Identify required divisions
        │                       ├── Select lead agent
        │                       ├── Select supporting agents
        │                       └── Create collaboration record
        │
        └── Decompose into subtasks
                    │
                    ├── Create task dependencies
                    ├── Assign subtasks to agents
                    └── Set up dependency tracking
```

### Task Dependency Management

```
┌─────────────────────────────────────────────────────────┐
│                   Task Dependency Flow                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Task A (Research) ──finish_to_start──→ Task B (Design)│
│                                              │          │
│                                      finish_to_start    │
│                                              │          │
│                                              ▼          │
│                                     Task C (Implement) │
│                                              │          │
│                                      finish_to_start    │
│                                              │          │
│                                              ▼          │
│                                      Task D (Test)     │
│                                                         │
└─────────────────────────────────────────────────────────┘

Dependency Types:
- finish_to_start: B starts after A finishes (most common)
- start_to_start: B starts when A starts
- finish_to_finish: B finishes when A finishes
- start_to_finish: B finishes when A starts
```

### Agent Import Flow

```
Import Trigger (script or API)
        │
        ▼
AgentImporter.importDivision()
        │
        ├── Fetch agent list from GitHub
        │
        ├── For each agent .md file:
        │       │
        │       ├── Download content
        │       ├── Parse markdown to ParsedAgent
        │       │       ├── Extract name, description
        │       │       ├── Detect emoji, color
        │       │       ├── Extract capabilities
        │       │       ├── Extract technical skills
        │       │       └── Extract personality traits
        │       │
        │       ├── Create workspace directory
        │       ├── Generate soul.md file
        │       └── Insert/update database
        │
        └── Record import history
```

## Design Decisions

### Why SQLite?

1. **Zero external dependencies** - No database server to manage
2. **WAL mode** - High concurrency support
3. **Portability** - Single file, easy backup
4. **Performance** - Excellent for read-heavy workloads

### Why 14 Divisions?

Divisions align with agency-agents repository structure and common organizational needs:
- Engineering, Design, Marketing (core functions)
- Game Development, Spatial Computing (specialized tech)
- Testing, Support, Operations (quality & support)
- Strategy, Executive, Sales (leadership & revenue)

### Why Multi-Agent Collaboration?

Complex tasks often require diverse expertise:
- A marketing campaign needs content, design, and paid media
- A product launch needs engineering, QA, and marketing
- System design needs architecture, security, and DevOps

### Why Task Dependencies?

Real workflows have ordering requirements:
- Can't test before implementing
- Can't implement before designing
- Can't deploy before testing

## Security Considerations

- Device identity keys stored locally (not in git)
- API key authentication for headless access
- Session-based auth with scrypt hashing
- CSRF protection enabled
- Input validation with Zod
- Agent source URL tracking for audit

## Performance Considerations

- SQLite WAL mode for concurrent reads
- Workload balancing prevents agent overload
- Lazy loading of agent data
- Efficient task priority queue
- Import rate limiting for GitHub API
