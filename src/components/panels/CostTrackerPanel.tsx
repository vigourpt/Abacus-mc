'use client';

import { useState, useEffect } from 'react';

interface TokenUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requests: number;
}

interface DailyCost {
  date: string;
  cost: number;
}

export function CostTrackerPanel() {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    // Simulated token usage data
    const usage: TokenUsage[] = [
      { model: 'claude-3.5-sonnet', inputTokens: 1250000, outputTokens: 456000, cost: 12.45, requests: 1234 },
      { model: 'gpt-4-turbo', inputTokens: 890000, outputTokens: 234000, cost: 8.90, requests: 567 },
      { model: 'claude-3-opus', inputTokens: 125000, outputTokens: 45000, cost: 5.67, requests: 89 },
      { model: 'gpt-3.5-turbo', inputTokens: 2340000, outputTokens: 890000, cost: 3.21, requests: 2345 },
    ];
    setTokenUsage(usage);
    setTotalCost(usage.reduce((sum, u) => sum + u.cost, 0));

    // Last 7 days costs
    const costs: DailyCost[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      costs.push({
        date: date.toISOString().split('T')[0],
        cost: Math.random() * 10 + 5,
      });
    }
    setDailyCosts(costs);
  }, []);

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const maxDailyCost = Math.max(...dailyCosts.map(d => d.cost));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Cost Tracker</h2>
        <div className="text-right">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-green-400">${totalCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Cost Chart */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-4">Daily Spending (Last 7 Days)</h3>
        <div className="flex items-end gap-2 h-32">
          {dailyCosts.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
                style={{ height: `${(day.cost / maxDailyCost) * 100}%` }}
              />
              <span className="text-xs text-gray-500 mt-2">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-medium text-white">Token Usage by Model</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
              <th className="p-3">Model</th>
              <th className="p-3">Input Tokens</th>
              <th className="p-3">Output Tokens</th>
              <th className="p-3">Requests</th>
              <th className="p-3 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {tokenUsage.map((usage, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="p-3">
                  <span className="text-white font-medium">{usage.model}</span>
                </td>
                <td className="p-3 text-gray-400">{formatTokens(usage.inputTokens)}</td>
                <td className="p-3 text-gray-400">{formatTokens(usage.outputTokens)}</td>
                <td className="p-3 text-gray-400">{usage.requests.toLocaleString()}</td>
                <td className="p-3 text-right text-green-400 font-medium">${usage.cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
