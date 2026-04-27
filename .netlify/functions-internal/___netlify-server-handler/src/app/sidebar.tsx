'use client';

import Link from 'next/link';
import { useTheme } from './providers';

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Mission Control</h1>
      </div>
      <nav className="sidebar-nav">
        <Link href="/" className="nav-link">
          <span className="nav-icon">📊</span>
          Dashboard
        </Link>
        <Link href="/agents" className="nav-link">
          <span className="nav-icon">🤖</span>
          Agents
        </Link>
        <Link href="/tasks" className="nav-link">
          <span className="nav-icon">✓</span>
          Tasks
        </Link>
        <Link href="/chat" className="nav-link">
          <span className="nav-icon">💬</span>
          Chat
        </Link>
        <Link href="/channels" className="nav-link">
          <span className="nav-icon">📡</span>
          Channels
        </Link>
        <Link href="/analytics" className="nav-link">
          <span className="nav-icon">📈</span>
          Analytics
        </Link>
        <Link href="/activity" className="nav-link">
          <span className="nav-icon">📋</span>
          Activity
        </Link>
      </nav>
      <div className="sidebar-footer">
        <button 
          onClick={toggleTheme}
          className="theme-toggle"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </aside>
  );
}
