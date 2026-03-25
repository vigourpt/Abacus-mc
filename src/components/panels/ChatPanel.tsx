'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

interface Message {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  content: string;
  timestamp: string;
  type: 'message' | 'system' | 'task' | 'user';
}

export function ChatPanel() {
  const { agents } = useAppStore();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from activity API
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch('/api/activity');
        if (res.ok) {
          const activity = await res.json();
          const convertedMessages: Message[] = activity.map((item: any) => ({
            id: item.id,
            agentId: item.agentId || 'system',
            agentName: item.agentId ? getAgentName(item.agentId) : 'System',
            agentEmoji: item.agentId ? getAgentEmoji(item.agentId) : '🔔',
            content: item.message,
            timestamp: item.createdAt,
            type: item.type === 'task_processed' ? 'task' : 'system',
          }));
          setMessages(convertedMessages.reverse());
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }
    loadMessages();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [agents]);

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || 'Agent';
  };

  const getAgentEmoji = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.emoji || '🤖';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;
    
    setIsSending(true);
    
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      agentId: 'user',
      agentName: 'You',
      agentEmoji: '👤',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      type: 'user',
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Send via OpenClaw API
      const res = await fetch('/api/openclaw/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'mission-control-test',
          content: inputMessage,
          format: 'markdown',
        }),
      });
      
      if (!res.ok) {
        console.error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
    
    setInputMessage('');
    setIsSending(false);
  };

  // Filter messages by selected agent
  const filteredMessages = selectedAgent
    ? messages.filter(m => m.agentId === selectedAgent || m.type === 'user')
    : messages;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-white">Agent Chat</h2>
        <select
          value={selectedAgent || ''}
          onChange={(e) => setSelectedAgent(e.target.value || null)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white max-w-[180px]"
        >
          <option value="">All Messages</option>
          {agents.slice(0, 10).map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.emoji} {agent.name.slice(0, 15)}
            </option>
          ))}
        </select>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-gray-800/50 rounded-lg border border-gray-700 p-4 space-y-3 overflow-y-auto min-h-0 mb-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm">Send a message below to start chatting</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.type === 'system' || msg.type === 'task' ? 'justify-center' : msg.type === 'user' ? 'justify-end' : ''}`}
            >
              {msg.type === 'user' ? (
                <div className="bg-cyan-600/20 border border-cyan-500/30 rounded-lg px-3 py-2 max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-cyan-400 text-sm">{msg.agentName}</span>
                  </div>
                  <p className="text-gray-200 text-sm">{msg.content}</p>
                </div>
              ) : msg.type === 'system' || msg.type === 'task' ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2">
                  <p className="text-yellow-400 text-xs">{msg.content}</p>
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {msg.agentEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{msg.agentName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm break-words">{msg.content}</p>
                  </div>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Message agents..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          disabled={isSending}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isSending}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
        >
          {isSending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
