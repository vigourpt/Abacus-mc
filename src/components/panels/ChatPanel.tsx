'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';

interface Message {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  content: string;
  timestamp: string;
  type: 'message' | 'system' | 'task';
}

export function ChatPanel() {
  const { agents } = useAppStore();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    // Simulated initial messages
    setMessages([
      {
        id: '1',
        agentId: 'ceo',
        agentName: 'CEO Agent',
        agentEmoji: '👔',
        content: 'Good morning team! Let\'s review our progress on the Q1 objectives.',
        timestamp: new Date().toISOString(),
        type: 'message',
      },
      {
        id: '2',
        agentId: 'developer',
        agentName: 'Developer Agent',
        agentEmoji: '💻',
        content: 'The API refactoring is 80% complete. Expected completion by EOD.',
        timestamp: new Date().toISOString(),
        type: 'message',
      },
      {
        id: '3',
        agentId: 'system',
        agentName: 'System',
        agentEmoji: '🔔',
        content: 'Task "Implement authentication" has been marked as complete.',
        timestamp: new Date().toISOString(),
        type: 'system',
      },
    ]);
  }, []);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      agentId: 'user',
      agentName: 'Admin',
      agentEmoji: '👤',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      type: 'message',
    };
    setMessages([...messages, newMessage]);
    setInputMessage('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Agent Chat</h2>
        <select
          value={selectedAgent || ''}
          onChange={(e) => setSelectedAgent(e.target.value || null)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
        >
          <option value="">All Agents</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.emoji} {agent.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 bg-gray-800/50 rounded-lg border border-gray-700 p-4 space-y-4 overflow-y-auto mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.type === 'system' ? 'justify-center' : ''}`}
          >
            {msg.type !== 'system' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                {msg.agentEmoji}
              </div>
            )}
            <div className={msg.type === 'system' ? 'bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2' : 'flex-1'}>
              {msg.type !== 'system' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white text-sm">{msg.agentName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
              <p className={msg.type === 'system' ? 'text-yellow-400 text-sm' : 'text-gray-300 text-sm'}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Send a message to agents..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={handleSendMessage}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
