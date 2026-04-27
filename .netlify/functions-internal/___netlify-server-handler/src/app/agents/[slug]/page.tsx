'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Agent {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  content: string;
}

interface Task {
  id: string;
  agent_slug: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function AgentPage({ params }: PageProps) {
  const { slug } = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgent();
  }, [slug]);

  async function fetchAgent() {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const agents = await res.json();
        const found = agents.find((a: Agent) => a.slug === slug);
        if (found) {
          // Fetch full agent content
          const agentRes = await fetch(`/api/agents?slug=${slug}`);
          if (agentRes.ok) {
            const fullAgent = await agentRes.json();
            setAgent(fullAgent);
          } else {
            setAgent(found);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch agent:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExecute(e: React.FormEvent) {
    e.preventDefault();
    if (!taskInput.trim()) return;

    setIsExecuting(true);
    setResult(null);
    setError(null);
    setCurrentTask(null);

    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentSlug: slug, task: taskInput }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentTask({ ...data, task: taskInput, agent_slug: slug } as Task);
        pollForResult(data.taskId);
      } else {
        const err = await res.text();
        setError(`Failed to start task: ${err}`);
      }
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setIsExecuting(false);
    }
  }

  async function pollForResult(taskId: string) {
    const maxAttempts = 120;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (res.ok) {
          const task: Task = await res.json();
          setCurrentTask(task);

          if (task.status === 'completed') {
            setResult(task.result || 'Task completed successfully');
            return;
          }

          if (task.status === 'failed') {
            setError(`Task failed: ${task.result || task.error || 'Unknown error'}`);
            return;
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }

      attempts++;
    }

    setError('Task timed out');
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container">
        <div className="card">
          <h1>Agent Not Found</h1>
          <p>The agent "{slug}" was not found.</p>
          <Link href="/" className="btn">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link href="/agents" className="breadcrumb-link">Agents</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{agent.name}</span>
      </div>

      <div className="card-header">
        <div>
          <h1>{agent.name}</h1>
          {agent.description && (
            <p className="agent-description">{agent.description}</p>
          )}
        </div>
        <Link href="/agents" className="btn btn-secondary">← Back to Agents</Link>
      </div>

      <div className="grid grid-2">
        {/* Execute Task Form */}
        <div className="card">
          <h2>Execute Task</h2>
          <form onSubmit={handleExecute}>
            <div className="form-group">
              <label>Task Description</label>
              <textarea
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                placeholder="Describe what you want this agent to do..."
                rows={6}
                required
                disabled={isExecuting}
              />
            </div>
            <button type="submit" disabled={isExecuting} className="btn">
              {isExecuting ? 'Executing...' : 'Execute Task'}
            </button>
          </form>

          {/* Task Status */}
          {currentTask && (
            <div className="task-status">
              <h3>Task Status</h3>
              <div className="status-row">
                <span>Task ID:</span>
                <code>{currentTask.id.slice(0, 8)}...</code>
              </div>
              <div className="status-row">
                <span>Status:</span>
                <span className={`status ${currentTask.status}`}>{currentTask.status}</span>
              </div>
              {currentTask.status === 'pending' && (
                <p className="status-hint">Waiting in queue...</p>
              )}
              {currentTask.status === 'running' && (
                <p className="status-hint">Agent is processing your request...</p>
              )}
            </div>
          )}
        </div>

        {/* Result/Error Display */}
        <div className="card">
          <h2>Result</h2>
          {error ? (
            <div className="result-error">
              <div className="error-header">❌ Error</div>
              <pre>{error}</pre>
            </div>
          ) : result ? (
            <div className="result-success">
              <div className="success-header">✓ Completed</div>
              <pre className="result-content">{result}</pre>
            </div>
          ) : currentTask?.status === 'running' || currentTask?.status === 'pending' ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Waiting for result...</p>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🚀</div>
              <p>Execute a task to see results here</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Persona Preview */}
      <div className="card">
        <h2>Agent Persona</h2>
        <pre className="persona-preview">{agent.content.slice(0, 1000)}{agent.content.length > 1000 ? '...' : ''}</pre>
      </div>
    </div>
  );
}
