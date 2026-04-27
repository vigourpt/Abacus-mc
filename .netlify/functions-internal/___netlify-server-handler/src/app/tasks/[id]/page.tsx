'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

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
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRerunning, setIsRerunning] = useState(false);

  useEffect(() => {
    fetchTask();
    // Poll for updates if task is pending or running
    const interval = setInterval(() => {
      if (task && (task.status === 'pending' || task.status === 'running')) {
        fetchTask();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, task?.status]);

  async function fetchTask() {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRerun() {
    if (!task) return;
    setIsRerunning(true);

    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentSlug: task.agent_slug, task: task.task }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to new task
        window.location.href = `/tasks/${data.taskId}`;
      } else {
        const err = await res.text();
        alert(`Failed to rerun task: ${err}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsRerunning(false);
    }
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

  if (!task) {
    return (
      <div className="container">
        <div className="card">
          <h1>Task Not Found</h1>
          <p>The task was not found.</p>
          <Link href="/tasks" className="btn">Back to Tasks</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link href="/tasks" className="breadcrumb-link">Tasks</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{task.id.slice(0, 8)}...</span>
      </div>

      <div className="card-header">
        <div>
          <h1>Task Details</h1>
        </div>
        <div className="header-actions">
          {task.status === 'failed' && (
            <button onClick={handleRerun} disabled={isRerunning} className="btn">
              {isRerunning ? 'Rerunning...' : '↻ Rerun Task'}
            </button>
          )}
          <Link href={`/agents/${task.agent_slug}`} className="btn btn-secondary">
            View Agent
          </Link>
        </div>
      </div>

      {/* Task Info */}
      <div className="card">
        <div className="task-meta">
          <div className="meta-item">
            <span className="meta-label">Task ID</span>
            <code>{task.id}</code>
          </div>
          <div className="meta-item">
            <span className="meta-label">Agent</span>
            <Link href={`/agents/${task.agent_slug}`} className="agent-link">
              {task.agent_slug}
            </Link>
          </div>
          <div className="meta-item">
            <span className="meta-label">Status</span>
            <span className={`status ${task.status}`}>{task.status}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Created</span>
            <span>{new Date(task.created_at).toLocaleString()}</span>
          </div>
          {task.completed_at && (
            <div className="meta-item">
              <span className="meta-label">Completed</span>
              <span>{new Date(task.completed_at).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Task Description */}
      <div className="card">
        <h2>Task Description</h2>
        <pre className="task-description">{task.task}</pre>
      </div>

      {/* Result/Error */}
      <div className="card">
        <h2>
          {task.status === 'failed' ? 'Error' : 'Result'}
        </h2>
        {task.error ? (
          <div className="result-error">
            <pre>{task.error}</pre>
          </div>
        ) : task.result ? (
          <div className="result-success">
            <pre className="result-content">{task.result}</pre>
          </div>
        ) : task.status === 'running' ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Task is running, waiting for result...</p>
          </div>
        ) : task.status === 'pending' ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Task is pending in queue...</p>
          </div>
        ) : (
          <div className="empty-state">
            <p>No result available yet</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card">
        <h2>Actions</h2>
        <div className="action-buttons">
          <Link href={`/chat?agent=${task.agent_slug}`} className="btn btn-secondary">
            💬 Chat with Agent
          </Link>
          <Link href={`/agents/${task.agent_slug}`} className="btn btn-secondary">
            🤖 View Agent Details
          </Link>
          <Link href="/tasks" className="btn btn-secondary">
            ← Back to Tasks
          </Link>
        </div>
      </div>
    </div>
  );
}
