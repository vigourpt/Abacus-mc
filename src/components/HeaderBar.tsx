'use client';

import { useState, useEffect } from 'react';

interface OpenClawStatus {
  gateway: {
    connected: boolean;
  };
}

export default function HeaderBar() {
  const [openclawStatus, setOpenClawStatus] = useState<OpenClawStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/openclaw/status');
        if (res.ok) {
          const data = await res.json();
          setOpenClawStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch gateway status:', error);
        setOpenClawStatus({ gateway: { connected: false } });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = openclawStatus?.gateway?.connected ?? false;

  return (
    <div className="header-bar">
      <div className="header-left">
        <span className="header-title">Mission Control</span>
      </div>
      <div className="header-right">
        <div className={`gateway-badge ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="gateway-dot"></span>
          <span className="gateway-text">
            {isLoading ? 'Checking...' : isConnected ? 'Gateway Connected' : 'Gateway Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
}
