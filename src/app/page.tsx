'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Agent {
  id: number;
  slug: string;
  name: string;
  description: string | null;
}

interface Task {
  id: string;
  agent_slug: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: string | null;
  created_at: string;
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [taskInput, setTaskInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

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

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  }

  async function handleSubmitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgent || !taskInput.trim()) return;

    setIsLoading(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentSlug: selectedAgent, task: taskInput }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Task created:', data);
        setTaskInput('');
        fetchTasks();
        pollForResult(data.taskId);
      } else {
        const error = await res.text();
        setLastResult(`Error: ${error}`);
      }
    } catch (error) {
      setLastResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function pollForResult(taskId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (res.ok) {
          const task: Task = await res.json();
          
          if (task.status === 'completed') {
            setLastResult(task.result || 'Task completed');
            fetchTasks();
            return;
          }
          
          if (task.status === 'failed') {
            setLastResult(`Task failed: ${task.result || 'Unknown error'}`);
            fetchTasks();
            return;
          }
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
      
      attempts++;
    }
    
    setLastResult('Task timed out');
  }

  const recentTasks = tasks.slice(0, 10);
  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="container">
      <div className="card-header">
        <h1>Dashboard</h1>
        <Link href="/tasks" className="btn btn-secondary">View All Tasks</Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{agents.length}</div>
          <div className="stat-label">Available Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{runningTasks}</div>
          <div className="stat-label">Running Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingTasks}</div>
          <div className="stat-label">Pending Tasks</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Execute Task Form */}
        <div className="card">
          <h2>Execute Agent Task</h2>
          <form onSubmit={handleSubmitTask}>
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
            
            <button type="submit" disabled={isLoading} className="btn">
              {isLoading ? 'Executing...' : 'Execute Task'}
            </button>
          </form>
        </div>

        {/* Last Result */}
        <div className="card">
          <h2>Last Result</h2>
          {lastResult ? (
            <pre style={{ maxHeight: '300px', overflow: 'auto' }}>{lastResult}</pre>
          ) : (
            <div className="empty-state">
              <p>No result yet. Execute a task to see results here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <h2>Recent Tasks</h2>
        {recentTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No tasks yet</p>
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
              {recentTasks.map(task => (
                <tr key={task.id}>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {task.id.slice(0, 8)}...
                  </td>
                  <td>
                    <span className="badge badge-blue">{task.agent_slug}</span>
                  </td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
