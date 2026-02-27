'use client';

import { useState } from 'react';
import { ChildSwitcher } from '@/app/components/parent/ChildSwitcher';
import { WeeklySummary } from '@/app/components/parent/WeeklySummary';
import { DinnerQuestions } from '@/app/components/parent/DinnerQuestions';
import { BookCard } from '@/app/components/parent/BookCard';
import type { Child } from '@/app/components/parent/ChildSwitcher';
import type { WeeklySummaryData } from '@/app/components/parent/WeeklySummary';
import type { DinnerQuestion } from '@/app/components/parent/DinnerQuestions';
import type { Book } from '@/app/components/parent/BookCard';

// MOCK DATA — placeholder for future API integration
import childrenData from '@/app/placeholders/children.json';
import weeklySummaryData from '@/app/placeholders/weekly-summary.json';
import dinnerQuestionsData from '@/app/placeholders/dinner-questions.json';
import booksData from '@/app/placeholders/books.json';

const children = childrenData as Child[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const weeklySummaryMap = weeklySummaryData as Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dinnerQuestionsMap = dinnerQuestionsData as Record<string, any>;
const books = booksData as Book[];

export default function ParentPage() {
  const [activeChild, setActiveChild] = useState<Child>(children[0]);

  const weeklySummary: WeeklySummaryData = weeklySummaryMap[activeChild.id];
  const dinnerQuestions: DinnerQuestion[] = dinnerQuestionsMap[activeChild.id] ?? [];

  // Filter books relevant to areas the child practised this week
  const practicedAreaIds = weeklySummary?.areas.map((a: { id: string }) => a.id) ?? [];
  const relevantBooks = books.filter((b) =>
    b.recommendedFor.some((r) => practicedAreaIds.includes(r))
  );
  const displayBooks = relevantBooks.length > 0 ? relevantBooks : books;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
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
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Parent Dashboard</span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: 6,
              padding: '2px 6px',
              fontWeight: 500,
            }}
          >
            MOCK DATA
          </span>
        </div>
        <ChildSwitcher
          children={children}
          activeChild={activeChild}
          onSelect={setActiveChild}
        />
      </header>

      {/* Content */}
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
        {/* Child greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 44 }}>{activeChild.avatar}</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
              {activeChild.name}&apos;s Progress
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              Age {activeChild.age} · {activeChild.completedMissions} missions completed
            </p>
          </div>
        </div>

        {/* Section 1: Weekly Summary */}
        {weeklySummary && <WeeklySummary data={weeklySummary} />}

        {/* Section 2: Dinner Questions */}
        {dinnerQuestions.length > 0 && <DinnerQuestions questions={dinnerQuestions} />}

        {/* Section 3: Recommended Books */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
            Recommended Books
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px' }}>
            Based on what {activeChild.name} practised this week
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
