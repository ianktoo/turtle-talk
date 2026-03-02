/**
 * Turtle Talk LiveKit voice agent.
 * Uses Gemini Live API (realtime) for speech-in and speech-out — one Gemini model for voice.
 * Run: pnpm dev (connects to LiveKit Cloud), or deploy with lk agent create.
 */
import { type JobContext, ServerOptions, cli, defineAgent, voice } from '@livekit/agents';
import * as google from '@livekit/agents-plugin-google';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { ShellyAgent } from './agent.js';

dotenv.config({ path: '.env.local' });

const SHELLY_INSTRUCTIONS = `You are Shelly, a friendly sea turtle who chats with children aged 4-10.
Focus on the child's feelings and what they did today. Keep every response to 1 sentence + 1 question.
Use tiny words. Short sentences. Lots of warmth. Always speak in English only.`;

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const session = new voice.AgentSession({
      llm: new google.beta.realtime.RealtimeModel({
        voice: 'Puck',
        instructions: SHELLY_INSTRUCTIONS,
      }),
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    await session.start({
      agent: new ShellyAgent(),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    await ctx.connect();

    const handle = session.generateReply({
      instructions:
        'Greet the child warmly and ask how they are or what they did today. One sentence and one question.',
    });
    await handle?.waitForPlayout?.();
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'shelly',
  })
);
