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
  created_at: string;
  completed_at: string | null;
}

export default function AnalyticsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [agentsRes, tasksRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/tasks'),
      ]);

      if (agentsRes.ok) {
        setAgents(await agentsRes.json());
      }
      if (tasksRes.ok) {
        setTasks(await tasksRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const failedTasks = tasks.filter(t => t.status === 'failed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const runningTasks = tasks.filter(t => t.status === 'running').length;

  const completionRate = totalTasks > 0 
    ? ((completedTasks / totalTasks) * 100).toFixed(1) 
    : '0';

  // Agent performance
  const agentStats = agents.map(agent => {
    const agentTasks = tasks.filter(t => t.agent_slug === agent.slug);
    const completed = agentTasks.filter(t => t.status === 'completed').length;
    const failed = agentTasks.filter(t => t.status === 'failed').length;
    const total = agentTasks.length;
    
    return {
      ...agent,
      totalTasks: total,
      completed,
      failed,
      successRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
    };
  }).filter(a => a.totalTasks > 0).sort((a, b) => b.totalTasks - a.totalTasks);

  // System health
  const systemHealth = {
    gateway: 'operational', // This would come from actual health checks
    database: 'operational',
    agents: agents.length > 0 ? 'operational' : 'degraded',
  };

  return (
    <div className="container">
      <h1>Analytics</h1>

      {isLoading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-value">{totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success)' }}>{completedTasks}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--error)' }}>{failedTasks}</div>
              <div className="stat-label">Failed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{completionRate}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>

          <div className="grid grid-2">
            {/* Agent Performance */}
            <div className="card">
              <h2>Agent Performance</h2>
              {agentStats.length === 0 ? (
                <div className="empty-state">
                  <p>No agent activity yet</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Tasks</th>
                      <th>Success</th>
                      <th>Failed</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentStats.map(agent => (
                      <tr key={agent.slug}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{agent.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {agent.slug}
                          </div>
                        </td>
                        <td>{agent.totalTasks}</td>
                        <td style={{ color: 'var(--success)' }}>{agent.completed}</td>
                        <td style={{ color: 'var(--error)' }}>{agent.failed}</td>
                        <td>
                          <span className={`badge ${parseFloat(agent.successRate) >= 80 ? 'badge-green' : parseFloat(agent.successRate) >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                            {agent.successRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Task Status Distribution */}
            <div className="card">
              <h2>Task Status</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Pending</span>
                    <span>{pendingTasks}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${totalTasks > 0 ? (pendingTasks / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--warning)' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Running</span>
                    <span>{runningTasks}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${totalTasks > 0 ? (runningTasks / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--accent)' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Completed</span>
                    <span>{completedTasks}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--success)' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Failed</span>
                    <span>{failedTasks}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0}%`, height: '100%', background: 'var(--error)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="card">
            <h2>System Health</h2>
            <div className="grid grid-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🖥️</span>
                <div>
                  <div style={{ fontWeight: 500 }}>Gateway</div>
                  <div style={{ color: 'var(--success)' }}>● {systemHealth.gateway}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💾</span>
                <div>
                  <div style={{ fontWeight: 500 }}>Database</div>
                  <div style={{ color: 'var(--success)' }}>● {systemHealth.database}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <div>
                  <div style={{ fontWeight: 500 }}>Agents</div>
                  <div style={{ color: systemHealth.agents === 'operational' ? 'var(--success)' : 'var(--warning)' }}>
                    ● {systemHealth.agents} ({agents.length} loaded)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
