'use client';

import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'agents', icon: '🤖', label: 'Agents' },
  { id: 'tasks', icon: '📋', label: 'Tasks' },
  { id: 'messages', icon: '💬', label: 'Messages' },
  { id: 'hiring', icon: '👥', label: 'Hiring' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'gateways', icon: '🔌', label: 'Gateways' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export function NavRail() {
  const { activePanel, setActivePanel, sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <nav
      className={cn(
        'bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-200',
        sidebarOpen ? 'w-48' : 'w-16'
      )}
    >
      {/* Logo/Toggle */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 text-white hover:text-blue-400 transition-colors w-full"
        >
          <span className="text-2xl">🎯</span>
          {sidebarOpen && (
            <span className="font-semibold text-sm">AI Startup</span>
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePanel(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
              activePanel === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {sidebarOpen && (
              <span className="text-sm">{item.label}</span>
            )}
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          {sidebarOpen && (
            <span className="text-xs text-gray-400">System Online</span>
          )}
        </div>
      </div>
    </nav>
  );
}
