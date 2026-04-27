import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAllConversations, createConversation, getAgentBySlug } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const conversations = getAllConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentSlug, title } = body;

    if (!agentSlug) {
      return NextResponse.json(
        { error: 'Missing agentSlug' },
        { status: 400 }
      );
    }

    // Verify agent exists
    const agent = getAgentBySlug(agentSlug);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent '${agentSlug}' not found` },
        { status: 404 }
      );
    }

    const id = uuidv4();
    const conversationTitle = title || `Chat with ${agent.name}`;
    const conversation = createConversation(id, agentSlug, conversationTitle);

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
