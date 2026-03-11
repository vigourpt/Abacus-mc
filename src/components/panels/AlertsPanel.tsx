'use client';

import { useState, useEffect } from 'react';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    setAlerts([
      {
        id: '1',
        title: 'High Memory Usage',
        message: 'Worker node worker-02 is using 92% memory',
        severity: 'warning',
        source: 'system-monitor',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        acknowledged: false,
      },
      {
        id: '2',
        title: 'API Rate Limit Approaching',
        message: 'OpenAI API usage at 85% of monthly limit',
        severity: 'info',
        source: 'cost-tracker',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: true,
      },
      {
        id: '3',
        title: 'Failed Task Retry',
        message: 'Task "Deploy to staging" failed after 3 retries',
        severity: 'error',
        source: 'task-scheduler',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        acknowledged: false,
      },
      {
        id: '4',
        title: 'Security Scan Complete',
        message: 'No vulnerabilities found in latest skill scan',
        severity: 'info',
        source: 'security-scanner',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        acknowledged: true,
        resolvedAt: new Date(Date.now() - 82800000).toISOString(),
      },
    ]);
  }, []);

  const severityColors: Record<string, string> = {
    info: 'text-blue-400 bg-blue-400/10 border-l-blue-400',
    warning: 'text-yellow-400 bg-yellow-400/10 border-l-yellow-400',
    error: 'text-red-400 bg-red-400/10 border-l-red-400',
    critical: 'text-red-500 bg-red-500/20 border-l-red-500',
  };

  const severityIcons: Record<string, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  };

  const filtered = filter ? alerts.filter(a => a.severity === filter) : alerts;

  const handleAcknowledge = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">Alerts</h2>
          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm">
            {alerts.filter(a => !a.acknowledged).length} Unacknowledged
          </span>
        </div>
        <div className="flex gap-2">
          {['all', 'critical', 'error', 'warning', 'info'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s === 'all' ? null : s)}
              className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                (s === 'all' && !filter) || filter === s
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 rounded-r-lg p-4 ${severityColors[alert.severity]} ${alert.acknowledged ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-xl">{severityIcons[alert.severity]}</span>
                <div>
                  <h3 className="font-medium text-white">{alert.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>Source: {alert.source}</span>
                    <span>•</span>
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {!alert.acknowledged && (
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                >
                  Acknowledge
                </button>
              )}
              {alert.acknowledged && alert.resolvedAt && (
                <span className="text-green-400 text-xs">Resolved</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
