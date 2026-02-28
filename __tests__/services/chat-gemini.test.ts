/**
 * @jest-environment node
 *
 * Unit tests for GeminiChatProvider — verifies tool call parsing for:
 *   report_mood, propose_missions, end_conversation, note_child_info,
 *   acknowledge_mission_progress
 */

import { GeminiChatProvider } from '@/lib/speech/providers/chat';
import type { ConversationContext } from '@/lib/speech/types';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

jest.mock('@langchain/google-genai');

const MockChat = ChatGoogleGenerativeAI as jest.MockedClass<typeof ChatGoogleGenerativeAI>;

const ctx: ConversationContext = {
  messages: [],
  childName: undefined,
  topics: [],
  difficultyProfile: 'beginner',
  activeMission: null,
};

function mockInvokeWith(text: string, toolCalls: { name: string; args: Record<string, unknown> }[]) {
  const mockInvoke = jest.fn().mockResolvedValue({ content: text, tool_calls: toolCalls });
  MockChat.mockImplementation(() => ({ bindTools: jest.fn().mockReturnValue({ invoke: mockInvoke }) }) as never);
  return mockInvoke;
}

beforeEach(() => jest.clearAllMocks());

describe('GeminiChatProvider', () => {
  describe('report_mood tool', () => {
    it('extracts mood from report_mood tool call', async () => {
      mockInvokeWith('Wow, a dog!', [{ name: 'report_mood', args: { mood: 'happy' } }]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('I have a dog', ctx);
      expect(result.mood).toBe('happy');
    });

    it('defaults mood to "talking" when report_mood is missing', async () => {
      mockInvokeWith('Hello there!', []);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Hi', ctx);
      expect(result.mood).toBe('talking');
    });

    it('ignores invalid mood values and defaults to "talking"', async () => {
      mockInvokeWith('Hi!', [{ name: 'report_mood', args: { mood: 'not_a_valid_mood' } }]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Hi', ctx);
      expect(result.mood).toBe('talking');
    });

    it.each(['idle', 'listening', 'talking', 'happy', 'sad', 'confused', 'surprised'] as const)(
      'accepts valid mood "%s"',
      async (mood) => {
        mockInvokeWith('Hi!', [{ name: 'report_mood', args: { mood } }]);
        const provider = new GeminiChatProvider('test-key');
        const result = await provider.chat('Hi', ctx);
        expect(result.mood).toBe(mood);
      },
    );
  });

  describe('propose_missions tool', () => {
    const threeMissions = [
      { title: 'Say hello', description: 'Greet someone new', theme: 'kind', difficulty: 'easy' },
      { title: 'Tell a joke', description: 'Make someone laugh', theme: 'social', difficulty: 'medium' },
      { title: 'Write a poem', description: 'Write 4 lines', theme: 'creative', difficulty: 'stretch' },
    ];

    it('extracts 3 mission choices from propose_missions tool call', async () => {
      mockInvokeWith('Bye!', [
        { name: 'report_mood', args: { mood: 'happy' } },
        { name: 'propose_missions', args: { choices: threeMissions } },
        { name: 'end_conversation', args: {} },
      ]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Bye', ctx);
      expect(result.missionChoices).toHaveLength(3);
      expect(result.missionChoices![0].difficulty).toBe('easy');
      expect(result.missionChoices![1].difficulty).toBe('medium');
      expect(result.missionChoices![2].difficulty).toBe('stretch');
    });

    it('returns undefined missionChoices when propose_missions not called', async () => {
      mockInvokeWith('What is your name?', [{ name: 'report_mood', args: { mood: 'curious' } }]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Hello', ctx);
      expect(result.missionChoices).toBeUndefined();
    });

    it('returns undefined when propose_missions has fewer than 3 choices', async () => {
      mockInvokeWith('Bye!', [
        { name: 'propose_missions', args: { choices: threeMissions.slice(0, 2) } },
      ]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Bye', ctx);
      expect(result.missionChoices).toBeUndefined();
    });

    it('defaults invalid mission theme to "curious"', async () => {
      const missionsWithBadTheme = threeMissions.map((m, i) =>
        i === 0 ? { ...m, theme: 'not_a_theme' } : m,
      );
      mockInvokeWith('Bye!', [{ name: 'propose_missions', args: { choices: missionsWithBadTheme } }]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Bye', ctx);
      expect(result.missionChoices![0].theme).toBe('curious');
    });
  });

  describe('end_conversation tool', () => {
    it('sets endConversation: true when end_conversation is called', async () => {
      mockInvokeWith('Goodbye!', [
        { name: 'report_mood', args: { mood: 'happy' } },
        { name: 'end_conversation', args: {} },
      ]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Bye', ctx);
      expect(result.endConversation).toBe(true);
    });

    it('endConversation is falsy when end_conversation not called', async () => {
      mockInvokeWith('What do you like?', [{ name: 'report_mood', args: { mood: 'curious' } }]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Hello', ctx);
      expect(result.endConversation).toBeFalsy();
    });
  });

  describe('note_child_info tool', () => {
    it('extracts childName from note_child_info tool call', async () => {
      mockInvokeWith('Nice to meet you, Alice!', [
        { name: 'report_mood', args: { mood: 'happy' } },
        { name: 'note_child_info', args: { childName: 'Alice', topic: 'introduction' } },
      ]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat("My name is Alice", ctx);
      expect(result.childName).toBe('Alice');
      expect(result.topic).toBe('introduction');
    });

    it('extracts only topic when childName not provided', async () => {
      mockInvokeWith('Dinosaurs are cool!', [
        { name: 'note_child_info', args: { topic: 'dinosaurs' } },
      ]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('I love dinosaurs', ctx);
      expect(result.childName).toBeUndefined();
      expect(result.topic).toBe('dinosaurs');
    });

    it('ignores empty childName string', async () => {
      mockInvokeWith('Hi!', [
        { name: 'note_child_info', args: { childName: '  ', topic: 'turtles' } },
      ]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Hi', ctx);
      expect(result.childName).toBeUndefined();
    });
  });

  describe('acknowledge_mission_progress tool', () => {
    it('extracts missionProgressNote from acknowledge_mission_progress', async () => {
      mockInvokeWith('Amazing work!', [
        { name: 'report_mood', args: { mood: 'happy' } },
        { name: 'acknowledge_mission_progress', args: { note: 'Child said hi to two new friends' } },
      ]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat("I did my mission!", ctx);
      expect(result.missionProgressNote).toBe('Child said hi to two new friends');
    });

    it('missionProgressNote is undefined when tool not called', async () => {
      mockInvokeWith('What do you like?', [{ name: 'report_mood', args: { mood: 'curious' } }]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Hello', ctx);
      expect(result.missionProgressNote).toBeUndefined();
    });
  });

  describe('text extraction', () => {
    it('returns string content directly', async () => {
      mockInvokeWith('Wow, a dog! What is your dog\'s name?', [
        { name: 'report_mood', args: { mood: 'happy' } },
      ]);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('I have a dog', ctx);
      expect(result.text).toBe("Wow, a dog! What is your dog's name?");
    });

    it('extracts text from array content parts', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Hello there!' }, { type: 'text', text: 'How are you?' }],
        tool_calls: [{ name: 'report_mood', args: { mood: 'happy' } }],
      });
      MockChat.mockImplementation(() => ({ bindTools: jest.fn().mockReturnValue({ invoke: mockInvoke }) }) as never);
      const provider = new GeminiChatProvider('test-key');
      const result = await provider.chat('Hi', ctx);
      expect(result.text).toBe('Hello there! How are you?');
    });
  });

  describe('conversation history', () => {
    it('includes prior messages in the invoke call', async () => {
      const mockInvoke = mockInvokeWith('Cool!', [{ name: 'report_mood', args: { mood: 'happy' } }]);
      const ctxWithHistory: ConversationContext = {
        ...ctx,
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      };
      const provider = new GeminiChatProvider('test-key');
      await provider.chat('Tell me more', ctxWithHistory);
      const invokeArgs = mockInvoke.mock.calls[0][0];
      // SystemMessage + 2 history messages + new HumanMessage = 4
      expect(invokeArgs).toHaveLength(4);
    });
  });
});
