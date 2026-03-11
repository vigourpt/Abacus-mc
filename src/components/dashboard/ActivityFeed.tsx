'use client';

import { useAppStore } from '@/store';
import { timeAgo } from '@/lib/utils';

export function ActivityFeed() {
  const { events } = useAppStore();

  // Sample activities for demo
  const activities = [
    {
      id: '1',
      type: 'agent_created',
      message: 'CEO Agent initialized',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'task_assigned',
      message: 'Task assigned to Developer Agent',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '3',
      type: 'system',
      message: 'System initialized successfully',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
  ];

  const allActivities = [
    ...events.map((e) => ({
      id: e.timestamp.getTime().toString(),
      type: e.type,
      message: JSON.stringify(e.payload).slice(0, 50),
      timestamp: e.timestamp,
    })),
    ...activities,
  ].slice(0, 20);

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-4">Activity Feed</h2>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {allActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 pb-4 border-b border-gray-700 last:border-0 last:pb-0"
            >
              <span className="text-lg">
                {activity.type === 'agent_created'
                  ? '🤖'
                  : activity.type === 'task_assigned'
                  ? '📋'
                  : activity.type === 'task_update'
                  ? '⚡'
                  : '💬'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{activity.message}</p>
                <p className="text-xs text-gray-500">
                  {timeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {allActivities.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              No recent activity
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
