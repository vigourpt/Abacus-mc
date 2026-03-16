# Mission Control Runtime Guide

This document explains how to run the orchestration layer that connects The Autonomous AI Startup architecture to OpenClaw for agent execution.

## Overview

Mission Control serves as the orchestration layer between your 112+ agent architecture and OpenClaw runtime. It:

- Manages task queues (backlog → running → completed)
- Routes tasks to appropriate agents via OpenClaw
- Supports **task dependencies** for complex workflows
- Provides **capability-based agent matching**
- Includes **execution run sessions** for tracking
- Offers **metrics and observability APIs**
- Stores results in project memory

```
┌─────────────────────────────────────────────────────────────┐
│                     Mission Control v2                       │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐   ┌────────────┐   ┌────────────────────┐  │
│  │  Backlog   │──>│  Scheduler │──>│    Task Runner     │  │
│  │   Tasks    │   │ (Dep-Aware)│   │   (Concurrent)     │  │
│  └────────────┘   └────────────┘   └────────────────────┘  │
│        │                │                    │              │
│        v                v                    v              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Capability Index + Metrics               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                OpenClaw Connector                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Run Session (logs, outputs, metrics)           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────│──────────────────────────────────┘
                           v
                 ┌──────────────────┐
                 │  OpenClaw Runtime │
                 │     (Agents)      │
                 └──────────────────┘
```

## Quick Start

### 1. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your OpenClaw settings
export OPENCLAW_GATEWAY_HOST="http://localhost:8080"
export OPENCLAW_GATEWAY_TOKEN="your-token-here"
```

### 2. Install Dependencies

```bash
# Python dependencies for orchestration
pip install pyyaml requests
```

### 3. Start Mission Control

```bash
# Basic run (original task runner)
python run_mission_control.py

# With scheduler (dependency-aware execution) ✨ NEW
python run_mission_control.py --use-scheduler

# With metrics API enabled ✨ NEW
python run_mission_control.py --metrics-port 9090

# List indexed agents ✨ NEW
python run_mission_control.py --list-agents

# Dry run (check status without starting)
python run_mission_control.py --dry-run
```

---

## New Features (v2)

### 1. Task Dependencies

Tasks can now specify dependencies on other tasks:

```json
{
  "task_id": "task_frontend",
  "depends_on": ["task_design", "task_api"],
  "description": "Build frontend using design system and API"
}
```

The scheduler will:
- Keep tasks in backlog until dependencies complete
- Block tasks if dependencies fail
- Execute in topological order

```python
from orchestration.task_dependencies import can_execute_task, get_ready_tasks

# Check if task can run
if can_execute_task("task_frontend"):
    print("All dependencies satisfied!")

# Get all ready tasks
ready = get_ready_tasks()
```

### 2. Run Sessions

Each Mission Control execution creates an isolated run session:

```
runs/
└── run_20260311_143052_a1b2c3d4/
    ├── metadata.json    # Run status and config
    ├── tasks.json       # Tasks in this run
    ├── logs.json        # Structured logs
    ├── metrics.json     # Performance metrics
    └── outputs/
        └── task_001/
            └── result.json
```

```python
from orchestration.run_sessions import create_run, get_current_run

# Create a new run
run = create_run(config={"project": "my-project"})
print(f"Run ID: {run.run_id}")

# Log events
run.log_event('custom_event', {'data': 'value'})

# Save outputs
run.save_output('task_001', {'result': 'success'})
```

### 3. Agent Capability Index

Match tasks to agents based on their capabilities:

```python
from orchestration.capability_index import match_task_to_agents

task = {
    "description": "Build machine learning model with PyTorch",
    "tags": ["ml", "pytorch", "nlp"]
}

matches = match_task_to_agents(task, limit=5)
for match in matches:
    print(f"{match.agent_name}: {match.score:.2f} - {match.reason}")
```

### 4. Scheduler Layer

Dependency-aware scheduling with concurrency control:

```python
from orchestration.scheduler import get_scheduler

scheduler = get_scheduler()
scheduler.poll_interval = 2.0
scheduler.max_concurrent = 5
scheduler.rate_limit = 10  # tasks per second

# Start scheduling
scheduler.start()
```

### 5. Metrics & Observability

Track execution metrics:

```python
from orchestration.metrics import get_metrics_collector

metrics = get_metrics_collector()

# Increment counters
metrics.increment('tasks_completed')

# Record timers
with metrics.time('agent_execution_time'):
    # do work
    pass

# Get all metrics
data = metrics.get_all_metrics()
```

**Metrics API** (when enabled with `--metrics-port`):

```bash
# Get all metrics
curl http://localhost:9090/metrics

# Get summaries
curl http://localhost:9090/metrics/summary

# Get recent history
curl http://localhost:9090/metrics/history?limit=50

# Health check
curl http://localhost:9090/health

# System status
curl http://localhost:9090/status

# List runs
curl http://localhost:9090/runs
```

---

## Creating Tasks

### Via Python

```python
from orchestration.task_runner import TaskRunner

runner = TaskRunner()

# Submit a task with dependencies
task = runner.submit_task(
    project="website-redesign",
    agent="developer",
    description="Create a responsive navigation component",
    context={
        "framework": "React",
        "requirements": ["mobile-first", "accessible"],
        "depends_on": ["task_design_system"]  # Dependency in context
    }
)

print(f"Task created: {task.task_id}")
```

### Via JSON Files

Create a JSON file in `tasks/backlog/`:

```json
{
  "task_id": "task_001",
  "project": "marketing-campaign",
  "agent": "marketing",
  "description": "Create social media content calendar for Q2",
  "status": "backlog",
  "priority": "high",
  "depends_on": [],
  "context": {
    "platforms": ["twitter", "linkedin"],
    "themes": ["AI", "productivity"]
  },
  "tags": ["marketing", "social-media", "content"],
  "created_at": "2026-03-11T10:00:00Z",
  "updated_at": "2026-03-11T10:00:00Z"
}
```

### Example: Task with Dependencies

See `tasks/examples/` for a complete workflow:

```
task_design_001 (Design System)
        |
        v
task_dev_002 (Frontend) --+
                          |
                          +--> task_dev_004 (Integration)
task_dev_003 (Backend) ---+          |
                                     v
                          task_qa_005 (Testing)
```

---

## Task Lifecycle

1. **Backlog** (`tasks/backlog/`) - Tasks waiting to be processed
2. **Running** (`tasks/running/`) - Currently executing via OpenClaw
3. **Completed** (`tasks/completed/`) - Finished tasks with results

Each task moves through these folders automatically.

---

## Project Memory

Results are stored in project directories:

```
projects/
└── website-redesign/
    ├── brief.md      # Project description
    ├── outputs.md    # Agent results (auto-appended)
    ├── logs.md       # Execution logs
    └── meta.json     # Timestamps
```

### Using Project Memory

```python
from orchestration.project_memory import ProjectMemory, read_project

# Create a project
memory = ProjectMemory()
memory.create_project("new-feature", "Build user authentication system")

# Read project data
project = read_project("new-feature")
print(project.brief)
```

---

## OpenClaw Integration

The OpenClaw connector sends tasks to your configured OpenClaw gateway.

### Direct Agent Execution

```python
from connectors.openclaw_client import OpenClawClient, run_agent

# Quick execution
result = run_agent(
    agent_name="developer",
    task="Write unit tests for auth module",
    context={"language": "python"}
)

if result.success:
    print(f"Output: {result.output}")
else:
    print(f"Error: {result.error}")
```

### Client Configuration

```python
client = OpenClawClient(
    api_endpoint="http://openclaw.example.com:8080",
    api_token="your-token",
    timeout=300,
    retry_attempts=3
)

# Check connection
if client.health_check():
    print("OpenClaw connected!")

# List available agents
agents = client.list_agents()
```

---

## Configuration Reference

### config.yaml

```yaml
openclaw:
  endpoint: http://localhost:8080
  token: ""  # Or use OPENCLAW_GATEWAY_TOKEN env var
  timeout: 300
  retry_attempts: 3

task_processing:
  max_concurrent: 5      # Parallel task limit
  poll_interval: 2.0     # Seconds between backlog checks

scheduler:
  enabled: false         # Use --use-scheduler flag or set to true
  poll_interval: 2.0
  rate_limit: 0          # Tasks per second (0 = unlimited)

metrics:
  enabled: true          # Enable metrics collection
  port: 9090             # Metrics API port

logging:
  level: INFO            # DEBUG, INFO, WARNING, ERROR
  console: true

paths:
  tasks_dir: tasks
  projects_dir: projects
  logs_dir: logs
  runs_dir: runs         # NEW: Run session storage
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCLAW_GATEWAY_HOST` | OpenClaw API endpoint | `http://localhost:8080` |
| `OPENCLAW_GATEWAY_TOKEN` | Authentication token | (none) |
| `MC_CONFIG` | Path to config file | `config.yaml` |
| `MC_TASKS_DIR` | Tasks directory | `tasks` |
| `MC_PROJECTS_DIR` | Projects directory | `projects` |
| `MC_LOG_DIR` | Logs directory | `logs` |
| `MC_RUNS_DIR` | Runs directory (NEW) | `runs` |
| `MC_AGENTS_DIR` | Agents directory (NEW) | `workspace/agents` |
| `LOG_LEVEL` | Logging level | `INFO` |

---

## Logging

Logs are written to:
- Console (if enabled)
- `logs/mission_control.log` - Main log file
- `logs/tasks/{task_id}.jsonl` - Per-task structured logs
- `runs/{run_id}/logs.json` - Run-specific logs (NEW)

### Log Levels

```python
from orchestration.logger import get_logger

logger = get_logger()

logger.info("Processing started")
logger.task_start("task_001", "developer", "Build feature X")
logger.agent_execution("task_001", "developer", "completed", output)
logger.task_complete("task_001", success=True)
logger.error("Something failed", task_id="task_001", exception=e)
```

---

## Example Workflows

### Multi-Agent Project with Dependencies

```python
from orchestration.task_runner import TaskRunner
from orchestration.project_memory import ProjectMemory

# Setup
runner = TaskRunner()
memory = ProjectMemory()

# Create project
memory.create_project("app-launch", "Launch new mobile app")

# Submit tasks with dependencies
runner.submit_task(
    "app-launch", "designer", 
    "Create app design system",
    task_id="task_design"
)

runner.submit_task(
    "app-launch", "developer",
    "Build app features",
    context={"depends_on": ["task_design"]},
    task_id="task_dev"
)

runner.submit_task(
    "app-launch", "qa",
    "Test the application",
    context={"depends_on": ["task_dev"]},
    task_id="task_qa"
)

# Start with scheduler for dependency resolution
python run_mission_control.py --use-scheduler
```

### Quick Execution with Capability Matching

```python
from orchestration.capability_index import match_task_to_agents
from connectors import run_agent

task = {"description": "Optimize database queries for performance"}

# Find best agent
matches = match_task_to_agents(task, limit=1)
best_agent = matches[0].agent_id if matches else "developer"

# Execute
result = run_agent(best_agent, task["description"])
print(result.output)
```

---

## Troubleshooting

### OpenClaw Not Connecting

1. Check gateway is running: `curl http://localhost:8080/health`
2. Verify token: `echo $OPENCLAW_GATEWAY_TOKEN`
3. Check firewall/network access

### Tasks Stuck in Backlog (with Scheduler)

1. Check dependencies: Tasks may be waiting for others
2. Use `--dry-run` to see status
3. Check `runs/{run_id}/logs.json` for dependency info

### Tasks Stuck in Running

1. Check `tasks/running/` for stale tasks
2. Manually move back to backlog if needed
3. Review `logs/mission_control.log` for errors

### Agent Execution Failing

1. Check agent exists: `client.list_agents()`
2. Verify agent configuration in OpenClaw
3. Review task context for required fields

---

## Architecture

```
autonomous_ai_startup/
├── api/                          # NEW: API endpoints
│   ├── __init__.py
│   └── metrics_api.py            # Metrics HTTP server
├── connectors/
│   ├── __init__.py
│   └── openclaw_client.py        # OpenClaw API client
├── orchestration/
│   ├── __init__.py
│   ├── logger.py                 # Logging system
│   ├── project_memory.py         # Project data management
│   ├── task_runner.py            # Task execution loop
│   ├── task_dependencies.py      # NEW: Dependency management
│   ├── run_sessions.py           # NEW: Run session tracking
│   ├── capability_index.py       # NEW: Agent capability matching
│   ├── scheduler.py              # NEW: Dependency-aware scheduling
│   └── metrics.py                # NEW: Metrics collection
├── tasks/
│   ├── backlog/                  # Pending tasks
│   ├── running/                  # In-progress tasks
│   ├── completed/                # Finished tasks
│   └── examples/                 # NEW: Example task definitions
├── projects/
│   └── {project-name}/           # Project outputs
├── runs/                         # NEW: Run session data
│   └── run_{timestamp}_{id}/
│       ├── metadata.json
│       ├── tasks.json
│       ├── logs.json
│       ├── metrics.json
│       └── outputs/
├── logs/
│   └── mission_control.log       # System logs
├── config.yaml                   # Configuration
└── run_mission_control.py        # Entry point
```

---

## IDEA → STARTUP Generator

The IDEA → STARTUP feature allows you to generate a complete startup project from a single idea. It creates all necessary tasks across multiple phases with proper dependencies and agent assignments.

### Using the Dashboard UI

1. Open the dashboard at `http://localhost:3000`
2. Click the **"Generate Startup"** button in the hero section
3. Enter your startup idea (at least 10 characters)
4. Optionally provide a custom project name
5. Click **"Generate Startup"** to create the project
6. View progress in the **Pipeline Dashboard**

### Using the API

```bash
# Generate a startup from an idea
curl -X POST http://localhost:3000/api/startup/generate \
  -H "Content-Type: application/json" \
  -d '{
    "idea": "An AI-powered personal finance app that helps millennials save money",
    "projectName": "FinanceAI"
  }'

# Get pipeline configuration info
curl http://localhost:3000/api/startup/generate
```

### Pipeline Phases

The startup generator creates tasks across 4 phases:

| Phase | Tasks | Agents |
|-------|-------|--------|
| **1. Product Definition** | Market Research, Product Spec | market-researcher, product-manager |
| **2. Design** | UX Design, UI Design System | ux-designer, ui-designer |
| **3. Build** | Architecture, Backend, Frontend | software-architect, developers |
| **4. Marketing** | Brand Copy, SEO, Growth Strategy | copywriter, seo-strategist, growth-hacker |

### Task Dependencies

Tasks are created with proper dependencies:

```
market-research
      │
      └──→ product-spec
                │
       ┌───────┴───────┐
       │               │
       ↓               ↓
  ux-design      architecture
       │               │
       ↓               ├──→ backend-development
  ui-design           │
       │               └──→ frontend-development
       └───────┬───────┘
               │
       brand-messaging
               │
         seo-strategy
               │
        growth-strategy
```

### Customizing the Pipeline

Edit `config/startup_pipeline.yaml` to customize:

- Add/remove pipeline phases
- Modify task templates
- Change agent role mappings
- Adjust estimated hours
- Update deliverables

### Example Output

```json
{
  "success": true,
  "project": {
    "id": "proj_abc123",
    "name": "FinanceAI",
    "slug": "financeai",
    "phases": [
      { "id": "product-definition", "name": "Product Definition", "taskIds": ["..."] },
      { "id": "design", "name": "Design", "taskIds": ["..."] },
      { "id": "build", "name": "Build", "taskIds": ["..."] },
      { "id": "marketing", "name": "Marketing", "taskIds": ["..."] }
    ],
    "taskCount": 10
  }
}
```

---

## Visual Task Pipeline Dashboard

The Pipeline Dashboard provides a real-time Kanban-style view of tasks flowing through the system.

### Accessing the Pipeline

1. Click **"Pipeline"** in the sidebar navigation (🔄 icon)
2. Or navigate directly after generating a startup

### Pipeline Stages

| Stage | Status Values | Description |
|-------|---------------|-------------|
| 🎯 **Planner** | `inbox` | Tasks being planned and analyzed |
| 📋 **Tasks** | `backlog`, `todo`, `blocked` | Queued tasks ready for assignment |
| 🤖 **Agents** | `in_progress` | Tasks actively being worked on |
| ✨ **Results** | `review`, `done` | Completed tasks and those in review |

### Features

- **Real-time Updates** - Tasks move automatically as status changes
- **Filtering** - Filter by status or project tag
- **Task Details** - Click any task for full details in sidebar
- **Metrics** - View completion rate, active agents, blocked tasks
- **Dependencies** - Visual indicators show task dependencies
- **Priority Indicators** - Color-coded priority badges

---

## Agent Knowledge System

The knowledge system allows agents to learn from previous projects and reuse successful patterns.

### How It Works

1. **Capture**: After successful task completion, the system analyzes output for reusable patterns
2. **Classification**: Knowledge is classified by type (landing pages, pricing, architecture, etc.)
3. **Embedding**: Text embeddings enable semantic search (uses OpenAI if available, falls back to TF-IDF)
4. **Storage**: Knowledge is stored in SQLite with markdown backups in `knowledge/`
5. **Retrieval**: Before task execution, relevant knowledge is injected into agent context

### Knowledge Types

| Type | Domain | Example |
|------|--------|---------|
| `landing_page_pattern` | marketing | Hero section structures, CTA patterns |
| `pricing_strategy` | product | Tier configurations, pricing psychology |
| `architecture_pattern` | engineering | System designs, tech stack decisions |
| `marketing_strategy` | marketing | Campaign approaches, content strategies |
| `coding_pattern` | engineering | Reusable code, implementation patterns |
| `sales_approach` | sales | Pitch scripts, objection handling |
| `design_pattern` | design | UI/UX patterns, visual guidelines |
| `workflow_process` | operations | Business processes, automation flows |

### Using the Knowledge API

```python
from orchestration import (
    store_agent_knowledge,
    retrieve_relevant_knowledge,
    get_knowledge_context
)

# Store knowledge (automatic after task completion)
entries = store_agent_knowledge(
    agent_name='developer',
    task_output='...',
    project_id='my-project'
)

# Retrieve relevant knowledge
matches = retrieve_relevant_knowledge(
    'Build a landing page with pricing',
    top_k=5
)
for entry, similarity in matches:
    print(f"{entry.knowledge_type}: {similarity:.2%}")

# Get formatted context for injection
context = get_knowledge_context('Build a landing page')
print(context['knowledge'])  # Formatted text
```

### Configuration

In `config.yaml`:

```yaml
knowledge:
  enabled: true
  min_confidence: 0.3        # Detection threshold
  max_context_entries: 5     # Max entries per task
  knowledge_dir: knowledge   # Markdown storage

embeddings:
  provider: auto             # auto, openai, tfidf
  openai_model: text-embedding-3-small
  tfidf_dimension: 256       # Fallback dimension
```

Set `OPENAI_API_KEY` for high-quality semantic search.

### Knowledge Directory

```
knowledge/
├── README.md
├── marketing/
│   └── landing_page_pattern_*.md
├── product/
│   └── pricing_strategy_*.md
├── engineering/
│   └── architecture_pattern_*.md
├── sales/
├── design/
└── operations/
```

---

## Agent Reputation System

The reputation system tracks agent performance and uses it for intelligent routing.

### How It Works

1. **Tracking**: After each task, success/failure and execution time are recorded
2. **Scoring**: Agents receive a reputation score (0-1) based on:
   - Success rate (60% weight)
   - Experience/task count (20% weight)
   - Efficiency/execution time (20% weight)
3. **Routing**: When selecting agents, reputation is combined with capability matching

### Reputation Metrics

| Metric | Description |
|--------|-------------|
| `tasks_completed` | Total successful tasks |
| `tasks_failed` | Total failed tasks |
| `success_rate` | Completed / Total |
| `average_execution_time` | Mean task duration |

### Using the Reputation API

```python
from orchestration import (
    update_agent_reputation,
    get_agent_score,
    rank_agents_by_reputation,
    get_reputation_manager
)

# Update after task (automatic via task_runner)
update_agent_reputation('developer', success=True, execution_time=45.2)

# Get agent score (0-1)
score = get_agent_score('developer')
print(f"Developer score: {score:.2f}")

# Rank multiple agents
rankings = rank_agents_by_reputation(['developer', 'marketing', 'sales'])
for agent, score in rankings:
    print(f"{agent}: {score:.2f}")

# Get summary
manager = get_reputation_manager()
summary = manager.get_summary()
print(f"Top performer: {summary['top_performers'][0]['agent']}")
```

### Reputation-Based Agent Selection

```python
from orchestration import match_task_with_reputation, select_best_agent

# Match with reputation weighting
matches = match_task_with_reputation(
    task={'description': 'Build API endpoint'},
    limit=5,
    reputation_weight=0.3  # 30% reputation, 70% capability
)

# Select single best agent
best = select_best_agent(task, use_reputation=True)
print(f"Best agent: {best.agent_name} ({best.score:.2f})")
```

### Analytics API

```bash
# Get agent performance data
curl http://localhost:3000/api/analytics/agent-performance

# Response includes:
# - totalAgents, totalTasksCompleted, totalTasksFailed
# - overallSuccessRate, averageExecutionTime
# - topPerformers (agents with 3+ tasks, sorted by success rate)
# - recentlyActive (sorted by last_updated)
# - performanceByDivision
```

### Configuration

In `config.yaml`:

```yaml
reputation:
  enabled: true
  reputation_weight: 0.3    # Weight vs capability (0-1)
  min_tasks_threshold: 3    # Min tasks before affecting ranking
```

---

## Next Steps

1. Configure your OpenClaw gateway connection
2. Create your first project and tasks
3. **Generate a startup from an idea** using IDEA → STARTUP
4. **Monitor progress** in the Pipeline Dashboard
5. **Let agents learn** - Knowledge is captured automatically
6. **Watch reputation build** - Check `/api/analytics/agent-performance`
7. Try the scheduler with `--use-scheduler`
8. Enable metrics with `--metrics-port 9090`
9. Explore example tasks in `tasks/examples/`
10. Monitor results in project outputs and run sessions
