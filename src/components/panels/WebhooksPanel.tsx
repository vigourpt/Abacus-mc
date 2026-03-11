'use client';

import { useState, useEffect } from 'react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'GET' | 'PUT';
  events: string[];
  status: 'active' | 'inactive' | 'error';
  lastTriggered: string;
  successRate: number;
  totalCalls: number;
}

export function WebhooksPanel() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setWebhooks([
      {
        id: '1',
        name: 'Slack Notifications',
        url: 'https://hooks.slack.com/services/xxx',
        method: 'POST',
        events: ['task.completed', 'agent.error'],
        status: 'active',
        lastTriggered: new Date(Date.now() - 1800000).toISOString(),
        successRate: 99.5,
        totalCalls: 1234,
      },
      {
        id: '2',
        name: 'GitHub Issue Creator',
        url: 'https://api.github.com/repos/xxx/issues',
        method: 'POST',
        events: ['error.critical'],
        status: 'active',
        lastTriggered: new Date(Date.now() - 86400000).toISOString(),
        successRate: 100,
        totalCalls: 45,
      },
      {
        id: '3',
        name: 'Analytics Tracker',
        url: 'https://analytics.example.com/events',
        method: 'POST',
        events: ['task.created', 'task.completed', 'agent.active'],
        status: 'inactive',
        lastTriggered: new Date(Date.now() - 604800000).toISOString(),
        successRate: 87.3,
        totalCalls: 5678,
      },
    ]);
  }, []);

  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    inactive: 'text-gray-400 bg-gray-400/10',
    error: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Webhooks</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Webhook
        </button>
      </div>

      <div className="space-y-3">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔗</span>
                <div>
                  <h3 className="font-medium text-white">{webhook.name}</h3>
                  <p className="text-xs text-gray-500 font-mono truncate max-w-md">
                    {webhook.url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs">
                  {webhook.method}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${statusColors[webhook.status]}`}>
                  {webhook.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {webhook.events.map((event) => (
                <span
                  key={event}
                  className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs"
                >
                  {event}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Last Triggered</p>
                <p className="text-white">{new Date(webhook.lastTriggered).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Success Rate</p>
                <p className={`font-medium ${webhook.successRate > 95 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {webhook.successRate}%
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Calls</p>
                <p className="text-white">{webhook.totalCalls.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
