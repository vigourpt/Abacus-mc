'use client';

import { useState, useEffect } from 'react';

interface Gateway {
  id: string;
  name: string;
  type: 'openclaw' | 'crewai' | 'langgraph' | 'autogen';
  host: string;
  port: number;
  status: 'connected' | 'disconnected' | 'connecting';
  agentsRegistered: number;
  messagesProcessed: number;
  lastHeartbeat: string;
}

export function GatewaysPanel() {
  const [gateways, setGateways] = useState<Gateway[]>([]);

  useEffect(() => {
    setGateways([
      {
        id: '1',
        name: 'OpenClaw Primary',
        type: 'openclaw',
        host: 'localhost',
        port: 8080,
        status: 'connected',
        agentsRegistered: 112,
        messagesProcessed: 45678,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'CrewAI Gateway',
        type: 'crewai',
        host: '192.168.1.20',
        port: 9000,
        status: 'disconnected',
        agentsRegistered: 0,
        messagesProcessed: 0,
        lastHeartbeat: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }, []);

  const statusColors: Record<string, string> = {
    connected: 'text-green-400 bg-green-400/10',
    disconnected: 'text-red-400 bg-red-400/10',
    connecting: 'text-yellow-400 bg-yellow-400/10',
  };

  const typeLogos: Record<string, string> = {
    openclaw: '🤞',
    crewai: '🚀',
    langgraph: '📊',
    autogen: '🤖',
  };

  const handleConnect = (id: string) => {
    setGateways(gateways.map(g => 
      g.id === id 
        ? { ...g, status: g.status === 'connected' ? 'disconnected' : 'connecting' }
        : g
    ));
    // Simulate connection
    setTimeout(() => {
      setGateways(prev => prev.map(g => 
        g.id === id && g.status === 'connecting'
          ? { ...g, status: 'connected', lastHeartbeat: new Date().toISOString() }
          : g
      ));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Gateway Connections</h2>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + Add Gateway
        </button>
      </div>

      <div className="grid gap-4">
        {gateways.map((gateway) => (
          <div
            key={gateway.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{typeLogos[gateway.type]}</span>
                <div>
                  <h3 className="font-medium text-white">{gateway.name}</h3>
                  <p className="text-sm text-gray-500">
                    {gateway.host}:{gateway.port} • {gateway.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs ${statusColors[gateway.status]}`}>
                  {gateway.status === 'connecting' && (
                    <span className="animate-pulse mr-1">●</span>
                  )}
                  {gateway.status}
                </span>
                <button
                  onClick={() => handleConnect(gateway.id)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    gateway.status === 'connected'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {gateway.status === 'connected' ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Agents Registered</p>
                <p className="text-white font-medium">{gateway.agentsRegistered}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Messages Processed</p>
                <p className="text-white font-medium">{gateway.messagesProcessed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Last Heartbeat</p>
                <p className="text-white">
                  {new Date(gateway.lastHeartbeat).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
