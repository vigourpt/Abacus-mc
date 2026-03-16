"""Orchestration module for Mission Control.

Provides task execution, scheduling, dependency management,
agent capabilities, metrics, and run session management.

Modules:
- task_runner: Core task execution loop
- scheduler: Task scheduling with dependency resolution
- task_dependencies: Dependency graph management
- capability_index: Agent capability matching
- metrics: Observability and metrics collection
- run_sessions: Execution run session management
- project_memory: Project data persistence
- logger: Structured logging
- database: Knowledge and reputation database management
- embeddings: Text embedding generation and similarity search
- knowledge_capture: Extract and store knowledge from task outputs
- knowledge_retrieval: Retrieve relevant knowledge for tasks
- reputation: Agent performance tracking and scoring
"""

from .logger import get_logger, Logger
from .task_runner import TaskRunner, TaskStateManager, Task, TaskState
from .project_memory import ProjectMemory, read_project, write_output, append_log
from .task_dependencies import (
    DependencyManager, 
    get_dependency_manager,
    can_execute_task,
    get_ready_tasks
)
from .run_sessions import (
    RunSession,
    RunSessionManager,
    get_session_manager,
    create_run,
    get_current_run
)
from .capability_index import (
    CapabilityIndex,
    get_capability_index,
    match_task_to_agents,
    match_task_with_reputation,
    select_best_agent
)
from .scheduler import (
    Scheduler,
    get_scheduler,
    start_scheduler
)
from .metrics import (
    MetricsCollector,
    get_metrics_collector,
    increment,
    record
)
from .database import (
    DatabaseManager,
    get_database,
    initialize_database,
    KnowledgeEntry,
    AgentReputation
)
from .embeddings import (
    EmbeddingSystem,
    get_embedding_system,
    generate_embedding,
    search_similar_knowledge
)
from .knowledge_capture import (
    KnowledgeCapture,
    get_knowledge_capture,
    store_agent_knowledge
)
from .knowledge_retrieval import (
    KnowledgeRetrieval,
    get_knowledge_retrieval,
    retrieve_relevant_knowledge,
    get_knowledge_context
)
from .reputation import (
    ReputationManager,
    get_reputation_manager,
    update_agent_reputation,
    get_agent_score,
    rank_agents_by_reputation
)

__all__ = [
    # Logger
    'get_logger', 'Logger',
    # Task Runner
    'TaskRunner', 'TaskStateManager', 'Task', 'TaskState',
    # Project Memory
    'ProjectMemory', 'read_project', 'write_output', 'append_log',
    # Dependencies
    'DependencyManager', 'get_dependency_manager', 'can_execute_task', 'get_ready_tasks',
    # Run Sessions
    'RunSession', 'RunSessionManager', 'get_session_manager', 'create_run', 'get_current_run',
    # Capabilities
    'CapabilityIndex', 'get_capability_index', 'match_task_to_agents',
    'match_task_with_reputation', 'select_best_agent',
    # Scheduler
    'Scheduler', 'get_scheduler', 'start_scheduler',
    # Metrics
    'MetricsCollector', 'get_metrics_collector', 'increment', 'record',
    # Database
    'DatabaseManager', 'get_database', 'initialize_database',
    'KnowledgeEntry', 'AgentReputation',
    # Embeddings
    'EmbeddingSystem', 'get_embedding_system', 'generate_embedding', 'search_similar_knowledge',
    # Knowledge Capture
    'KnowledgeCapture', 'get_knowledge_capture', 'store_agent_knowledge',
    # Knowledge Retrieval
    'KnowledgeRetrieval', 'get_knowledge_retrieval', 'retrieve_relevant_knowledge', 'get_knowledge_context',
    # Reputation
    'ReputationManager', 'get_reputation_manager', 'update_agent_reputation',
    'get_agent_score', 'rank_agents_by_reputation',
]
