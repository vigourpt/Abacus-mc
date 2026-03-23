import { NextResponse } from 'next/server';
import { getAllAgents } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agents = getAllAgents();
    
    // Return simplified agent list (without full content)
    const simplified = agents.map(({ id, slug, name, description, created_at }) => ({
      id,
      slug,
      name,
      description,
      created_at,
    }));

    return NextResponse.json(simplified);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
