'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChildSwitcher } from '@/app/components/parent/ChildSwitcher';
import { WeeklySummary } from '@/app/components/parent/WeeklySummary';
import { DinnerQuestions } from '@/app/components/parent/DinnerQuestions';
import { BookCard } from '@/app/components/parent/BookCard';
import type { Child } from '@/app/components/parent/ChildSwitcher';
import type { WeeklySummaryData } from '@/app/components/parent/WeeklySummary';
import type { DinnerQuestion } from '@/app/components/parent/DinnerQuestions';
import type { Book } from '@/app/components/parent/BookCard';
import { getWeekStart } from '@/lib/reports/weekly';

import booksData from '@/app/placeholders/books.json';

const books = booksData as Book[];

function getWeekOptions(): { value: string; label: string }[] {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7 * i);
    const weekStart = getWeekStart(d);
    const label = i === 0 ? 'This week' : `Week of ${weekStart}`;
    options.push({ value: weekStart, label });
  }
  return options;
}

const EMOJI_OPTIONS = ['🐢', '🦊', '🦋', '🐻', '🦁', '🐸', '🐶', '🐱', '🌟'];

export default function ParentPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [addFirstName, setAddFirstName] = useState('');
  const [addEmoji, setAddEmoji] = useState('🐢');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newChildLoginKey, setNewChildLoginKey] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [weeklyReport, setWeeklyReport] = useState<WeeklySummaryData | null>(null);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [dinnerQuestions, setDinnerQuestions] = useState<DinnerQuestion[]>([]);
  const [dinnerQuestionsLoading, setDinnerQuestionsLoading] = useState(false);
  const [dinnerQuestionsGenerating, setDinnerQuestionsGenerating] = useState(false);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await fetch('/api/parent/children', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.children ?? []) as Child[];
      setChildren(list);
      setActiveChild((prev) => {
        if (list.length === 0) return null;
        if (prev && list.some((c) => c.id === prev.id)) return prev;
        return list[0] ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (!activeChild?.id) {
      setWeeklyReport(null);
      return;
    }
    setWeeklyReportLoading(true);
    fetch(
      `/api/parent/weekly-report?childId=${encodeURIComponent(activeChild.id)}&weekStart=${encodeURIComponent(weekStart)}`,
      { credentials: 'include' }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWeeklyReport(data ?? null))
      .catch(() => setWeeklyReport(null))
      .finally(() => setWeeklyReportLoading(false));
  }, [activeChild?.id, weekStart]);

  const fetchDinnerQuestions = useCallback(async () => {
    if (!activeChild?.id) {
      setDinnerQuestions([]);
      return;
    }
    setDinnerQuestionsLoading(true);
    try {
      const res = await fetch(
        `/api/parent/dinner-questions?childId=${encodeURIComponent(activeChild.id)}`,
        { credentials: 'include' }
      );
      const data = res.ok ? await res.json() : null;
      setDinnerQuestions((data?.questions ?? []) as DinnerQuestion[]);
    } catch {
      setDinnerQuestions([]);
    } finally {
      setDinnerQuestionsLoading(false);
    }
  }, [activeChild?.id]);

  useEffect(() => {
    fetchDinnerQuestions();
  }, [fetchDinnerQuestions]);

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    const name = addFirstName.trim();
    if (!name) {
      setAddError('Please enter a name');
      return;
    }
    setAddSubmitting(true);
    try {
      const res = await fetch('/api/parent/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName: name, emoji: addEmoji }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Could not add child');
        return;
      }
      setNewChildLoginKey(data.child?.loginKey ?? null);
      setAddFirstName('');
      setAddEmoji('🐢');
      await fetchChildren();
      setAddChildOpen(false);
    } finally {
      setAddSubmitting(false);
    }
  }

  const weeklySummary = weeklyReport ?? undefined;
  const practicedAreaIds = weeklySummary?.areas?.map((a: { id: string }) => a.id) ?? [];

  async function handleMarkDinnerComplete(id: string) {
    const res = await fetch('/api/parent/dinner-questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });
    if (res.ok) await fetchDinnerQuestions();
  }

  async function handleGenerateDinnerQuestions() {
    if (!activeChild?.id) return;
    setDinnerQuestionsGenerating(true);
    try {
      const res = await fetch('/api/parent/dinner-questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ childId: activeChild.id }),
      });
      if (res.ok) await fetchDinnerQuestions();
    } finally {
      setDinnerQuestionsGenerating(false);
    }
  }
  const relevantBooks = books.filter((b) =>
    b.recommendedFor.some((r) => practicedAreaIds.includes(r))
  );
  const displayBooks = relevantBooks.length > 0 ? relevantBooks : books;

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Loading…</p>
      </div>
    );
  }

  if (children.length === 0 && !addChildOpen) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: '#f9fafb',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Add your first child
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
          Create a profile so they can log in and use TurtleTalk.
        </p>
        <button
          onClick={() => { setAddChildOpen(true); setNewChildLoginKey(null); setAddError(null); }}
          style={{
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: '#0f766e',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Add child
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 20px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Parent Dashboard</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => { setAddChildOpen(true); setNewChildLoginKey(null); setAddError(null); }}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Add child
          </button>
          {activeChild && children.length > 0 && (
            <ChildSwitcher
              children={children}
              activeChild={activeChild}
              onSelect={setActiveChild}
            />
          )}
        </div>
      </header>

      {addChildOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => !addSubmitting && setAddChildOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              maxWidth: 360,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Add child</h2>
            <form onSubmit={handleAddChild} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>First name</label>
              <input
                value={addFirstName}
                onChange={(e) => setAddFirstName(e.target.value)}
                placeholder="e.g. Alex"
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <label style={{ fontSize: 14, fontWeight: 500 }}>Emoji</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setAddEmoji(em)}
                    style={{
                      fontSize: 24,
                      padding: 8,
                      border: addEmoji === em ? '2px solid #0f766e' : '1px solid #e5e7eb',
                      borderRadius: 8,
                      background: addEmoji === em ? '#f0fdfa' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
              {addError && <p style={{ color: '#dc2626', fontSize: 14 }}>{addError}</p>}
              {newChildLoginKey && (
                <p style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, fontSize: 13 }}>
                  Login code for this child: <strong>{newChildLoginKey}</strong>. They’ll use this with their name and emoji to sign in.
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setAddChildOpen(false)}
                  disabled={addSubmitting}
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#0f766e', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  {addSubmitting ? 'Adding…' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeChild && (
        <main
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '32px 20px 60px',
            display: 'flex',
            flexDirection: 'column',
            gap: 48,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 44 }}>{activeChild.avatar}</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
                {activeChild.name}&apos;s Progress
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                {activeChild.completedMissions} missions completed
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <label htmlFor="week-picker" style={{ fontSize: 14, color: '#6b7280' }}>
                Week:
              </label>
              <select
                id="week-picker"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  background: '#fff',
                }}
              >
                {getWeekOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {weeklyReportLoading && <p style={{ color: '#6b7280', fontSize: 14 }}>Loading…</p>}
            {!weeklyReportLoading && weeklySummary && <WeeklySummary data={weeklySummary} />}
            {!weeklyReportLoading && !weeklySummary && (
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                No summary for this week yet. Completed missions will appear here.
              </p>
            )}
          <DinnerQuestions
            questions={dinnerQuestions}
            loading={dinnerQuestionsLoading}
            onMarkComplete={handleMarkDinnerComplete}
            onGenerate={handleGenerateDinnerQuestions}
            generating={dinnerQuestionsGenerating}
          />
          {!weeklySummary && dinnerQuestions.length === 0 && !dinnerQuestionsLoading && (
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              No summary or dinner questions yet. When {activeChild.name} completes missions and you have reports, they’ll appear here.
            </p>
          )}

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
              Recommended Books
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px' }}>
              Based on what {activeChild.name} practised
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {displayBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
