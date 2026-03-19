export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import * as os from 'os';

export async function GET() {
  try {
    const agentCount = (db.prepare('SELECT COUNT(*) as count FROM agents').get() as any).count;
    const taskCount = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;
    const activeTaskCount = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get() as any).count;
    const activityCount = (db.prepare('SELECT COUNT(*) as count FROM activity_log').get() as any).count;

    const cpuUsage = os.loadavg()[0];
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    return NextResponse.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        agents: agentCount,
        tasks: taskCount,
        activeTasks: activeTaskCount,
        activities: activityCount,
      },
      system: {
        cpuLoad: Math.round(cpuUsage * 100) / 100,
        memoryUsagePercent: memoryUsage,
        totalMemoryMB: Math.round(totalMem / 1024 / 1024),
        freeMemoryMB: Math.round(freeMem / 1024 / 1024),
        platform: os.platform(),
        nodeVersion: process.version,
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ status: 'unhealthy', error: String(error) }, { status: 500 });
  }
}
