'use client';

import { useState, useEffect } from 'react';

interface HiringRequest {
  id: string;
  role: string;
  division: string;
  suggestedBy: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'hired';
  createdAt: string;
  skills: string[];
}

export function HiringPanel() {
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    setRequests([
      {
        id: '1',
        role: 'Senior Frontend Developer',
        division: 'engineering',
        suggestedBy: 'Task Planner',
        reason: 'Need expertise for React/Next.js UI improvements',
        priority: 'high',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
      },
      {
        id: '2',
        role: 'SEO Specialist',
        division: 'marketing',
        suggestedBy: 'Marketing Agent',
        reason: 'No current agent has SEO expertise',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        skills: ['SEO', 'Content Strategy', 'Analytics', 'Link Building'],
      },
      {
        id: '3',
        role: 'DevOps Engineer',
        division: 'operations',
        suggestedBy: 'Developer Agent',
        reason: 'CI/CD pipeline needs dedicated management',
        priority: 'high',
        status: 'approved',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
      },
    ]);
  }, []);

  const priorityColors: Record<string, string> = {
    low: 'text-gray-400 bg-gray-400/10',
    medium: 'text-blue-400 bg-blue-400/10',
    high: 'text-orange-400 bg-orange-400/10',
    critical: 'text-red-400 bg-red-400/10',
  };

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    approved: 'text-green-400 bg-green-400/10',
    rejected: 'text-red-400 bg-red-400/10',
    hired: 'text-cyan-400 bg-cyan-400/10',
  };

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);

  const handleApprove = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  const handleHire = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'hired' } : r));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">Agent Hiring</h2>
          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-sm">
            {requests.filter(r => r.status === 'pending').length} Pending
          </span>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'hired', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                filter === f
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((request) => (
          <div
            key={request.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white">{request.role}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[request.priority]}`}>
                    {request.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColors[request.status]}`}>
                    {request.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Division: {request.division}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-3">{request.reason}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {request.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <span className="text-xs text-gray-500">
                Suggested by: <span className="text-cyan-400">{request.suggestedBy}</span>
              </span>
              <div className="flex gap-2">
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-sm transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded text-sm transition-colors"
                    >
                      Approve
                    </button>
                  </>
                )}
                {request.status === 'approved' && (
                  <button
                    onClick={() => handleHire(request.id)}
                    className="px-3 py-1 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded text-sm transition-colors"
                  >
                    Create Agent
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
