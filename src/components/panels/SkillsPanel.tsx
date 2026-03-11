'use client';

import { useState, useEffect } from 'react';

interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  installed: boolean;
  securityScore: number;
  downloads: number;
}

export function SkillsPanel() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulated skills registry
    setSkills([
      {
        id: '1',
        name: 'web-scraper',
        description: 'Advanced web scraping and data extraction',
        version: '2.1.0',
        author: 'ClawdHub',
        category: 'data',
        installed: true,
        securityScore: 95,
        downloads: 12500,
      },
      {
        id: '2',
        name: 'code-analyzer',
        description: 'Static code analysis and security scanning',
        version: '1.5.2',
        author: 'skills.sh',
        category: 'development',
        installed: true,
        securityScore: 98,
        downloads: 8900,
      },
      {
        id: '3',
        name: 'email-composer',
        description: 'AI-powered email drafting and templates',
        version: '3.0.1',
        author: 'ClawdHub',
        category: 'communication',
        installed: false,
        securityScore: 92,
        downloads: 15600,
      },
      {
        id: '4',
        name: 'database-manager',
        description: 'Database operations and query optimization',
        version: '1.2.0',
        author: 'skills.sh',
        category: 'data',
        installed: false,
        securityScore: 88,
        downloads: 5400,
      },
    ]);
  }, []);

  const filteredSkills = skills.filter((skill) => {
    if (filter === 'installed') return skill.installed;
    if (filter === 'available') return !skill.installed;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Skills Hub</h2>
        <div className="flex gap-2">
          {['all', 'installed', 'available'].map((f) => (
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

      <div className="grid grid-cols-2 gap-4">
        {filteredSkills.map((skill) => (
          <div
            key={skill.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-white">{skill.name}</h3>
                <p className="text-xs text-gray-500">v{skill.version} by {skill.author}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                skill.installed
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {skill.installed ? 'Installed' : 'Available'}
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-3">{skill.description}</p>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-gray-500">
                  🔒 Security: {skill.securityScore}%
                </span>
                <span className="text-gray-500">
                  ⬇️ {skill.downloads.toLocaleString()}
                </span>
              </div>
              <button
                className={`px-3 py-1 rounded transition-colors ${
                  skill.installed
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                }`}
              >
                {skill.installed ? 'Uninstall' : 'Install'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
