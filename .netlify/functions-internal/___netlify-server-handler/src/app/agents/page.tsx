'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Agent {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAgents();
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
    } finally {
      setIsLoading(false);
    }
  }

  const filteredAgents = search
    ? agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.slug.toLowerCase().includes(search.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
      )
    : agents;

  return (
    <div className="container">
      <div className="card-header">
        <h1>Agents</h1>
        <span className="agent-count">{agents.length} agents</span>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <p>{search ? 'No agents match your search' : 'No agents found'}</p>
          </div>
        </div>
      ) : (
        <div className="agents-grid">
          {filteredAgents.map(agent => (
            <Link key={agent.slug} href={`/agents/${agent.slug}`} className="agent-card">
              <div className="agent-icon">🤖</div>
              <div className="agent-info">
                <h3>{agent.name}</h3>
                {agent.description && (
                  <p className="agent-desc">{agent.description}</p>
                )}
                <code className="agent-slug">{agent.slug}</code>
              </div>
              <div className="agent-arrow">→</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
