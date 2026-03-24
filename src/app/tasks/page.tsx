'use client';

import { useState, useEffect } from 'react';

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

interface Agent {
  id: number;
  slug: string;
  name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchAgents();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgent || !taskInput.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentSlug: selectedAgent, task: taskInput }),
      });

      if (res.ok) {
        setTaskInput('');
        setShowCreateForm(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filter);

  const statusCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="container">
      <div className="card-header">
        <h1>Tasks</h1>
        <button className="btn" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h3>Create New Task</h3>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label>Select Agent</label>
              <select 
                value={selectedAgent} 
                onChange={e => setSelectedAgent(e.target.value)}
                required
              >
                <option value="">Choose an agent...</option>
                {agents.map(agent => (
                  <option key={agent.slug} value={agent.slug}>
                    {agent.name} ({agent.slug})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Task Description</label>
              <textarea 
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                placeholder="Describe what you want the agent to do..."
                rows={4}
                required
              />
            </div>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </div>
      )}

      <div className="filters">
        {['all', 'pending', 'running', 'completed', 'failed'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No tasks found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Agent</th>
                <th>Task</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task.id}>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {task.id.slice(0, 8)}...
                  </td>
                  <td>
                    <span className="badge badge-blue">{task.agent_slug}</span>
                  </td>
                  <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.task}
                  </td>
                  <td>
                    <span className={`status ${task.status}`}>{task.status}</span>
                  </td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {new Date(task.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
