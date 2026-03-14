import { NextResponse } from 'next/server';

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not set' }, { status: 503 });
  }

  try {
    const body = await req.json() as { model?: string; voice?: string };
    const defaultModel = process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL ?? 'gpt-realtime-1.5';
    const defaultVoice = process.env.NEXT_PUBLIC_OPENAI_REALTIME_VOICE ?? 'sage';
    const model = body.model ?? defaultModel;
    const voice = body.voice ?? defaultVoice;

    const res = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, voice }),
    });

    if (!res.ok) {
      console.error('[openai-realtime/session] OpenAI error:', res.status);
      return NextResponse.json({ error: 'OpenAI session creation failed' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[openai-realtime/session]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 502 }
    );
  }
}
