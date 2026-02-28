/**
 * Shelly — mission-aware conversation agent.
 *
 * Architecture: instead of a single withStructuredOutput blob, the agent
 * uses individual bound tools so each concern is separate and inspectable:
 *
 *   report_mood              — required every turn (sets the turtle face)
 *   propose_missions         — required when ending (3 graded challenges)
 *   end_conversation         — signals conversation end (always with propose_missions)
 *   acknowledge_mission_progress — optional, when child mentions their active challenge
 *   note_child_info          — optional, records child's name and turn topic
 *
 * Missions are forced at every conversation end — no more random 30% mid-turn logic.
 */

import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import type { ChatProvider, ChatResponse, ConversationContext, MissionSuggestion, MissionTheme, TurtleMood } from '../types';
import { speechConfig } from '../config';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const MOOD_VALUES = ['idle', 'listening', 'talking', 'happy', 'sad', 'confused', 'surprised'] as const;
const THEME_VALUES = ['brave', 'kind', 'calm', 'confident', 'creative', 'social', 'curious'] as const;
const DIFF_VALUES = ['easy', 'medium', 'stretch'] as const;

const VALID_MOODS = [...MOOD_VALUES] as TurtleMood[];
const VALID_THEMES = [...THEME_VALUES] as MissionTheme[];

const missionItemSchema = z.object({
  title: z.string().describe("Mission title — short, exciting, child-friendly"),
  description: z.string().describe("1 sentence, friendly, actionable for a child aged 4-10"),
  theme: z.enum(THEME_VALUES),
  difficulty: z.enum(DIFF_VALUES),
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const reportMoodTool = tool(
  async () => '', // executor not used — we read tool_calls from the response
  {
    name: 'report_mood',
    description: "Set Shelly's current emotional state. You MUST call this every single turn.",
    schema: z.object({
      mood: z.enum(MOOD_VALUES).describe('Turtle mood for this response'),
    }),
  },
);

const proposeMissionsTool = tool(
  async () => '',
  {
    name: 'propose_missions',
    description:
      'Offer the child exactly 3 graded challenges — one easy, one medium, one stretch. ' +
      'You MUST call this whenever you call end_conversation. Missions should relate to what you discussed.',
    schema: z.object({
      choices: z
        .array(missionItemSchema)
        .length(3)
        .describe('Exactly 3 missions: [easy, medium, stretch]'),
    }),
  },
);

const endConversationTool = tool(
  async () => '',
  {
    name: 'end_conversation',
    description:
      'Signal the conversation has reached a natural, warm close. ' +
      'ALWAYS call propose_missions in the same response when you use this tool.',
    schema: z.object({}),
  },
);

const acknowledgeMissionProgressTool = tool(
  async () => '',
  {
    name: 'acknowledge_mission_progress',
    description:
      "Call when the child mentions working on or completing their active challenge. " +
      "Celebrate their effort warmly.",
    schema: z.object({
      note: z.string().describe('Brief note on what the child shared about their progress'),
    }),
  },
);

const noteChildInfoTool = tool(
  async () => '',
  {
    name: 'note_child_info',
    description:
      "Record the child's first name if they just mentioned it, and the main topic of this exchange.",
    schema: z.object({
      childName: z.string().optional().describe("Child's name if just introduced"),
      topic: z.string().optional().describe('2-4 word phrase describing the main subject'),
    }),
  },
);

const AGENT_TOOLS = [
  reportMoodTool,
  proposeMissionsTool,
  endConversationTool,
  acknowledgeMissionProgressTool,
  noteChildInfoTool,
];

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const BASE_SYSTEM_PROMPT = `You are Shelly, a friendly sea turtle who chats with children aged 4-10.

SPEAKING RULES — these are the most important:
- Keep every response to 1 sentence + 1 question. No more.
- End EVERY turn with a single simple question that invites the child to speak.
- Never explain or lecture. React briefly, then ask.
- Use tiny words. Short sentences. Lots of warmth.
- Never discuss violence, adult topics, or anything scary.

GOOD example: "Wow, a dog! 🐢 What's your dog's name?"
BAD example: "That's so wonderful that you have a dog! Dogs are amazing pets and they bring so much joy. I love hearing about animals. What kind of dog do you have and what do you like to do with them?"

TOOL RULES:
1. Call report_mood every turn.
2. Call note_child_info when you learn the child's name or the turn's topic.
3. Call acknowledge_mission_progress if the child mentions their active challenge.

ENDING RULE — read carefully:
- You MUST NOT call end_conversation or propose_missions until the child has sent at least 4 messages.
- NEVER end on the first message, second message, or third message. No exceptions.
- After the 4th child message or later, end naturally when the conversation reaches a warm close OR the child says goodbye/bye/see you.
- When ending: say one warm farewell sentence, then call BOTH end_conversation AND propose_missions together.`;

function buildSystemPrompt(ctx: ConversationContext): string {
  let prompt = ctx.childName
    ? `${BASE_SYSTEM_PROMPT}\n\nThe child's name is ${ctx.childName}. Use their name occasionally.`
    : BASE_SYSTEM_PROMPT;

  if (ctx.topics?.length) {
    prompt += `\n\nThis child has enjoyed talking about: ${ctx.topics.join(', ')}. Reference naturally if relevant.`;
  }

  if (ctx.activeMission) {
    prompt +=
      `\n\nACTIVE CHALLENGE: "${ctx.activeMission.title}" — ${ctx.activeMission.description}. ` +
      `Mention it briefly in one of your questions (e.g. "Have you tried your challenge yet?"). ` +
      `If the child brings it up, call acknowledge_mission_progress.`;
  }

  const difficultyInstruction =
    ctx.difficultyProfile === 'confident'
      ? '\n\nMISSION DIFFICULTY: This child is experienced — make the stretch challenge the main focus (one medium, two stretch).'
      : ctx.difficultyProfile === 'intermediate'
      ? '\n\nMISSION DIFFICULTY: Mix it up — one easy, one medium, one stretch.'
      : '\n\nMISSION DIFFICULTY: This child is just starting out — keep it gentle (two easy, one medium).';

  prompt += difficultyInstruction;
  return prompt;
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

function parseMissionChoices(raw: unknown): MissionSuggestion[] | undefined {
  if (!Array.isArray(raw) || raw.length < 3) return undefined;
  const validated = raw.slice(0, 3).map((item) => {
    if (!item || typeof item !== 'object') return null;
    const m = item as Record<string, unknown>;
    if (typeof m.title !== 'string' || typeof m.description !== 'string') return null;
    const theme = VALID_THEMES.includes(m.theme as MissionTheme) ? (m.theme as MissionTheme) : 'curious';
    const diff = DIFF_VALUES.includes(m.difficulty as 'easy') ? (m.difficulty as 'easy') : 'easy';
    return { title: m.title, description: m.description, theme, difficulty: diff } satisfies MissionSuggestion;
  });
  if (validated.some((c) => !c)) return undefined;
  return validated as MissionSuggestion[];
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter((c): c is { type: string; text: string } => c?.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text)
      .join(' ')
      .trim();
  }
  return '';
}

// ---------------------------------------------------------------------------
// Base agent class
// ---------------------------------------------------------------------------

abstract class BaseChatProvider implements ChatProvider {
  protected model: BaseChatModel;

  constructor(model: BaseChatModel) {
    this.model = model;
  }

  async chat(input: string, ctx: ConversationContext): Promise<ChatResponse> {
    const systemContent = buildSystemPrompt(ctx);

    const messages = [
      new SystemMessage(systemContent),
      ...ctx.messages.map((m) =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
      ),
      new HumanMessage(input),
    ];

    // bindTools exists on ChatAnthropic/ChatOpenAI but not typed on the base class
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelWithTools = (this.model as any).bindTools(AGENT_TOOLS);
    const response = await modelWithTools.invoke(messages);

    // --- Extract spoken text ---
    const text = extractTextContent(response.content);

    // --- Parse tool calls ---
    let mood: TurtleMood = 'talking';
    let missionChoices: MissionSuggestion[] | undefined;
    let endConversation = false;
    let childName: string | undefined;
    let topic: string | undefined;
    let missionProgressNote: string | undefined;

    for (const tc of (response.tool_calls ?? [])) {
      switch (tc.name) {
        case 'report_mood': {
          const m = tc.args?.mood as string;
          if (VALID_MOODS.includes(m as TurtleMood)) mood = m as TurtleMood;
          break;
        }
        case 'propose_missions': {
          missionChoices = parseMissionChoices(tc.args?.choices);
          break;
        }
        case 'end_conversation': {
          endConversation = true;
          break;
        }
        case 'acknowledge_mission_progress': {
          missionProgressNote = typeof tc.args?.note === 'string' ? tc.args.note : undefined;
          break;
        }
        case 'note_child_info': {
          if (typeof tc.args?.childName === 'string' && tc.args.childName.trim()) {
            childName = tc.args.childName.trim();
          }
          if (typeof tc.args?.topic === 'string' && tc.args.topic.trim()) {
            topic = tc.args.topic.trim();
          }
          break;
        }
      }
    }

    return { text, mood, missionChoices, endConversation, childName, topic, missionProgressNote };
  }
}

// ---------------------------------------------------------------------------
// Concrete providers
// ---------------------------------------------------------------------------

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

export class GeminiChatProvider extends BaseChatProvider {
  constructor(apiKey?: string) {
    super(
      new ChatGoogleGenerativeAI({
        model: speechConfig.chat.geminiModel,
        apiKey: apiKey ?? process.env.GEMINI_API_KEY,
        maxOutputTokens: speechConfig.chat.maxTokens,
      }),
    );
  }
}

export function createChatProvider(name: 'anthropic' | 'openai' | 'gemini' = 'anthropic'): ChatProvider {
  if (name === 'openai') return new OpenAIChatProvider();
  if (name === 'gemini') return new GeminiChatProvider();
  return new AnthropicChatProvider();
}
