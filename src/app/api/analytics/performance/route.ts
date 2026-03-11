// API: Performance Metrics
import { NextResponse } from 'next/server';
import { getPerformanceMonitor } from '@/lib/performance-monitor';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAlerts = searchParams.get('alerts') === 'true';
    const alertLimit = parseInt(searchParams.get('alertLimit') || '20', 10);

    const monitor = getPerformanceMonitor();
    const stats = monitor.getStats();

    const response: any = {
      success: true,
      data: {
        performance: stats,
        summary: {
          requestsPerHour: stats.requests.total,
          avgLatencyMs: Math.round(stats.requests.avgDuration * 100) / 100,
          p95LatencyMs: Math.round(stats.requests.p95 * 100) / 100,
          errorRatePercent: Math.round(stats.requests.errorRate * 100) / 100,
          dbQueriesPerHour: stats.database.totalQueries,
          avgQueryTimeMs: Math.round(stats.database.avgQueryTime * 100) / 100,
          activeWebsockets: stats.websocket.activeConnections,
          agentUtilization: Math.round(stats.workload.agentUtilization * 100) / 100,
        },
      },
      timestamp: new Date().toISOString(),
    };

    if (includeAlerts) {
      response.data.alerts = monitor.getAlerts(alertLimit);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get performance metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve performance metrics' },
      { status: 500 }
    );
  }
}
