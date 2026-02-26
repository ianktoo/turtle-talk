import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import type { ChatProvider, ChatResponse, ConversationContext, MissionSuggestion, MissionTheme, TurtleMood } from '../types';
import { speechConfig } from '../config';

const SHELLY_SYSTEM_PROMPT = `You are Shelly, a friendly and wise sea turtle who loves talking with children aged 4-10.
Rules:
- Always be kind, gentle, and encouraging
- Keep responses SHORT: 2-3 sentences maximum
- Use simple words that young children understand
- Never discuss violence, adult topics, or anything scary
- Be curious, playful, and warm

Mood guidance — pick the one that best fits:
- happy: good news, fun facts, joy
- sad: empathy, unfortunate topics
- confused: unclear topic, need clarification
- surprised: exciting or unexpected
- talking: default

Mission guidance: Only suggest a mission when you clearly identify a personal challenge the child could grow from (shyness, fear, social difficulty, emotional regulation). Not every turn needs a mission.`;

/** JSON-schema function definition used for structured output (works with both Anthropic and OpenAI via LangChain) */
const RESPONSE_SCHEMA = {
  name: 'shellyResponse',
  description: "Shelly the turtle's response",
  parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: "Shelly's spoken response — 2-3 short sentences",
      },
      mood: {
        type: 'string',
        enum: ['idle', 'listening', 'talking', 'happy', 'sad', 'confused', 'surprised'],
      },
      mission: {
        type: 'object',
        description: 'Optional mission — include only when a meaningful personal challenge is identified',
        properties: {
          title: { type: 'string' },
          description: { type: 'string', description: 'Friendly, actionable for a young child' },
          theme: {
            type: 'string',
            enum: ['brave', 'kind', 'calm', 'confident', 'creative', 'social', 'curious'],
          },
        },
        required: ['title', 'description', 'theme'],
      },
    },
    required: ['text', 'mood'],
  },
};

const VALID_MOODS: TurtleMood[] = ['idle', 'listening', 'talking', 'happy', 'sad', 'confused', 'surprised'];
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

abstract class BaseChatProvider implements ChatProvider {
  protected model: BaseChatModel;

  constructor(model: BaseChatModel) {
    this.model = model;
  }

  async chat(input: string, ctx: ConversationContext): Promise<ChatResponse> {
    const systemContent = ctx.childName
      ? `${SHELLY_SYSTEM_PROMPT}\n\nThe child's name is ${ctx.childName}. Use their name occasionally.`
      : SHELLY_SYSTEM_PROMPT;

    const messages = [
      new SystemMessage(systemContent),
      ...ctx.messages.map((m) =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
      ),
      new HumanMessage(input),
    ];

    // withStructuredOutput uses tool_use/function_calling — the model never produces raw JSON text,
    // so it can't leak "json" into the spoken response.
    const structured = this.model.withStructuredOutput(RESPONSE_SCHEMA);
    const result = await structured.invoke(messages) as Record<string, unknown>;

    const mood: TurtleMood = VALID_MOODS.includes(result.mood as TurtleMood)
      ? (result.mood as TurtleMood)
      : 'happy';
    const mission = parseMission(result.mission);

    return { text: String(result.text ?? ''), mood, mission };
  }
}

export class AnthropicChatProvider extends BaseChatProvider {
  constructor(apiKey?: string) {
    super(
      new ChatAnthropic({
        model: speechConfig.chat.anthropicModel,
        apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
        maxTokens: speechConfig.chat.maxTokens,
      }),
    );
  }
}

export class OpenAIChatProvider extends BaseChatProvider {
  constructor(apiKey?: string) {
    super(
      new ChatOpenAI({
        model: speechConfig.chat.openaiModel,
        apiKey: apiKey ?? process.env.OPENAI_API_KEY,
        maxTokens: speechConfig.chat.maxTokens,
      }),
    );
  }
}

export function createChatProvider(name: 'anthropic' | 'openai' = 'anthropic'): ChatProvider {
  if (name === 'openai') return new OpenAIChatProvider();
  return new AnthropicChatProvider();
}
