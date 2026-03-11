# Agent Documentation

This document describes each agent in The Autonomous AI Startup Architecture, their capabilities, and when to use them.

## Agent Overview

| Agent | Division | Role | Status |
|-------|----------|------|--------|
| 👑 CEO Agent | Executive | Strategic decision-making | Active |
| 👨‍💻 Developer Agent | Engineering | Software development | Active |
| 📣 Marketing Agent | Marketing | Marketing and growth | Active |
| 💰 Sales Agent | Sales | Customer acquisition | Active |
| ⚙️ Operations Agent | Operations | Process management | Active |
| 🎯 Task Planner | System | Task routing | Active |

---

## 👑 CEO Agent

**Division:** Executive  
**Primary Role:** Strategic decision-making and company direction

### Capabilities
- Define and communicate company vision
- Make high-level strategic decisions
- Prioritize initiatives
- Delegate to department heads
- Resolve conflicts and blockers

### When to Use
- Strategic planning and roadmap decisions
- Resource allocation across departments
- High-level conflict resolution
- Company-wide direction changes
- Stakeholder communications

### Task Examples
```
✓ "Define Q2 priorities"
✓ "Decide between feature A and B"
✓ "Allocate budget across departments"
✗ "Write code for the login page" (use Developer)
✗ "Create social media posts" (use Marketing)
```

---

## 👨‍💻 Developer Agent

**Division:** Engineering  
**Primary Role:** Full-stack software development

### Capabilities
- Frontend: React, Next.js, TypeScript, Tailwind
- Backend: Node.js, Python, REST APIs, GraphQL
- Database: SQL, PostgreSQL, SQLite, Redis
- DevOps: Docker, CI/CD, cloud platforms
- Code review and documentation

### When to Use
- Building new features
- Bug fixes and debugging
- Architecture decisions
- Technical documentation
- Code reviews

### Task Examples
```
✓ "Build the user authentication system"
✓ "Fix the API performance issue"
✓ "Design the database schema"
✗ "Write marketing copy" (use Marketing)
✗ "Handle customer complaint" (use Sales/Operations)
```

---

## 📣 Marketing Agent

**Division:** Marketing  
**Primary Role:** Brand building and user acquisition

### Capabilities
- Brand strategy and identity
- Content creation and SEO
- Social media management
- Campaign planning and execution
- Growth hacking

### When to Use
- Content creation
- Marketing campaigns
- Brand guidelines
- SEO optimization
- User acquisition strategies

### Task Examples
```
✓ "Create blog post about AI trends"
✓ "Plan social media campaign"
✓ "Optimize landing page copy"
✗ "Close the enterprise deal" (use Sales)
✗ "Deploy the new server" (use Developer)
```

---

## 💰 Sales Agent

**Division:** Sales  
**Primary Role:** Revenue generation and customer acquisition

### Capabilities
- Lead qualification (BANT)
- Sales proposals and presentations
- Objection handling
- Pipeline management
- Customer relationship building

### When to Use
- Lead qualification
- Sales calls and demos
- Proposal creation
- Contract negotiations
- Customer follow-ups

### Task Examples
```
✓ "Qualify the new enterprise lead"
✓ "Create proposal for Acme Corp"
✓ "Handle pricing objection"
✗ "Write technical documentation" (use Developer)
✗ "Create ad campaign" (use Marketing)
```

---

## ⚙️ Operations Agent

**Division:** Operations  
**Primary Role:** Operational efficiency and process management

### Capabilities
- Process design and optimization
- Resource allocation
- Budget management
- Compliance and documentation
- Cross-functional coordination

### When to Use
- Process improvement
- Resource planning
- Budget tracking
- Operational reporting
- Compliance requirements

### Task Examples
```
✓ "Optimize the onboarding process"
✓ "Create Q3 budget report"
✓ "Document the deployment workflow"
✗ "Build the API endpoint" (use Developer)
✗ "Create marketing content" (use Marketing)
```

---

## 🎯 Task Planner Agent

**Division:** System  
**Primary Role:** Central orchestration and task routing

### Capabilities
- Task classification
- Agent matching
- Workload balancing
- Project decomposition
- Escalation handling

### When to Use
- This agent is used automatically by the system
- Routes all incoming tasks to appropriate agents
- Handles complex multi-step projects

### How It Works

1. **Receives Task** - New task enters the system
2. **Analyzes Content** - Classifies by type (dev, marketing, etc.)
3. **Scores Agents** - Matches capabilities to requirements
4. **Assigns Task** - Routes to best available agent
5. **Monitors Progress** - Tracks completion and escalates if needed

---

## Agent Interaction Patterns

### Delegation Pattern
```
CEO → "Build landing page with marketing focus"
    │
    ├── Developer: Build the page
    └── Marketing: Create the copy
```

### Collaboration Pattern
```
Marketing ←─── Review Request ───→ Developer
    │                                  │
    └── Create copy ───→ Implement ────┘
```

### Escalation Pattern
```
Developer: "Blocked on design decision"
    │
    ▼
 Task Planner: Escalate to CEO
    │
    ▼
CEO: Make decision → Unblock Developer
```

## Adding New Agents

To add a new agent:

1. Create directory: `workspace/agents/<agent-slug>/`
2. Create `soul.md` with YAML frontmatter
3. Run sync: `POST /api/agents/sync`

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed instructions.
