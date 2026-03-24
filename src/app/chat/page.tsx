'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Agent {
  id: number;
  slug: string;
  name: string;
  description: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  agent_slug: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export default function ChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();
    fetchConversations();
    // Check for agent param in URL
    const params = new URLSearchParams(window.location.search);
    const agentParam = params.get('agent');
    const convParam = params.get('conversation');
    
    if (agentParam) {
      setSelectedAgent(agentParam);
    }
    if (convParam) {
      loadConversation(convParam);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }

  async function fetchConversations() {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }

  async function loadConversation(conversationId: string) {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`);
      if (res.ok) {
        const conv = await res.json();
        setCurrentConversation(conv);
        setMessages(conv.messages || []);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }

  async function handleNewChat() {
    if (!selectedAgent) return;
    
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentSlug: selectedAgent }),
      });

      if (res.ok) {
        const conv = await res.json();
        setCurrentConversation(conv);
        setMessages([]);
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedAgent) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Add user message immediately
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // Create conversation if not exists
      let convId = currentConversation?.id;
      if (!convId) {
        const convRes = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentSlug: selectedAgent }),
        });
        if (convRes.ok) {
          const conv = await convRes.json();
          convId = conv.id;
          setCurrentConversation(conv);
          fetchConversations();
        }
      }

      if (!convId) {
        throw new Error('Failed to create conversation');
      }

      // Send message
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId: convId, 
          content: userMessage,
          role: 'user' 
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      // Poll for assistant response
      await pollForResponse(convId);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `Error: ${error}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  async function pollForResponse(conversationId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const res = await fetch(`/api/chat/conversations/${conversationId}`);
        if (res.ok) {
          const conv = await res.json();
          const latestMessages = conv.messages || [];
          
          if (latestMessages.length > messages.length) {
            // Check if there's a new assistant message
            const latestMsg = latestMessages[latestMessages.length - 1];
            if (latestMsg.role === 'assistant') {
              setMessages(latestMessages);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Poll error:', error);
      }

      attempts++;
    }

    // Timeout - add error message
    const timeoutMsg: Message = {
      id: 'timeout-' + Date.now(),
      role: 'assistant',
      content: 'Response timed out. The agent may be busy.',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, timeoutMsg]);
  }

  async function handleDeleteConversation(convId: string) {
    if (!confirm('Delete this conversation?')) return;
    
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (currentConversation?.id === convId) {
          setCurrentConversation(null);
          setMessages([]);
        }
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  return (
    <div className="chat-layout">
      {/* Sidebar - Conversations */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Chat</h2>
          <button onClick={handleNewChat} disabled={!selectedAgent} className="btn btn-small">
            + New
          </button>
        </div>

        <div className="agent-selector">
          <label>Select Agent</label>
          <select 
            value={selectedAgent} 
            onChange={e => {
              setSelectedAgent(e.target.value);
              setCurrentConversation(null);
              setMessages([]);
            }}
          >
            <option value="">Choose agent...</option>
            {agents.map(agent => (
              <option key={agent.slug} value={agent.slug}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div className="conversations-list">
          <h3>Conversations</h3>
          {isInitialLoading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : conversations.filter(c => !selectedAgent || c.agent_slug === selectedAgent).length === 0 ? (
            <div className="empty-state-small">
              <p>No conversations</p>
            </div>
          ) : (
            conversations
              .filter(c => !selectedAgent || c.agent_slug === selectedAgent)
              .map(conv => (
                <div 
                  key={conv.id} 
                  className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="conversation-info">
                    <div className="conversation-title">
                      {conv.title || `Chat with ${conv.agent_slug}`}
                    </div>
                    <div className="conversation-meta">
                      {new Date(conv.updated_at).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {currentConversation ? (
          <>
            <div className="chat-header">
              <div>
                <h2>{selectedAgent}</h2>
                <span className="conversation-id">ID: {currentConversation.id.slice(0, 8)}...</span>
              </div>
              <Link href={`/agents/${selectedAgent}`} className="btn btn-small">
                View Agent
              </Link>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <div className="empty-state-icon">💬</div>
                  <p>Start a conversation with {selectedAgent}</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`message message-${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{msg.content}</div>
                      <div className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="message message-assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="message-text loading-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="btn">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-full">
            <div className="empty-state-icon">💬</div>
            <h2>Select an Agent to Start Chatting</h2>
            <p>Choose an agent from the sidebar to begin a conversation</p>
            {selectedAgent && (
              <button onClick={handleNewChat} className="btn" style={{ marginTop: '1rem' }}>
                Start New Conversation
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
