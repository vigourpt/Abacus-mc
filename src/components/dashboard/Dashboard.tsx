'use client';

import { useAppStore } from '@/store';
import { AgentCard } from './AgentCard';
import { TaskSummary } from './TaskSummary';
import { ActivityFeed } from './ActivityFeed';
import { QuickActions } from './QuickActions';

export function Dashboard() {
  const { agents, tasks, activePanel } = useAppStore();

  // If a specific panel is active, show that instead
  if (activePanel !== 'dashboard') {
    return <PanelContent panel={activePanel} />;
  }

  const agentsByDivision = {
    executive: agents.filter((a) => a.division === 'executive'),
    engineering: agents.filter((a) => a.division === 'engineering'),
    marketing: agents.filter((a) => a.division === 'marketing'),
    sales: agents.filter((a) => a.division === 'sales'),
    operations: agents.filter((a) => a.division === 'operations'),
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Agents"
          value={agents.length}
          icon="🤖"
          color="blue"
        />
        <StatCard
          title="Active Tasks"
          value={tasks.filter((t) => t.status === 'in_progress').length}
          icon="⚡"
          color="yellow"
        />
        <StatCard
          title="Completed Today"
          value={tasks.filter((t) => t.status === 'done').length}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Pending Review"
          value={tasks.filter((t) => t.status === 'review').length}
          icon="🔍"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Agents Column */}
        <div className="col-span-2 space-y-6">
          {/* Core Agents */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Core Agents</h2>
            <div className="grid grid-cols-2 gap-4">
              {[...agentsByDivision.executive, ...agentsByDivision.engineering].map(
                (agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                )
              )}
            </div>
          </section>

          {/* Business Agents */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">
              Business Operations
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                ...agentsByDivision.marketing,
                ...agentsByDivision.sales,
                ...agentsByDivision.operations,
              ].map((agent) => (
                <AgentCard key={agent.id} agent={agent} compact />
              ))}
            </div>
          </section>

          {/* Task Summary */}
          <TaskSummary tasks={tasks} />
        </div>

        {/* Activity Feed */}
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30',
    yellow: 'bg-yellow-500/10 border-yellow-500/30',
    green: 'bg-green-500/10 border-green-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
  };

  return (
    <div
      className={`p-4 rounded-lg border ${colorClasses[color]} bg-gray-800`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );
}

function PanelContent({ panel }: { panel: string }) {
  const panels: Record<string, React.ReactNode> = {
    agents: <AgentsPanel />,
    tasks: <TasksPanel />,
    messages: <MessagesPanel />,
    hiring: <HiringPanel />,
    gateways: <GatewaysPanel />,
    settings: <SettingsPanel />,
  };

  return <div>{panels[panel] || <p>Panel not found</p>}</div>;
}

function AgentsPanel() {
  const { agents } = useAppStore();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">All Agents</h2>
      <div className="grid grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function TasksPanel() {
  const { tasks } = useAppStore();
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Task Board</h2>
      <TaskSummary tasks={tasks} expanded />
    </div>
  );
}

function MessagesPanel() {
  return (
    <div className="text-gray-400">
      <h2 className="text-xl font-semibold text-white mb-4">Agent Messages</h2>
      <p>Inter-agent communication will appear here.</p>
    </div>
  );
}

function HiringPanel() {
  return (
    <div className="text-gray-400">
      <h2 className="text-xl font-semibold text-white mb-4">Agent Hiring</h2>
      <p>Pending hiring requests and new agent creation.</p>
    </div>
  );
}

function GatewaysPanel() {
  return (
    <div className="text-gray-400">
      <h2 className="text-xl font-semibold text-white mb-4">Gateway Connections</h2>
      <p>OpenClaw gateway management and connection status.</p>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="text-gray-400">
      <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
      <p>System configuration and preferences.</p>
    </div>
  );
}
