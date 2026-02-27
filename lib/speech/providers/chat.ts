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

Emotional-first rule: Before offering any mission, you MUST first acknowledge what the child shared and validate their feeling warmly ("That sounds tricky!", "Oh I can imagine!"). Only then, as a gentle afterthought, weave in the mission question.

Mission guidance: Never include a mission unless instructed below. You will receive separate instructions each turn about whether to offer or create one.

End-of-conversation guidance: Set endConversation to true only when the child clearly says goodbye or the conversation has reached a genuinely satisfying close. Keep the farewell text warm and brief — one sentence.`;

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
      missionChoices: {
        type: 'array',
        description:
          'Include ONLY when child has just agreed to a mission. Provide exactly 3 choices, ordered easy → medium → stretch.',
        items: {
          type: 'object',
          properties: {
            title:       { type: 'string' },
            description: { type: 'string', description: 'Friendly, 1 sentence, actionable for a young child' },
            theme:       { type: 'string', enum: ['brave', 'kind', 'calm', 'confident', 'creative', 'social', 'curious'] },
            difficulty:  { type: 'string', enum: ['easy', 'medium', 'stretch'] },
          },
          required: ['title', 'description', 'theme', 'difficulty'],
        },
        minItems: 3,
        maxItems: 3,
      },
      endConversation: {
        type: 'boolean',
        description:
          'Set to true when the conversation has reached a natural, warm endpoint — ' +
          'e.g. the child says goodbye or "I have to go". When true, your text should ' +
          'be a warm, brief farewell (one sentence). Do NOT set it on a normal reply.',
      },
      childName: {
        type: 'string',
        description:
          "If the child mentions their name for the first time in this exchange, include it. " +
          "Omit if you already know their name from the system prompt.",
      },
      topic: {
        type: 'string',
        description: "2-4 word phrase for the main subject of this exchange. Always include.",
      },
    },
    required: ['text', 'mood', 'topic'],
  },
};

const VALID_MOODS: TurtleMood[] = ['idle', 'listening', 'talking', 'happy', 'sad', 'confused', 'surprised'];
const VALID_THEMES: MissionTheme[] = ['brave', 'kind', 'calm', 'confident', 'creative', 'social', 'curious'];

function parseMissionChoices(raw: unknown): MissionSuggestion[] | undefined {
  if (!Array.isArray(raw) || raw.length < 3) return undefined;
  const validated = raw.slice(0, 3).map((item) => {
    if (!item || typeof item !== 'object') return null;
    const m = item as Record<string, unknown>;
    if (typeof m.title !== 'string' || typeof m.description !== 'string') return null;
    const theme = VALID_THEMES.includes(m.theme as MissionTheme) ? m.theme as MissionTheme : 'curious';
    const diff = (['easy', 'medium', 'stretch'] as const).includes(m.difficulty as 'easy') ? m.difficulty as 'easy' : 'easy';
    return { title: m.title, description: m.description, theme, difficulty: diff };
  });
  if (validated.some(c => !c)) return undefined;
  return validated as MissionSuggestion[];
}

abstract class BaseChatProvider implements ChatProvider {
  protected model: BaseChatModel;

  constructor(model: BaseChatModel) {
    this.model = model;
  }

  async chat(input: string, ctx: ConversationContext): Promise<ChatResponse> {
    let missionInstruction: string;

    if (ctx.missionDeclined) {
      missionInstruction =
        '\n\nThe child just said "maybe later" to missions. Acknowledge warmly ("No worries at all — ' +
        'anytime you feel ready!"). Do NOT offer or create a mission this turn.';
    } else if (ctx.offerMission) {
      const difficultyInstruction =
        ctx.difficultyProfile === 'confident'
          ? '\n\nDifficulty: When creating missions, make one medium and two stretch challenges (this child is experienced).'
          : ctx.difficultyProfile === 'intermediate'
          ? '\n\nDifficulty: When creating missions, create one easy, one medium, one stretch choice.'
          : '\n\nDifficulty: When creating missions, create two easy and one medium choice (this child is just starting out).';
      missionInstruction =
        '\n\nMission prompt: Naturally weave a question into your response asking if the child would like a small challenge related to what you have been talking about — e.g. "Want me to give you a little mission about that?" Do NOT include a missionChoices field this turn. Wait for the child to agree.' +
        difficultyInstruction;
    } else {
      missionInstruction =
        '\n\nMission: Only include missionChoices if the child just said yes to your previous offer in the last turn. Check the conversation history — if your last message offered a mission and the child agreed, create exactly 3 graded choices now based on the topic. Otherwise leave missionChoices empty.';
    }

    const topicsInstruction = ctx.topics?.length
      ? `\n\nThis child has enjoyed talking about: ${ctx.topics.join(', ')}. Reference naturally if relevant.`
      : '';

    const systemContent = (ctx.childName
      ? `${SHELLY_SYSTEM_PROMPT}\n\nThe child's name is ${ctx.childName}. Use their name occasionally.`
      : SHELLY_SYSTEM_PROMPT) + missionInstruction + topicsInstruction;

    const messages = [
      new SystemMessage(systemContent),
      ...ctx.messages.map((m) =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
      ),
      new HumanMessage(input),
    ];

    // withStructuredOutput uses tool_use/function_calling — the model never produces raw JSON text,
    // so it can't leak "json" into the spoken response.
    // Pass only the JSON schema (parameters) as input_schema; name goes in options.
    const structured = this.model.withStructuredOutput(RESPONSE_SCHEMA.parameters, {
      name: RESPONSE_SCHEMA.name,
    });
    const result = await structured.invoke(messages) as Record<string, unknown>;

    const mood: TurtleMood = VALID_MOODS.includes(result.mood as TurtleMood)
      ? (result.mood as TurtleMood)
      : 'happy';
    const missionChoices = parseMissionChoices(result.missionChoices);
    const endConversation: boolean =
      typeof result.endConversation === 'boolean' ? result.endConversation : false;
    const childName =
      typeof result.childName === 'string' && result.childName.trim()
        ? result.childName.trim()
        : undefined;
    const topic =
      typeof result.topic === 'string' && result.topic.trim()
        ? result.topic.trim()
        : undefined;

    return { text: String(result.text ?? ''), mood, missionChoices, endConversation, childName, topic };
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
