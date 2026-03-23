'use client';

import { useState, useEffect } from 'react';

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
    // Poll for task updates
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

        // Poll for completion
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

  return (
    <div className="container">
      <h1>Mission Control</h1>
      
      <div className="card">
        <h2>Execute Agent Task</h2>
        <form onSubmit={handleSubmitTask}>
          <div>
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
          
          <div>
            <label>Task Description</label>
            <textarea 
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              placeholder="Describe what you want the agent to do..."
              rows={4}
              required
            />
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Executing...' : 'Execute Task'}
          </button>
        </form>
      </div>

      {lastResult && (
        <div className="card">
          <h3>Last Result</h3>
          <pre>{lastResult}</pre>
        </div>
      )}

      <div className="card">
        <h2>Recent Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks yet</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left' }}>
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
              {tasks.slice(0, 10).map(task => (
                <tr key={task.id}>
                  <td style={{ fontSize: '0.75rem' }}>{task.id.slice(0, 8)}...</td>
                  <td>{task.agent_slug}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.task.slice(0, 50)}...
                  </td>
                  <td>
                    <span className={`status ${task.status}`}>{task.status}</span>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
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
