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
  // #region agent log
  fetch('http://127.0.0.1:7379/ingest/9dfc6de0-1d29-4c43-9b59-25a539942869',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'83bf97'},body:JSON.stringify({sessionId:'83bf97',location:'vapi/llm/route.ts:POST',message:'vapi/llm POST received',data:{},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
  let body: { messages?: OAIMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.info('[Shelly] vapi/llm: request received');

  // Extract per-call context from the injected system message (set via model.messages in VapiVoiceProvider)
  const systemMsg = (body.messages ?? []).find((m) => m.role === 'system');
  let meta: Record<string, unknown> = {};
  if (systemMsg) {
    try { meta = JSON.parse(systemMsg.content); } catch { /* ignore malformed */ }
  }

  // Strip system messages — only conversation turns go into history
  const rawMessages = (body.messages ?? []).filter((m) => m.role !== 'system');

  // Extract context fields
  const childName        = typeof meta.childName === 'string' ? meta.childName : undefined;
  const topics           = Array.isArray(meta.topics) ? (meta.topics as string[]) : [];
  const activeMission    = (meta.activeMission ?? null) as ConversationContext['activeMission'];
  const difficultyProfile = (['beginner', 'intermediate', 'confident'] as const)
    .includes(meta.difficultyProfile as 'beginner')
      ? meta.difficultyProfile as ConversationContext['difficultyProfile']
      : 'beginner';

  // Last user message is the one we respond to
  const lastUser = [...rawMessages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    console.info('[Shelly] vapi/llm: no user message, greeting');
    return openAIResponse("Hi there! I'm Shelly. What would you like to talk about? 🐢", [
      toolCall('reportMood', { mood: 'happy' }),
    ]);
  }

  // Build history (all prior turns, excluding the current user message)
  const history: Message[] = rawMessages
    .slice(0, rawMessages.lastIndexOf(lastUser))
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const context: ConversationContext = {
    messages: history,
    childName,
    topics,
    difficultyProfile,
    activeMission,
  };

  // --- Guardrail + LLM ---
  console.info('[Shelly] vapi/llm: guardrail input');
  const guardrail = new ChildSafeGuardrail();
  const inputCheck = await guardrail.checkInput(lastUser.content);

  if (!inputCheck.safe) {
    console.info('[Shelly] vapi/llm: guardrail blocked input');
    return openAIResponse(FALLBACK_TEXT, [toolCall('reportMood', { mood: 'confused' })]);
  }

  try {
    console.info('[Shelly] vapi/llm: chat start');
    const chat = createChatProvider(speechConfig.chat.provider);
    const response = await chat.chat(lastUser.content, context);
    console.info('[Shelly] vapi/llm: chat done');

    const outputCheck = await guardrail.checkOutput(response.text);
    const text = outputCheck.sanitized ?? response.text;

    const tools: ToolCall[] = [toolCall('reportMood', { mood: response.mood })];

    // Guard: LLM must not end the conversation before the child has sent at least 3 prior messages.
    // (history contains prior turns; the current turn is not yet in history)
    const priorUserCount = history.filter((m) => m.role === 'user').length;
    const canEnd = priorUserCount >= 3;

    if (canEnd && response.missionChoices?.length) {
      tools.push(toolCall('proposeMissions', { choices: response.missionChoices }));
    }
    if (canEnd && response.endConversation) {
      tools.push(toolCall('reportEndConversation', {}));
    }

    console.info('[Shelly] vapi/llm: returning tools', tools.map(t => t.function.name));
    return openAIResponse(text, tools);
  } catch (err) {
    console.info('[Shelly] vapi/llm: LLM error (returning fallback)');
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
