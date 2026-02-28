/**
 * Tests that VapiVoiceProvider.start() calls vapi.start() with
 * assistantId + assistantOverrides (not inline assistant config).
 */

// Mock the @vapi-ai/web dynamic import
const mockStart = jest.fn().mockResolvedValue(undefined);
const mockStop  = jest.fn();
const MockVapi  = jest.fn().mockImplementation(() => ({
  start: mockStart,
  stop:  mockStop,
  on:    jest.fn(),
  off:   jest.fn(),
}));

jest.mock('@vapi-ai/web', () => ({ default: MockVapi }));

import { VapiVoiceProvider } from '@/lib/speech/voice/vapi';

const ASSISTANT_ID = '985d923d-6efc-43ef-b9a9-4b935c954a9c';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY    = 'test-public-key';
  process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID  = ASSISTANT_ID;
  process.env.NEXT_PUBLIC_CUSTOM_LLM_URL     = 'https://test.ngrok.io';
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  delete process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  delete process.env.NEXT_PUBLIC_CUSTOM_LLM_URL;
});

test('start() calls vapi.start with assistantId', async () => {
  const provider = new VapiVoiceProvider();
  await provider.start({ childName: 'Leo', topics: ['space'], difficultyProfile: 'beginner', activeMission: null });

  expect(mockStart).toHaveBeenCalledTimes(1);
  const arg = mockStart.mock.calls[0][0];
  expect(arg.assistantId).toBe(ASSISTANT_ID);
});

test('start() passes model override with custom-llm URL', async () => {
  const provider = new VapiVoiceProvider();
  await provider.start({ childName: 'Leo', topics: [], difficultyProfile: 'beginner', activeMission: null });

  const arg = mockStart.mock.calls[0][0];
  expect(arg.assistantOverrides.model.provider).toBe('custom-llm');
  expect(arg.assistantOverrides.model.url).toBe('https://test.ngrok.io/api/vapi/llm');
});

test('start() falls back to window.location.origin when CUSTOM_LLM_URL is unset', async () => {
  delete process.env.NEXT_PUBLIC_CUSTOM_LLM_URL;
  // jsdom sets window.location.origin to 'http://localhost'
  const provider = new VapiVoiceProvider();
  await provider.start({ childName: 'Leo', topics: [], difficultyProfile: 'beginner', activeMission: null });

  const arg = mockStart.mock.calls[0][0];
  expect(arg.assistantOverrides.model.url).toContain('/api/vapi/llm');
});

test('start() passes childName in variableValues', async () => {
  const provider = new VapiVoiceProvider();
  await provider.start({ childName: 'Mia', topics: [], difficultyProfile: 'beginner', activeMission: null });

  const arg = mockStart.mock.calls[0][0];
  expect(arg.assistantOverrides.variableValues.childName).toBe('Mia');
});

test('start() passes context in metadata', async () => {
  const provider = new VapiVoiceProvider();
  await provider.start({ childName: 'Mia', topics: ['animals'], difficultyProfile: 'intermediate', activeMission: null });

  const arg = mockStart.mock.calls[0][0];
  expect(arg.metadata.childName).toBe('Mia');
  expect(arg.metadata.topics).toEqual(['animals']);
  expect(arg.metadata.difficultyProfile).toBe('intermediate');
});

test('start() emits error when NEXT_PUBLIC_VAPI_PUBLIC_KEY is missing', async () => {
  delete process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const provider = new VapiVoiceProvider();
  const errors: string[] = [];
  provider.on('error', (msg: string) => errors.push(msg));
  await provider.start({});
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatch(/NEXT_PUBLIC_VAPI_PUBLIC_KEY/);
});

test('start() emits error when NEXT_PUBLIC_VAPI_ASSISTANT_ID is missing', async () => {
  delete process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const provider = new VapiVoiceProvider();
  const errors: string[] = [];
  provider.on('error', (msg: string) => errors.push(msg));
  await provider.start({});
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatch(/NEXT_PUBLIC_VAPI_ASSISTANT_ID/);
});
