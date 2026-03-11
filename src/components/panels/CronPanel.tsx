'use client';

import { useState, useEffect } from 'react';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  lastRun: string;
  status: 'active' | 'paused' | 'error';
  taskTemplate: string;
  assignedAgent: string;
  runsCompleted: number;
}

export function CronPanel() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);

  useEffect(() => {
    setCronJobs([
      {
        id: '1',
        name: 'Daily Report Generation',
        schedule: '0 9 * * *',
        nextRun: new Date(Date.now() + 43200000).toISOString(),
        lastRun: new Date(Date.now() - 43200000).toISOString(),
        status: 'active',
        taskTemplate: 'Generate daily performance report',
        assignedAgent: 'Operations Agent',
        runsCompleted: 45,
      },
      {
        id: '2',
        name: 'Weekly Analytics Summary',
        schedule: '0 10 * * 1',
        nextRun: new Date(Date.now() + 172800000).toISOString(),
        lastRun: new Date(Date.now() - 518400000).toISOString(),
        status: 'active',
        taskTemplate: 'Compile weekly analytics',
        assignedAgent: 'Marketing Agent',
        runsCompleted: 12,
      },
      {
        id: '3',
        name: 'Database Backup',
        schedule: '0 2 * * *',
        nextRun: new Date(Date.now() + 28800000).toISOString(),
        lastRun: new Date(Date.now() - 57600000).toISOString(),
        status: 'active',
        taskTemplate: 'Backup all databases',
        assignedAgent: 'Developer Agent',
        runsCompleted: 90,
      },
      {
        id: '4',
        name: 'Social Media Posting',
        schedule: '0 14,18 * * *',
        nextRun: new Date(Date.now() + 14400000).toISOString(),
        lastRun: new Date(Date.now() - 21600000).toISOString(),
        status: 'paused',
        taskTemplate: 'Post scheduled content',
        assignedAgent: 'Content Agent',
        runsCompleted: 156,
      },
    ]);
  }, []);

  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    paused: 'text-yellow-400 bg-yellow-400/10',
    error: 'text-red-400 bg-red-400/10',
  };

  const toggleStatus = (id: string) => {
    setCronJobs(cronJobs.map(job => 
      job.id === id 
        ? { ...job, status: job.status === 'active' ? 'paused' : 'active' }
        : job
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Scheduled Tasks (Cron)</h2>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + New Schedule
        </button>
      </div>

      <div className="space-y-3">
        {cronJobs.map((job) => (
          <div
            key={job.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <h3 className="font-medium text-white">{job.name}</h3>
                  <code className="text-xs text-cyan-400 bg-gray-900 px-2 py-0.5 rounded">
                    {job.schedule}
                  </code>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs ${statusColors[job.status]}`}>
                  {job.status}
                </span>
                <button
                  onClick={() => toggleStatus(job.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {job.status === 'active' ? '⏸️' : '▶️'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Next Run</p>
                <p className="text-white">{new Date(job.nextRun).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Last Run</p>
                <p className="text-white">{new Date(job.lastRun).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Assigned Agent</p>
                <p className="text-cyan-400">{job.assignedAgent}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Runs</p>
                <p className="text-white">{job.runsCompleted}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500">Task Template</p>
              <p className="text-sm text-gray-300">{job.taskTemplate}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
