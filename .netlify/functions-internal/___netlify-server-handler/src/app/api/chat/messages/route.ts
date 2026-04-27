import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createMessage, getConversationById, getAgentBySlug, getMessagesByConversation } from '@/lib/db';
import { getGatewayClient } from '@/lib/openclaw-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, content, role = 'user' } = body;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'Missing conversationId or content' },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const conversation = getConversationById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Create user message
    const userMsgId = uuidv4();
    createMessage(userMsgId, conversationId, 'user', content);

    // Get agent and prepare response
    const agent = getAgentBySlug(conversation.agent_slug);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get conversation history for context
    const allMessages = getMessagesByConversation(conversationId);
    const historyContext = allMessages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Extract system prompt from agent content
    const systemPrompt = extractSystemPrompt(agent.content);

    // Start async response generation
    generateAssistantResponse(
      conversationId,
      agent.content,
      content,
      historyContext,
      systemPrompt
    ).catch(err => {
      console.error('Failed to generate response:', err);
      // Create error message
      const errorMsgId = uuidv4();
      createMessage(errorMsgId, conversationId, 'assistant', `Error: ${err.message}`);
    });

    return NextResponse.json({ success: true, messageId: userMsgId });
  } catch (error) {
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAssistantResponse(
  conversationId: string,
  agentContent: string,
  latestUserMessage: string,
  historyContext: string,
  systemPrompt?: string
): Promise<void> {
  try {
    const client = getGatewayClient();
    
    // Build prompt with agent context
    let fullPrompt = '';
    if (systemPrompt) {
      fullPrompt = `## Agent Instructions\n${systemPrompt}\n\n## Conversation History\n${historyContext}\n\n## Current Message\nuser: ${latestUserMessage}\n\nassistant:`;
    } else {
      fullPrompt = `## Agent Persona\n${agentContent}\n\n## Conversation History\n${historyContext}\n\n## Current Message\nuser: ${latestUserMessage}\n\nassistant:`;
    }

    // Execute via gateway — invoke returns immediately with session/task IDs
    // The actual result comes back via WebSocket events or can be awaited
    const invokeResult = await client.agentInvoke(
      latestUserMessage,
      undefined,
      fullPrompt
    );

    // For now, store the invoke acknowledgment as the assistant message
    // In a full implementation, you'd subscribe to task.complete events
    // and store the actual result when it arrives
    const assistantMsgId = uuidv4();
    createMessage(
      assistantMsgId,
      conversationId,
      'assistant',
      `[Task dispatched to gateway — session: ${invokeResult.sessionId}, taskId: ${invokeResult.taskId}]`
    );
  } catch (error) {
    console.error('Assistant response error:', error);
    const errorMsgId = uuidv4();
    createMessage(
      errorMsgId,
      conversationId,
      'assistant',
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function extractSystemPrompt(agentContent: string): string {
  // Remove common frontmatter
  let content = agentContent.replace(/^---[\s\S]*?---\n/, '');

  // If there's a # Role or # Persona section, extract everything before it as system prompt
  const roleMatch = content.match(/^#\s+(?:Role|Persona|Agent)[\s\S]*?$/mi);

  if (roleMatch && roleMatch.index && roleMatch.index > 0) {
    return content.slice(0, roleMatch.index).trim();
  }

  // Otherwise return the whole content as the system prompt
  return content.trim();
}
