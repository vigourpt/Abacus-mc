import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/db';
import { cookies } from 'next/headers';

const ADMIN_USER = process.env.ADMIN_USER || 'dan';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'abacus-mc-secret-key-change-me';

function createToken(): string {
  const payload = {
    user: ADMIN_USER,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    iat: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = Buffer.from(SESSION_SECRET).toString('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): boolean {
  try {
    const [encoded, sig] = token.split('.');
    if (Buffer.from(SESSION_SECRET).toString('base64url') !== sig) return false;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createToken();
    const cookieStore = await cookies();
    
    cookieStore.set('mc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    logActivity('user.login', `User ${username} logged in`, username);

    return NextResponse.json({ ok: true, user: username });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}