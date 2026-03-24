import { NextRequest, NextResponse } from 'next/server';
import { getConversationById, getMessagesByConversation, deleteConversation } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = getConversationById(id);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const messages = getMessagesByConversation(id);

    return NextResponse.json({
      ...conversation,
      messages,
    });
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = getConversationById(id);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    deleteConversation(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
