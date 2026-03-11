'use client';

import { useState, useEffect } from 'react';

interface SecurityEvent {
  id: string;
  type: 'auth' | 'access' | 'scan' | 'config';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  timestamp: string;
  resolved: boolean;
}

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  resource: string;
  timestamp: string;
  ip: string;
}

export function SecurityPanel() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [securityScore, setSecurityScore] = useState(87);

  useEffect(() => {
    setEvents([
      {
        id: '1',
        type: 'scan',
        severity: 'low',
        message: 'Skill security scan complete',
        details: 'No issues found in 12 installed skills',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        resolved: true,
      },
      {
        id: '2',
        type: 'auth',
        severity: 'medium',
        message: 'Failed login attempts detected',
        details: '3 failed attempts from IP 192.168.1.100',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        resolved: false,
      },
      {
        id: '3',
        type: 'access',
        severity: 'high',
        message: 'Unusual API access pattern',
        details: 'Agent "test-agent" made 500 requests in 1 minute',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        resolved: true,
      },
    ]);

    setAuditLog([
      { id: '1', action: 'agent.create', user: 'admin', resource: 'marketing-agent', timestamp: new Date().toISOString(), ip: '127.0.0.1' },
      { id: '2', action: 'config.update', user: 'system', resource: 'rate-limits', timestamp: new Date(Date.now() - 1800000).toISOString(), ip: 'system' },
      { id: '3', action: 'skill.install', user: 'admin', resource: 'web-scraper', timestamp: new Date(Date.now() - 3600000).toISOString(), ip: '127.0.0.1' },
    ]);
  }, []);

  const severityColors: Record<string, string> = {
    low: 'text-blue-400 bg-blue-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    high: 'text-orange-400 bg-orange-400/10',
    critical: 'text-red-400 bg-red-400/10',
  };

  const typeIcons: Record<string, string> = {
    auth: '🔐',
    access: '🛡️',
    scan: '🔍',
    config: '⚙️',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Security</h2>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Run Security Scan
        </button>
      </div>

      {/* Security Score */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm text-gray-500 mb-1">Security Score</h3>
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-bold ${
                securityScore >= 80 ? 'text-green-400' : 
                securityScore >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {securityScore}
              </span>
              <span className="text-gray-400">/100</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-400">23</p>
              <p className="text-xs text-gray-500">Audit Events (24h)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">1</p>
              <p className="text-xs text-gray-500">Open Issues</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400">12</p>
              <p className="text-xs text-gray-500">Skills Scanned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Security Events</h3>
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-gray-800/50 border border-gray-700 rounded-lg p-3 ${event.resolved ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{typeIcons[event.type]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${severityColors[event.severity]}`}>
                      {event.severity}
                    </span>
                    <span className="text-white font-medium text-sm">{event.message}</span>
                    {event.resolved && <span className="text-green-400 text-xs">✓ Resolved</span>}
                  </div>
                  <p className="text-sm text-gray-400">{event.details}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Audit Log</h3>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                <th className="p-3">Action</th>
                <th className="p-3">User</th>
                <th className="p-3">Resource</th>
                <th className="p-3">IP</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3 text-cyan-400 font-mono">{entry.action}</td>
                  <td className="p-3 text-white">{entry.user}</td>
                  <td className="p-3 text-gray-400">{entry.resource}</td>
                  <td className="p-3 text-gray-500 font-mono">{entry.ip}</td>
                  <td className="p-3 text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
