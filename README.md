This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).  
TurtleTalk is a children's voice-chat app: talk to Shelly the sea turtle, get voice replies, and earn brave missions.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database (Supabase)

If you set `NEXT_PUBLIC_DB_PROVIDER=supabase`, run the migrations in your Supabase project or the app will get 404s on `/rest/v1/missions`. In the [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor, run the contents of `supabase/migrations/001_initial.sql` and `supabase/migrations/002_indexes.sql`. Otherwise use the default `localStorage` provider (no setup).

## Voice and audio

For Shelly to reply with real conversation (not just “I’m listening, tell me more”), use **Anthropic** or **OpenAI** for the chat step: set `SPEECH_CHAT_PROVIDER=anthropic` (or `openai`) and the matching API key in `.env.local`. See `.env.example` for all speech options.

See [DEBUG.md](DEBUG.md) for the voice pipeline overview, how to enable logs, and an audio-issues checklist.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
