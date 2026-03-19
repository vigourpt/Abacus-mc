'use client';

import { useState } from 'react';

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
  const [webhooks] = useState<Webhook[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: '' });

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
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ Add Webhook'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium text-white">Create Webhook</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Webhook"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">URL</label>
              <input
                type="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/webhook"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Events (comma-separated)</label>
            <input
              type="text"
              value={newWebhook.events}
              onChange={(e) => setNewWebhook(prev => ({ ...prev, events: e.target.value }))}
              placeholder="task.completed, agent.error"
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
          <p className="text-xs text-gray-500">
            Webhook support is coming soon. This form will be connected to the webhook management system.
          </p>
        </div>
      )}

      {webhooks.length === 0 && !showCreateForm ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">🔔</span>
          <h3 className="text-lg font-medium text-white mb-2">No Webhooks Configured</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Set up webhooks to receive notifications when events occur in your startup system.
            Get notified about task completions, agent errors, and more.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
          >
            + Create Your First Webhook
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}
