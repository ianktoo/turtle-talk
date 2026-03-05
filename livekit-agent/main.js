/**
 * Turtle Talk LiveKit voice agent.
 * Uses OpenAI Realtime API for speech-in and speech-out.
 * Run: pnpm dev (connects to LiveKit Cloud), or deploy with lk agent create.
 */
import { ServerOptions, cli, defineAgent, voice } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { ShellyAgent } from './agent.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });
function sendTranscript(room, role, text) {
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'transcript', role, text }));
    room.localParticipant?.publishData(payload, { reliable: true }).catch(() => { });
}
export default defineAgent({
    entry: async (ctx) => {
        const session = new voice.AgentSession({
            llm: new openai.realtime.RealtimeModel({
                voice: 'coral',
            }),
        });
        await session.start({
            agent: new ShellyAgent(),
            room: ctx.room,
            inputOptions: {
                noiseCancellation: BackgroundVoiceCancellation(),
            },
        });
        await ctx.connect();
        const room = ctx.room;
        session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
            if (ev.isFinal && ev.transcript.trim()) {
                sendTranscript(room, 'user', ev.transcript);
            }
        });
        session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
            if (ev.item.role === 'assistant') {
                const text = ev.item.textContent;
                if (text?.trim()) {
                    sendTranscript(room, 'assistant', text);
                }
            }
        });
        const handle = session.generateReply({
            instructions: 'Greet the child warmly and ask how they are or what they did today. One sentence and one question.',
        });
        await handle?.waitForPlayout?.();
    },
});
cli.runApp(new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'shelly',
    // Give the job process more time to start (default 10s can be too short on Windows / cold start for 2nd+ jobs)
    initializeProcessTimeout: 60 * 1000,
}));
