import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents, getAgentBySlug } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    // If slug is provided, return single agent with full content
    if (slug) {
      const agent = getAgentBySlug(slug);
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(agent);
    }

    // Otherwise return all agents (simplified)
    const agents = getAllAgents();
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
