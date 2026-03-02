# Turtle Talk LiveKit Agent

Uses **Gemini Live API** (realtime) for full-duplex voice: speech-in and speech-out are handled by one Gemini model. No separate STT or TTS pipeline in the Node.js plugin — the realtime model does both.

- **Model**: Gemini Live (realtime) via `@livekit/agents-plugin-google` (voice in + voice out).
- **Auth**: `GOOGLE_API_KEY` (Google AI Studio).

For a discrete **STT → LLM → TTS** pipeline with Gemini LLM + Gemini TTS, the Node plugin provides Gemini LLM and Gemini TTS; speech-to-text would need another provider (e.g. Deepgram or Google Cloud STT in Python). This agent uses the simpler realtime setup.

## Setup

1. **LiveKit Cloud**  
   Create a project at [cloud.livekit.io](https://cloud.livekit.io) and run:
   ```bash
   lk cloud auth
   lk app env -w
   ```
   This writes `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` to `.env.local`.

2. **Google AI (Gemini)**  
   Get an API key from [Google AI Studio](https://aistudio.google.com/apikey) and add to `.env.local`:
   ```bash
   GOOGLE_API_KEY=your_key
   ```

3. **Install and run**
   ```bash
   pnpm install
   pnpm dev              # connect to LiveKit Cloud
   ```

Then use the [LiveKit Playground](https://docs.livekit.io/agents/start/playground/) or the Turtle Talk app with `NEXT_PUBLIC_VOICE_PROVIDER=livekit` and a token from `/api/livekit/token`.

## Deploy to LiveKit Cloud

From this directory:

```bash
lk agent create
```

Set `GOOGLE_API_KEY` (and optionally `LIVEKIT_*`) in LiveKit Cloud secrets for the agent.
