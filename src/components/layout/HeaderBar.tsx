'use client';

import { useAppStore } from '@/store';

export function HeaderBar() {
  const { agents, tasks, activePanel, gatewayConnection } = useAppStore();

  const activeAgents = agents.filter((a) => a.status === 'active' || a.status === 'busy').length;
  const pendingTasks = tasks.filter((t) => t.status === 'inbox' || t.status === 'backlog').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;

  const panelTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    agents: 'Agent Management',
    tasks: 'Task Board',
    messages: 'Agent Messages',
    hiring: 'Agent Hiring',
    gateways: 'Gateway Connections',
    settings: 'Settings',
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {panelTitles[activePanel] || 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Autonomous AI Startup Architecture
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">🤖</span>
              <span className="text-gray-300">{activeAgents} active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">📋</span>
              <span className="text-gray-300">{pendingTasks} pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">⚡</span>
              <span className="text-gray-300">{inProgressTasks} in progress</span>
            </div>
          </div>

          {/* Gateway Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${
                gatewayConnection?.status === 'connected'
                  ? 'bg-green-500'
                  : gatewayConnection?.status === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-gray-500'
              }`}
            ></span>
            <span className="text-xs text-gray-300">
              {gatewayConnection?.status === 'connected'
                ? 'OpenClaw Connected'
                : 'Gateway Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
