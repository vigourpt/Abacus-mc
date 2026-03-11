'use client';

import { useState, useEffect } from 'react';

interface Node {
  id: string;
  name: string;
  type: 'gateway' | 'worker' | 'orchestrator';
  status: 'online' | 'offline' | 'degraded';
  host: string;
  port: number;
  cpu: number;
  memory: number;
  activeConnections: number;
  lastHeartbeat: string;
}

export function NodesPanel() {
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    setNodes([
      {
        id: '1',
        name: 'gateway-primary',
        type: 'gateway',
        status: 'online',
        host: 'localhost',
        port: 8080,
        cpu: 23,
        memory: 45,
        activeConnections: 12,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'worker-01',
        type: 'worker',
        status: 'online',
        host: '192.168.1.10',
        port: 9001,
        cpu: 67,
        memory: 78,
        activeConnections: 5,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'worker-02',
        type: 'worker',
        status: 'degraded',
        host: '192.168.1.11',
        port: 9001,
        cpu: 89,
        memory: 92,
        activeConnections: 8,
        lastHeartbeat: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: '4',
        name: 'orchestrator',
        type: 'orchestrator',
        status: 'online',
        host: '192.168.1.1',
        port: 7000,
        cpu: 12,
        memory: 34,
        activeConnections: 25,
        lastHeartbeat: new Date().toISOString(),
      },
    ]);
  }, []);

  const statusColors: Record<string, string> = {
    online: 'text-green-400 bg-green-400/10',
    offline: 'text-red-400 bg-red-400/10',
    degraded: 'text-yellow-400 bg-yellow-400/10',
  };

  const typeIcons: Record<string, string> = {
    gateway: '🌐',
    worker: '⚙️',
    orchestrator: '🎯',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Nodes</h2>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + Add Node
        </button>
      </div>

      <div className="grid gap-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcons[node.type]}</span>
                <div>
                  <h3 className="font-medium text-white">{node.name}</h3>
                  <p className="text-sm text-gray-500">{node.host}:{node.port}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs capitalize ${statusColors[node.status]}`}>
                {node.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">CPU</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${node.cpu > 80 ? 'bg-red-500' : node.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${node.cpu}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{node.cpu}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Memory</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${node.memory > 80 ? 'bg-red-500' : node.memory > 60 ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                      style={{ width: `${node.memory}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{node.memory}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Connections</p>
                <p className="text-white font-medium">{node.activeConnections}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Heartbeat</p>
                <p className="text-white text-sm">
                  {new Date(node.lastHeartbeat).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
