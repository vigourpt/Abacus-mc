'use client';

import { useState, useEffect } from 'react';

interface ActivityEntry {
  id: number;
  event_type: string;
  agent_slug: string | null;
  task_id: string | null;
  message: string;
  metadata: string | null;
  created_at: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchActivity();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchActivity() {
    try {
      const res = await fetch('/api/activity');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityEntry[]>);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.event_type === filter);

  // Get unique event types
  const eventTypes = [...new Set(activities.map(a => a.event_type))];

  function getEventIcon(eventType: string) {
    switch (eventType.toLowerCase()) {
      case 'task_created': return '➕';
      case 'task_completed': return '✅';
      case 'task_failed': return '❌';
      case 'agent_loaded': return '🤖';
      case 'channel_connected': return '📡';
      case 'channel_message': return '💬';
      default: return '📋';
    }
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString();
  }

  return (
    <div className="container">
      <h1>Activity</h1>

      {eventTypes.length > 1 && (
        <div className="filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({activities.length})
          </button>
          {eventTypes.map(type => (
            <button
              key={type}
              className={`filter-btn ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {getEventIcon(type)} {type.replace(/_/g, ' ')} ({activities.filter(a => a.event_type === type).length})
            </button>
          ))}
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filteredActivities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No activity yet</p>
          </div>
        ) : (
          <div>
            {Object.entries(
              filter === 'all' 
                ? groupedActivities 
                : { 'Filtered': filteredActivities }
            ).map(([date, items]) => (
              <div key={date}>
                <div style={{ 
                  padding: '0.5rem 0', 
                  marginBottom: '0.5rem',
                  fontWeight: 600, 
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {date}
                </div>
                {items.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getEventIcon(activity.event_type)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-message">
                        {activity.message}
                        {activity.agent_slug && (
                          <span className="badge badge-blue" style={{ marginLeft: '0.5rem' }}>
                            {activity.agent_slug}
                          </span>
                        )}
                      </div>
                      <div className="activity-time">
                        {formatTime(activity.created_at)}
                        {activity.task_id && (
                          <span style={{ marginLeft: '1rem', fontFamily: 'monospace' }}>
                            Task: {activity.task_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
