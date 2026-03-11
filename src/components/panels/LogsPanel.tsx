'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function LogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulated logs
    setLogs([
      {
        id: '1',
        level: 'info',
        source: 'task-planner',
        message: 'Task assigned to developer-agent',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        metadata: { taskId: 'task-123', agentId: 'dev-001' },
      },
      {
        id: '2',
        level: 'debug',
        source: 'websocket',
        message: 'Connection heartbeat successful',
        timestamp: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: '3',
        level: 'warn',
        source: 'memory',
        message: 'Memory usage at 75%',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        metadata: { usedMB: 768, totalMB: 1024 },
      },
      {
        id: '4',
        level: 'error',
        source: 'api',
        message: 'Failed to connect to external service',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        metadata: { service: 'openai', error: 'ETIMEDOUT' },
      },
      {
        id: '5',
        level: 'info',
        source: 'agent-sync',
        message: 'Synced 112 agents from workspace',
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
    ]);
  }, []);

  const levelColors: Record<string, string> = {
    info: 'text-blue-400 bg-blue-400/10',
    warn: 'text-yellow-400 bg-yellow-400/10',
    error: 'text-red-400 bg-red-400/10',
    debug: 'text-gray-400 bg-gray-400/10',
  };

  const filtered = logs.filter((log) => {
    if (levelFilter && log.level !== levelFilter) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">System Logs</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 w-48"
          />
          <select
            value={levelFilter || ''}
            onChange={(e) => setLevelFilter(e.target.value || null)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto font-mono text-sm">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="border-b border-gray-800 p-3 hover:bg-gray-800/50"
            >
              <div className="flex items-start gap-3">
                <span className="text-gray-600 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs uppercase ${levelColors[log.level]}`}>
                  {log.level}
                </span>
                <span className="text-purple-400 text-xs">[{log.source}]</span>
                <span className="text-gray-300 flex-1">{log.message}</span>
              </div>
              {log.metadata && (
                <pre className="mt-2 ml-20 text-xs text-gray-500 bg-gray-800/50 p-2 rounded">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
