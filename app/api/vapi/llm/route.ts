/**
 * POST /api/vapi/llm
 *
 * OpenAI-compatible chat completion endpoint consumed by Vapi's custom-llm model.
 * Vapi sends the conversation as messages[], we run our guardrails + LLM,
 * and return a completion response.  Mood and missions are included as tool_calls
 * so Vapi fires them as function-call events on the client (VapiVoiceProvider).
 */
import { NextRequest } from 'next/server';
import { createChatProvider } from '@/lib/speech/providers/chat';
import { ChildSafeGuardrail } from '@/lib/speech/guardrails/ChildSafeGuardrail';
import { speechConfig } from '@/lib/speech/config';
import type { ConversationContext, Message } from '@/lib/speech/types';

export const maxDuration = 60;

const FALLBACK_TEXT = "Oh my! Let's talk about something else. What's your favourite animal?";

type OAIMessage = { role: string; content: string };
type ToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export async function POST(req: NextRequest) {
  let body: { messages?: OAIMessage[]; metadata?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawMessages = (body.messages ?? []).filter((m) => m.role !== 'system');
  const meta = body.metadata ?? {};

  // Extract context from Vapi metadata (passed via model.metadata in VapiVoiceProvider)
  const childName = typeof meta.childName === 'string' ? meta.childName : undefined;
  const topics    = Array.isArray(meta.topics) ? (meta.topics as string[]) : [];
  const missionDeclined = meta.missionDeclined === true;

  // Last user message is the one we respond to
  const lastUser = [...rawMessages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    return openAIResponse("Hi there! I'm Shelly. What would you like to talk about? 🐢", [
      toolCall('reportMood', { mood: 'happy' }),
    ]);
  }

  // Build history (all prior turns, excluding the current user message)
  const history: Message[] = rawMessages
    .slice(0, rawMessages.lastIndexOf(lastUser))
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const completedExchanges = Math.floor(history.length / 2);
  const context: ConversationContext = {
    messages: history,
    childName,
    topics,
    offerMission: !missionDeclined && completedExchanges >= 2 && Math.random() < 0.3,
    missionDeclined,
  };

  // --- Guardrail + LLM ---
  const guardrail = new ChildSafeGuardrail();
  const inputCheck = await guardrail.checkInput(lastUser.content);

  if (!inputCheck.safe) {
    return openAIResponse(FALLBACK_TEXT, [toolCall('reportMood', { mood: 'confused' })]);
  }

  try {
    const chat = createChatProvider(speechConfig.chat.provider);
    const response = await chat.chat(lastUser.content, context);

    const outputCheck = await guardrail.checkOutput(response.text);
    const text = outputCheck.sanitized ?? response.text;

    const tools: ToolCall[] = [toolCall('reportMood', { mood: response.mood })];

    if (response.missionChoices?.length) {
      tools.push(toolCall('proposeMissions', { choices: response.missionChoices }));
    }
    if (response.endConversation) {
      tools.push(toolCall('reportEndConversation', {}));
    }

    return openAIResponse(text, tools);
  } catch (err) {
    console.error('[/api/vapi/llm] LLM error:', err);
    return openAIResponse(
      "Oops! My brain got a little confused. Can you say that again?",
      [toolCall('reportMood', { mood: 'confused' })],
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toolCall(name: string, args: Record<string, unknown>): ToolCall {
  return {
    id: `call_${name}_${Date.now()}`,
    type: 'function',
    function: { name, arguments: JSON.stringify(args) },
  };
}

function openAIResponse(content: string, tool_calls: ToolCall[]) {
  return Response.json({
    id: `chatcmpl-vapi-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'shelly',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content, tool_calls },
        finish_reason: 'stop',
      },
    ],
  });
}
