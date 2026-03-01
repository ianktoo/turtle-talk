import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai/node';

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

/**
 * GET /api/gemini-live/token
 * Returns an ephemeral token for the client to connect to the Gemini Live API.
 * Requires GEMINI_API_KEY on the server. Token is single-use, 30 min expiry.
 */
export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set' },
      { status: 503 }
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    const authToken = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
      },
    });

    const token = authToken?.name ?? '';
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to create ephemeral token' },
        { status: 502 }
      );
    }

    return NextResponse.json({ token });
  } catch (err) {
    console.error('[gemini-live/token]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Token creation failed', detail: message },
      { status: 502 }
    );
  }
}
