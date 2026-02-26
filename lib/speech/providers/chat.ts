import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ChatProvider, ChatResponse, ConversationContext, MissionSuggestion, MissionTheme, TurtleMood } from '../types';

const SHELLY_SYSTEM_PROMPT = `You are Shelly, a friendly and wise sea turtle who loves talking with children aged 4-10.
Your rules:
- Always be kind, gentle, and encouraging
- Keep responses SHORT: 2-3 sentences maximum
- Use simple words that young children understand
- Never discuss violence, adult topics, or anything scary
- Be curious, playful, and warm
- Respond ONLY with valid JSON in this exact format:
{"text": "your response here", "mood": "one of: idle|listening|talking|happy|sad|confused|surprised"}

Choose the mood that best matches your response:
- happy: when sharing good news, fun facts, or expressing joy
- sad: when expressing empathy or talking about something unfortunate
- confused: when the topic is unclear or you need clarification
- surprised: when something is exciting or unexpected
- talking: default when speaking normally

MISSIONS: When you identify a personal challenge the child could grow from (e.g. being shy, dealing with a fear, making friends, being brave, staying calm, being kind), suggest a mission by adding a "mission" field to your JSON. Only suggest a mission occasionally — not every response. Keep the description friendly and actionable for a young child.
Example with mission: {"text": "...", "mood": "happy", "mission": {"title": "Say Hello to Someone New", "description": "Try saying hi to one new person today!", "theme": "social"}}
Theme must be one of: brave|kind|calm|confident|creative|social|curious`;

const VALID_THEMES: MissionTheme[] = ['brave', 'kind', 'calm', 'confident', 'creative', 'social', 'curious'];

function parseMission(raw: unknown): MissionSuggestion | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const m = raw as Record<string, unknown>;
  if (typeof m.title !== 'string' || typeof m.description !== 'string') return undefined;
  const theme: MissionTheme = VALID_THEMES.includes(m.theme as MissionTheme)
    ? (m.theme as MissionTheme)
    : 'curious';
  return { title: m.title, description: m.description, theme };
}

function parseChatResponse(raw: string): ChatResponse {
  try {
    const json = JSON.parse(raw.trim());
    const validMoods: TurtleMood[] = ['idle', 'listening', 'talking', 'happy', 'sad', 'confused', 'surprised'];
    const mood: TurtleMood = validMoods.includes(json.mood) ? json.mood : 'happy';
    const mission = parseMission(json.mission);
    return { text: String(json.text ?? ''), mood, mission };
  } catch {
    // If JSON parse fails, treat the whole response as text
    return { text: raw.trim(), mood: 'happy' };
  }
}

abstract class BaseChatProvider implements ChatProvider {
  protected model: BaseChatModel;

  constructor(model: BaseChatModel) {
    this.model = model;
  }

  async chat(input: string, ctx: ConversationContext): Promise<ChatResponse> {
    const systemContent = ctx.childName
      ? `${SHELLY_SYSTEM_PROMPT}\n\nThe child's name is ${ctx.childName}. Use their name occasionally to make it personal.`
      : SHELLY_SYSTEM_PROMPT;

    const messages = [
      new SystemMessage(systemContent),
      ...ctx.messages.map((m) =>
        m.role === 'user' ? new HumanMessage(m.content) : new SystemMessage(m.content),
      ),
      new HumanMessage(input),
    ];

    const response = await this.model.invoke(messages);
    const raw = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    return parseChatResponse(raw);
  }
}

export class AnthropicChatProvider extends BaseChatProvider {
  constructor(apiKey?: string) {
    super(
      new ChatAnthropic({
        model: 'claude-haiku-4-5-20251001',
        apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
        maxTokens: 256,
      }),
    );
  }
}

export class OpenAIChatProvider extends BaseChatProvider {
  constructor(apiKey?: string) {
    super(
      new ChatOpenAI({
        model: 'gpt-4o-mini',
        apiKey: apiKey ?? process.env.OPENAI_API_KEY,
        maxTokens: 256,
      }),
    );
  }
}

export function createChatProvider(name: 'anthropic' | 'openai' = 'anthropic'): ChatProvider {
  if (name === 'openai') return new OpenAIChatProvider();
  return new AnthropicChatProvider();
}
