/**
 * Supabase Edge Function: generate-weekly-reports
 * Generates weekly_reports for all children for the current week (or weekStart in body).
 * Invoke via: POST with Authorization: Bearer <service_role or anon> or from cron.
 * Set verify_jwt: false if calling from Supabase Cron (or pass valid JWT).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AREAS = [
  {
    id: "social-courage",
    label: "Social Courage",
    description: "Talking to new people, joining groups, making friends",
    icon: "🤝",
    themes: ["social"],
  },
  {
    id: "performance-bravery",
    label: "Performance Bravery",
    description: "Speaking up in class, presenting, performing",
    icon: "🎤",
    themes: ["brave", "confident"],
  },
  {
    id: "repair-courage",
    label: "Repair Courage",
    description: "Apologizing, fixing mistakes, reconnecting after conflict",
    icon: "🌱",
    themes: ["kind", "calm", "creative", "curious"],
  },
];

const MAX_SCORE = 5;

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().slice(0, 10);
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 19) + "Z";
}

Deno.serve(async (req: Request) => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, key);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const weekStart: string = body.weekStart ?? getWeekStart(new Date());
    const weekEnd = getWeekEnd(weekStart);
    const startIso = `${weekStart}T00:00:00Z`;

    const { data: children, error: childrenError } = await supabase
      .from("children")
      .select("id");

    if (childrenError || !children?.length) {
      return new Response(
        JSON.stringify({ ok: true, message: "No children", generated: 0 }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    let generated = 0;
    for (const child of children) {
      const { data: missions } = await supabase
        .from("missions")
        .select("id, title, theme, completed_at")
        .eq("child_id", child.id)
        .eq("status", "completed")
        .gte("completed_at", startIso)
        .lt("completed_at", weekEnd);

      const areas = AREAS.map((area) => {
        const matching = (missions ?? []).filter((m) =>
          area.themes.includes(m.theme ?? "curious")
        );
        const score = Math.min(matching.length, MAX_SCORE);
        const highlights = matching.slice(0, 5).map((m) => m.title);
        return {
          id: area.id,
          label: area.label,
          description: area.description,
          score,
          maxScore: MAX_SCORE,
          icon: area.icon,
          highlights,
        };
      });

      const payload = { childId: child.id, weekOf: weekStart, areas };
      const { error: upsertError } = await supabase
        .from("weekly_reports")
        .upsert(
          { child_id: child.id, week_start: weekStart, payload },
          { onConflict: "child_id,week_start" }
        );

      if (!upsertError) generated++;
    }

    return new Response(
      JSON.stringify({ ok: true, weekStart, generated }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
