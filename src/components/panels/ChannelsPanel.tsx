'use client';

import { useState, useEffect } from 'react';

interface Channel {
  id: string;
  name: string;
  type: 'telegram' | 'discord' | 'slack' | 'email' | 'webhook';
  status: 'connected' | 'disconnected' | 'error';
  agentsSubscribed: number;
  messagesProcessed: number;
  lastActivity: string;
}

const channelIcons: Record<string, string> = {
  telegram: '📱',
  discord: '🎮',
  slack: '💬',
  email: '📧',
  webhook: '🔗',
};

export function ChannelsPanel() {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    // Simulated channels
    setChannels([
      {
        id: '1',
        name: 'jarvis:main',
        type: 'telegram',
        status: 'connected',
        agentsSubscribed: 5,
        messagesProcessed: 1234,
        lastActivity: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'jarvis:telegram:direct',
        type: 'telegram',
        status: 'connected',
        agentsSubscribed: 3,
        messagesProcessed: 567,
        lastActivity: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'team-notifications',
        type: 'slack',
        status: 'connected',
        agentsSubscribed: 8,
        messagesProcessed: 2456,
        lastActivity: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'support-emails',
        type: 'email',
        status: 'disconnected',
        agentsSubscribed: 2,
        messagesProcessed: 189,
        lastActivity: new Date().toISOString(),
      },
    ]);
  }, []);

  const statusColors: Record<string, string> = {
    connected: 'text-green-400 bg-green-400/10',
    disconnected: 'text-gray-400 bg-gray-400/10',
    error: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Channels</h2>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + Add Channel
        </button>
      </div>

      <div className="grid gap-4">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{channelIcons[channel.type]}</span>
                <div>
                  <h3 className="font-medium text-white">{channel.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{channel.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${statusColors[channel.status]}`}>
                {channel.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Agents Subscribed</p>
                <p className="text-white font-medium">{channel.agentsSubscribed}</p>
              </div>
              <div>
                <p className="text-gray-500">Messages Processed</p>
                <p className="text-white font-medium">{channel.messagesProcessed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Activity</p>
                <p className="text-white font-medium">
                  {new Date(channel.lastActivity).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
