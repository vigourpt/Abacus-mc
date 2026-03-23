'use client';

import { useState, useEffect } from 'react';

interface Channel {
  id: string;
  name: string;
  type: string;
  status: string;
  connected: boolean;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  async function fetchChannels() {
    try {
      const res = await fetch('/api/openclaw/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChannel || !message.trim()) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/openclaw/channels/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: selectedChannel, message }),
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult('Message sent successfully!');
        setMessage('');
      } else {
        setSendResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setSendResult(`Error: ${error}`);
    } finally {
      setIsSending(false);
    }
  }

  function getChannelIcon(type: string) {
    if (!type) return '📱';
    switch (type.toLowerCase()) {
      case 'telegram': return '✈️';
      case 'whatsapp': return '💬';
      case 'discord': return '🎮';
      case 'slack': return '💼';
      default: return '📱';
    }
  }

  return (
    <div className="container">
      <h1>Channels</h1>

      <div className="grid grid-2">
        {isLoading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : channels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <p>No channels configured</p>
          </div>
        ) : (
          channels.map(channel => (
            <div 
              key={channel.id} 
              className={`channel-card ${selectedChannel === channel.id ? 'selected' : ''}`}
              onClick={() => setSelectedChannel(channel.id)}
              style={{ 
                cursor: 'pointer',
                borderColor: selectedChannel === channel.id ? 'var(--accent)' : undefined 
              }}
            >
              <div className="channel-icon">
                {getChannelIcon(channel.type)}
              </div>
              <div className="channel-info">
                <div className="channel-name">{channel.name}</div>
                <div className={`channel-status ${channel.connected ? 'connected' : ''}`}>
                  {channel.connected ? '● Connected' : '○ Disconnected'}
                </div>
              </div>
              <span className="badge badge-gray">{channel.type}</span>
            </div>
          ))
        )}
      </div>

      {selectedChannel && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3>Send Message</h3>
          <form onSubmit={handleSendMessage}>
            <div className="form-group">
              <label>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={4}
                required
              />
            </div>
            <button type="submit" className="btn" disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
            {sendResult && (
              <p style={{ marginTop: '1rem', color: sendResult.startsWith('Error') ? 'var(--error)' : 'var(--success)' }}>
                {sendResult}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
