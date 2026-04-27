import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mc_session')?.value;
    
    if (token) {
      try {
        const [encoded] = token.split('.');
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
        logActivity('user.logout', `User ${payload.user} logged out`, payload.user);
      } catch {}
    }

    cookieStore.delete('mc_session');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Logout failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}