'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createVoiceProvider } from '@/lib/speech/voice';
import { useVoiceSession } from '@/app/hooks/useVoiceSession';
import { usePersonalMemory } from '@/app/hooks/usePersonalMemory';
import { useMissions } from '@/app/hooks/useMissions';
import { getDeviceId, getGuestDb } from '@/lib/db';
import type { Message, MissionSuggestion } from '@/lib/speech/types';
import books from '@/app/placeholders/books.json';
import {
  clearDemoSession,
  createFreshDemoSession,
  DEMO_STEP_ORDER,
  getFirstStep,
  getNextStep,
  getPreviousStep,
  loadDemoSession,
  saveDemoSession,
  type DemoParentPriority,
  type DemoSession,
  type DemoStep,
} from '../demoSession';
import { getDemoSkippedSteps } from '@/lib/env/demo';
import { getTattleCards } from '@/lib/tattle-cards/tattle-cards';
import TalkConversationCard from '@/app/v2/components/TalkConversationCard';
import TalkEndCallButton from '@/app/v2/components/TalkEndCallButton';
import TalkMuteToggle from '@/app/v2/components/TalkMuteToggle';
import TalkStatusIndicator from '@/app/v2/components/TalkStatusIndicator';
import ShellyLogoPlaceholder from '@/app/v2/components/ShellyLogoPlaceholder';
import MicPermissionV2 from '@/app/v2/components/MicPermissionV2';
import { useMicPermission } from '@/app/hooks/useMicPermission';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';

type DemoMissionChoice = MissionSuggestion & { __index: number };

const ACTIVE_STATES = new Set(['listening', 'recording', 'processing', 'speaking', 'muted']);

const SKIPPED_STEPS = getDemoSkippedSteps();

type Book = {
  id: string;
  title: string;
  author: string;
  shortDescription?: string;
  whyRecommended?: string;
  fullDescription?: string;
  recommendedFor?: string[];
};

type DemoTheme = 'dark' | 'light';

/* ------------------------------------------------------------------ */
/*  Shared UI primitives                                               */
/* ------------------------------------------------------------------ */

function DemoShell(props: { children: React.ReactNode; onResetAll: () => void; theme: DemoTheme }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          props.theme === 'dark'
            ? 'var(--v2-bg)'
            : 'radial-gradient(circle at top, #fdf6ff 0, #f3fbff 45%, #eef7ff 100%)',
        color: props.theme === 'dark' ? '#F5F7FF' : '#1b1333',
        fontFamily: 'var(--font-varela, system-ui)',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          background:
            props.theme === 'dark'
              ? 'rgba(10, 10, 12, 0.82)'
              : 'rgba(255, 255, 255, 0.86)',
          backdropFilter: 'blur(10px)',
          borderBottom:
            props.theme === 'dark'
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(0,0,40,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>Shelly</div>
            <div
              style={{
                color: 'var(--v2-text-secondary)',
                fontSize: 13,
              }}
            >
              Voice companion for brave kids
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={props.onResetAll}
              style={{
                appearance: 'none',
                border: '1px solid rgba(255,255,255,0.16)',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--v2-text)',
                padding: '8px 10px',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Start over
            </button>
          </div>
        </div>
      </div>
      {props.children}
    </div>
  );
}

function Card(props: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section
      style={{
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'rgba(15, 18, 40, 0.96)',
        borderRadius: 20,
        padding: 16,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 16, letterSpacing: 0.2 }}>{props.title}</h2>
        {props.right}
      </header>
      <div style={{ marginTop: 12 }}>{props.children}</div>
    </section>
  );
}

function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: 'primary' | 'ghost';
    kind?: 'default' | 'tapToSpeak';
  },
) {
  const tone = props.tone ?? 'primary';
  const kind = props.kind ?? 'default';
  const bg =
    tone === 'primary'
      ? kind === 'tapToSpeak'
        ? 'linear-gradient(135deg, #1FD27C, #0BAF5B)'
        : 'linear-gradient(135deg, #00CFB9, #00B8A3)'
      : 'rgba(255,255,255,0.06)';
  return (
    <button
      {...props}
      style={{
        appearance: 'none',
        border: '1px solid rgba(255,255,255,0.16)',
        background: bg,
        color: 'white',
        padding: '10px 14px',
        borderRadius: 999,
        fontWeight: 700,
        cursor: 'pointer',
        ...props.style,
      }}
    />
  );
}

function ModalBackdrop(props: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      role="presentation"
      onClick={props.onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 101,
          width: 'calc(100% - 32px)',
          maxWidth: 440,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(247, 249, 255, 0.98)',
          border: '1px solid rgba(12, 18, 40, 0.10)',
          borderRadius: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}
      >
        {props.children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  InfoHint — replaces wordy descriptions with a subtle inline hint  */
/* ------------------------------------------------------------------ */

function InfoHint(props: { text: string; onDismiss?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        fontSize: 12,
        color: 'var(--v2-text-secondary)',
        lineHeight: 1.4,
      }}
    >
      <span style={{ flexShrink: 0 }} aria-hidden>
        {'\u{1F422}'}
      </span>
      <span style={{ flex: 1 }}>{props.text}</span>
      {props.onDismiss && (
        <button
          type="button"
          onClick={props.onDismiss}
          aria-label="Dismiss hint"
          style={{
            appearance: 'none',
            border: 'none',
            background: 'transparent',
            color: 'var(--v2-text-secondary)',
            cursor: 'pointer',
            fontSize: 14,
            padding: 0,
            lineHeight: 1,
          }}
        >
          {'\u00D7'}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StepNavigation — consistent prev / next bar for every step        */
/* ------------------------------------------------------------------ */

function StepNavigation(props: {
  onPrevious?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
      }}
    >
      {props.onPrevious ? (
        <PrimaryButton tone="ghost" onClick={props.onPrevious}>
          {props.previousLabel ?? 'Back'}
        </PrimaryButton>
      ) : (
        <div />
      )}
      {props.onNext ? (
        <PrimaryButton onClick={props.onNext} disabled={props.nextDisabled}>
          {props.nextLabel ?? 'Next'}
        </PrimaryButton>
      ) : (
        <div />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modals                                                             */
/* ------------------------------------------------------------------ */

function OnboardingModal(props: { open: boolean; onClose: () => void }) {
  if (!props.open) return null;
  return (
    <ModalBackdrop onClose={props.onClose}>
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 750,
            letterSpacing: 0.2,
            color: '#0E1020',
          }}
        >
          Welcome to Shelly
        </h2>
      </div>
      <div
        style={{
          padding: 20,
          display: 'grid',
          gap: 10,
          fontSize: 14,
          color: '#384165',
        }}
      >
        <p style={{ margin: 0 }}>
          In this short tour, you'll see how Shelly (our friendly sea turtle) chats with your explorer and what you see as a grown-up.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
          <li>First, a cozy voice chat where Shelly learns about your explorer.</li>
          <li>Then, brave "missions" that turn talk into tiny real-world actions.</li>
          <li>Finally, a simple parent view and a super-short check-in.</li>
        </ul>
      </div>
      <div
        style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <PrimaryButton onClick={props.onClose}>Get started</PrimaryButton>
      </div>
    </ModalBackdrop>
  );
}

function SelectRow<T extends string>(props: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; help?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, alignItems: 'center' }}>
      <div
        style={{
          color: 'var(--v2-text)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {props.label}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {props.options.map((o) => (
          <button
            key={o.value}
            onClick={() => props.onChange(o.value)}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              borderRadius: 999,
              padding: '8px 10px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: props.value === o.value ? 'rgba(120,140,255,0.32)' : 'rgba(255,255,255,0.16)',
              color: 'var(--v2-text)',
              fontWeight: 650,
              fontSize: 13,
            }}
            title={o.help}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function HelpIconButton(props: { 'aria-label': string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={props['aria-label']}
      onClick={props.onClick}
      style={{
        width: 26,
        height: 26,
        borderRadius: '999px',
        border: '1px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.08)',
        color: 'var(--v2-text-secondary)',
        fontSize: 14,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      ?
    </button>
  );
}

function InputRow(props: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, alignItems: 'center' }}>
      <div style={{ color: 'var(--v2-text-secondary)', fontSize: 13 }}>{props.label}</div>
      <input
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(0,0,0,0.18)',
          color: 'var(--v2-text)',
          outline: 'none',
        }}
      />
    </div>
  );
}

function DemoSettingsModal(props: {
  open: boolean;
  onClose: () => void;
  session: DemoSession;
  onUpdate: (patch: Partial<DemoSession>) => void;
}) {
  if (!props.open) return null;
  const theme = props.session.demoTheme ?? 'dark';
  const ageGroup = props.session.ageGroup ?? 'unknown';
  return (
    <ModalBackdrop onClose={props.onClose}>
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 750,
            letterSpacing: 0.2,
            color: '#0E1020',
          }}
        >
          Settings
        </h2>
      </div>
      <div
        style={{
          padding: 20,
          display: 'grid',
          gap: 14,
          fontSize: 15,
          color: '#384165',
        }}
      >
        <SelectRow
          label="Theme"
          value={theme}
          onChange={(v) => props.onUpdate({ demoTheme: v as DemoTheme })}
          options={[
            { value: 'dark', label: 'Cozy dark' },
            { value: 'light', label: 'Bright light' },
          ]}
        />
        <SelectRow
          label="Child age group"
          value={ageGroup}
          onChange={(v) => props.onUpdate({ ageGroup: v as DemoSession['ageGroup'] })}
          options={[
            { value: '4-6', label: '4-6 years' },
            { value: '7-9', label: '7-9 years' },
            { value: '10-12', label: '10-12 years' },
            { value: 'other', label: 'Mixed ages / other' },
            { value: 'unknown', label: "I'm not sure yet" },
          ]}
        />
        <SelectRow
          label="What should we show first?"
          value={props.session.parentPriority}
          onChange={(v) => props.onUpdate({ parentPriority: v as DemoParentPriority })}
          options={[
            { value: 'weeklySummary', label: 'Weekly-style summary' },
            { value: 'books', label: 'Book ideas' },
            { value: 'dinnerQuestions', label: 'Dinner questions' },
            { value: 'wishList', label: 'Wish list' },
          ]}
        />
      </div>
      <div
        style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <PrimaryButton tone="ghost" onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    </ModalBackdrop>
  );
}

function ConfirmModal(props: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!props.open) return null;
  return (
    <ModalBackdrop onClose={props.onCancel}>
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 750,
            letterSpacing: 0.2,
            color: '#0E1020',
          }}
        >
          {props.title}
        </h2>
      </div>
      <div
        style={{
          padding: 20,
          fontSize: 14,
          color: '#384165',
        }}
      >
        {props.body}
      </div>
      <div
        style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <PrimaryButton tone="ghost" onClick={props.onCancel}>
          {props.cancelLabel ?? 'Cancel'}
        </PrimaryButton>
        <PrimaryButton onClick={props.onConfirm}>{props.confirmLabel}</PrimaryButton>
      </div>
    </ModalBackdrop>
  );
}

function HelpModal(props: { section: 'voice' | 'missions' | 'parentDashboard' | 'survey'; onClose: () => void }) {
  let title = '';
  let body: React.ReactNode = null;
  if (props.section === 'voice') {
    title = 'How the chat works';
    body = (
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ margin: 0 }}>
          Shelly keeps chats short, warm, and age-aware. She listens for your explorer's name, what they love, and what
          feels a bit tricky.
        </p>
        <p style={{ margin: 0 }}>
          Everything runs through guardrails so the conversation stays kid-safe and focused on tiny, doable brave
          steps.
        </p>
      </div>
    );
  } else if (props.section === 'missions') {
    title = 'What are missions?';
    body = (
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ margin: 0 }}>
          Missions are tiny real-world challenges, like saying hi to a new classmate or trying a new game for five
          minutes.
        </p>
        <p style={{ margin: 0 }}>
          Shelly suggests 2-3 options and you choose what feels right. In the full app, completed missions grow a
          "courage garden" over time.
        </p>
      </div>
    );
  } else if (props.section === 'parentDashboard') {
    title = 'What this parent view shows';
    body = (
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ margin: 0 }}>
          This example view shows the kind of weekly summary you might see: themes from chats, mission activity, and gentle follow-ups.
        </p>
        <p style={{ margin: 0 }}>
          In a real account, this would draw from your child's actual missions and conversations.
        </p>
      </div>
    );
  } else if (props.section === 'survey') {
    title = 'Why this quick survey?';
    body = (
      <div style={{ display: 'grid', gap: 8 }}>
        <p style={{ margin: 0 }}>
          These questions help us learn whether this experience felt clear, safe, and helpful for your family.
        </p>
        <p style={{ margin: 0 }}>
          You can skip anything you like — we only use responses in aggregate to improve the experience.
        </p>
      </div>
    );
  }

  return (
    <ModalBackdrop onClose={props.onClose}>
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 750,
            letterSpacing: 0.2,
            color: '#0E1020',
          }}
        >
          {title}
        </h2>
      </div>
      <div
        style={{
          padding: 20,
          fontSize: 14,
          color: '#384165',
          display: 'grid',
          gap: 10,
        }}
      >
        {body}
      </div>
      <div
        style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <PrimaryButton tone="ghost" onClick={props.onClose}>
          Got it
        </PrimaryButton>
      </div>
    </ModalBackdrop>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress breadcrumb                                                */
/* ------------------------------------------------------------------ */

type DemoStage = 'setup' | 'talk' | 'missions' | 'parent' | 'survey';

const STAGES: Array<{ id: DemoStage; label: string }> = [
  { id: 'setup', label: 'Setup' },
  { id: 'talk', label: 'Talk' },
  { id: 'missions', label: 'Missions' },
  { id: 'parent', label: 'Parent view' },
  { id: 'survey', label: 'Check-in' },
];

function getStageForStep(step: DemoStep): DemoStage {
  switch (step) {
    case 'introParentSetup':
    case 'tattleCard':
    case 'childWarmupName':
      return 'setup';
    case 'childCourageConversation':
      return 'talk';
    case 'missionsPick':
    case 'missionDo':
    case 'wish':
      return 'missions';
    case 'parentDashboard':
      return 'parent';
    case 'survey':
    default:
      return 'survey';
  }
}

function StepMap(props: { step: DemoStep }) {
  const currentStage = getStageForStep(props.step);
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <nav
      aria-label="Session progress"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '8px 10px 4px',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.12)',
        margin: '0 auto',
      }}
    >
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const baseCircle: React.CSSProperties = {
          width: 18,
          height: 18,
          borderRadius: '999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
        };
        const circleStyle: React.CSSProperties = isCurrent
          ? {
              ...baseCircle,
              background: 'linear-gradient(135deg, rgba(70,120,255,0.95), rgba(135,80,255,0.95))',
              color: '#F5F7FF',
            }
          : isCompleted
            ? {
                ...baseCircle,
                background: 'rgba(120,140,255,0.35)',
                color: '#F5F7FF',
              }
            : {
                ...baseCircle,
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#D3DCFF',
              };

        return (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={circleStyle}>{index + 1}</div>
            <span
              style={{
                fontSize: 11,
                fontWeight: isCurrent ? 650 : 500,
                color: isCurrent ? '#F5F7FF' : 'rgba(215,222,255,0.8)',
                whiteSpace: 'nowrap',
              }}
            >
              {stage.label}
            </span>
            {index < STAGES.length - 1 && (
              <div
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 1,
                  borderRadius: 1,
                  background: 'rgba(255,255,255,0.18)',
                  marginLeft: 2,
                }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Step-specific components                                           */
/* ------------------------------------------------------------------ */

function MissionChoicesCard(props: {
  choices: DemoMissionChoice[];
  onAccept: (choice: DemoMissionChoice) => void;
  onDismiss: () => void;
  onTalkMore: () => void;
  onHelp: () => void;
}) {
  return (
    <Card
      title="Shelly suggests a brave mission"
      right={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <HelpIconButton aria-label="What are missions?" onClick={props.onHelp} />
          <button
            onClick={props.onDismiss}
            style={{
              appearance: 'none',
              border: 'none',
              background: 'transparent',
              color: 'var(--v2-text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Skip
          </button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 12 }}>
        {props.choices.map((c) => (
          <div
            key={c.__index}
            style={{
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              padding: 14,
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 800 }}>{c.title}</div>
              <div style={{ color: 'var(--v2-text-secondary)', fontSize: 12 }}>
                {c.difficulty ?? 'beginner'}
              </div>
            </div>
            <div style={{ color: 'var(--v2-text-secondary)', lineHeight: 1.35 }}>{c.description}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <PrimaryButton tone="ghost" onClick={props.onTalkMore}>
                Talk more
              </PrimaryButton>
              <PrimaryButton onClick={() => props.onAccept(c)}>Accept mission</PrimaryButton>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

type ChildAgeChoice = 'threeToFive' | 'sixToTen' | 'noShare';

function mapChildAgeChoiceToAgeGroup(choice: ChildAgeChoice): DemoSession['ageGroup'] {
  switch (choice) {
    case 'threeToFive':
      return '4-6';
    case 'sixToTen':
      return '7-9';
    case 'noShare':
    default:
      return 'unknown';
  }
}

function TattleCardPicker(props: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [revealAll, setRevealAll] = useState(false);

  const cards = getTattleCards();

  const rotationByIndex: number[] = [-4, 2, -1, 3, -3, 1];

  return (
    <Card title="Pick a Tattle Card">
      <div style={{ display: 'grid', gap: 12 }}>
        <InfoHint text="Tap a card to reveal it, then press Next when you're ready." />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--v2-text-secondary)',
          }}
        >
          <button
            type="button"
            onClick={() => setRevealAll((prev) => !prev)}
            style={{
              appearance: 'none',
              border: 'none',
              background: 'transparent',
              color: 'var(--v2-text-secondary)',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {revealAll ? 'Hide surprises' : 'Show all cards'}
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            justifyItems: 'center',
            alignItems: 'stretch',
            marginTop: 4,
          }}
        >
          {cards.map((card, index) => {
            const isSelected = props.selectedId === card.id;
            const isFaceUp = revealAll || isSelected;
            const baseRotation = rotationByIndex[index % rotationByIndex.length] || 0;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => props.onSelect(card.id)}
                style={{
                  width: '100%',
                  maxWidth: 120,
                  aspectRatio: '3 / 4',
                  textAlign: 'center',
                  padding: '10px 10px',
                  borderRadius: 18,
                  border: isSelected
                    ? '2px solid rgba(140,120,255,0.95)'
                    : '1px solid rgba(255,255,255,0.18)',
                  background: isFaceUp
                    ? 'linear-gradient(145deg, rgba(60,80,180,0.9), rgba(150,110,255,0.9))'
                    : 'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.16), rgba(40,40,70,0.95))',
                  boxShadow: isSelected
                    ? '0 8px 22px rgba(0,0,0,0.45)'
                    : '0 4px 14px rgba(0,0,0,0.35)',
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 4,
                  alignItems: 'center',
                  justifyItems: 'center',
                  transform: `rotate(${isSelected ? baseRotation * 0.5 : baseRotation}deg) scale(${
                    isSelected ? 1.05 : 1
                  })`,
                  transition:
                    'transform 160ms ease-out, box-shadow 160ms ease-out, border-color 160ms ease-out, background 160ms ease-out',
                  overflow: 'hidden',
                }}
              >
                {isFaceUp ? (
                  <>
                    <div style={{ fontSize: 22, lineHeight: 1 }}>{card.emoji}</div>
                    <div
                      style={{
                        fontWeight: 750,
                        fontSize: 13,
                        color: '#F5F7FF',
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(230,235,255,0.92)',
                        lineHeight: 1.3,
                      }}
                    >
                      {card.description}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 22, lineHeight: 1 }}>{card.emoji}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'rgba(220,225,255,0.9)',
                        fontWeight: 650,
                      }}
                    >
                      Secret card
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function PlayfulKeyboard(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  displayPlaceholder?: string;
}) {
  const valueRef = useRef(props.value);
  valueRef.current = props.value;

  const [useNative, setUseNative] = useState(false);
  const nativeRef = useRef<HTMLInputElement>(null);

  const punctuation = ['.', ',', '!', '?', "'", '-', ':'];
  const letterRows = [
    'QWERTYUIOP'.split(''),
    'ASDFGHJKL'.split(''),
    'ZXCVBNM'.split(''),
  ];

  const handleKey = useCallback(
    (key: string) => {
      const cur = valueRef.current;
      if (key === 'BACK') {
        props.onChange(cur.slice(0, -1));
      } else if (key === 'SPACE') {
        props.onChange(`${cur} `.replace(/\s+/g, ' '));
      } else {
        props.onChange(cur + key);
      }
    },
    [props.onChange],
  );

  const keyStyle = (wide?: boolean): React.CSSProperties => ({
    minWidth: wide ? 100 : 42,
    padding: '10px 12px',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--v2-text)',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  });

  if (useNative) {
    return (
      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        <input
          ref={nativeRef}
          autoFocus
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder ?? 'Type here\u2026'}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.35)',
            color: 'var(--v2-text)',
            fontSize: 18,
            fontWeight: 700,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => setUseNative(false)}
          style={{
            alignSelf: 'center',
            appearance: 'none',
            border: 'none',
            background: 'transparent',
            color: 'var(--v2-text-secondary)',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: 13,
            padding: 0,
          }}
        >
          Use fun keyboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
      {/* Value display (only in on-screen keyboard mode) */}
      {props.displayPlaceholder !== undefined && (
        <div
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.16)',
            background: 'rgba(0,0,0,0.3)',
            color: 'var(--v2-text)',
            fontSize: 20,
            fontWeight: 700,
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {props.value || (
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>{props.displayPlaceholder}</span>
          )}
        </div>
      )}

      <div
        style={{
          padding: 10,
          borderRadius: 18,
          background: 'rgba(0,0,0,0.35)',
          display: 'grid',
          gap: 7,
        }}
      >
        {/* Punctuation row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {punctuation.map((ch) => (
            <button key={ch} type="button" onClick={() => handleKey(ch)} style={keyStyle()}>
              {ch}
            </button>
          ))}
        </div>

        {/* Letter rows */}
        {letterRows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {row.map((key) => (
              <button key={key} type="button" onClick={() => handleKey(key.toLowerCase())} style={keyStyle()}>
                {key}
              </button>
            ))}
          </div>
        ))}

        {/* Bottom row: space + backspace */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <button type="button" onClick={() => handleKey('SPACE')} style={keyStyle(true)}>
            Space
          </button>
          <button type="button" onClick={() => handleKey('BACK')} style={keyStyle(true)}>
            {'\u232B'}
          </button>
        </div>

        {/* Native toggle */}
        <button
          type="button"
          onClick={() => setUseNative(true)}
          style={{
            justifySelf: 'center',
            appearance: 'none',
            border: 'none',
            background: 'transparent',
            color: 'var(--v2-text-secondary)',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: 13,
            padding: '2px 0 0',
          }}
        >
          Use my keyboard
        </button>
      </div>
    </div>
  );
}

function FunFactsBubbles(props: {
  selected: string[];
  onChange: (facts: string[]) => void;
  newFact: string;
  onChangeNewFact: (value: string) => void;
}) {
  const presets = ['I love dinosaurs', 'I can whistle', 'I like drawing', 'I love Lego'];

  const toggle = (fact: string) => {
    if (props.selected.includes(fact)) {
      props.onChange(props.selected.filter((f) => f !== fact));
    } else {
      props.onChange([...props.selected, fact]);
    }
  };

  const addNew = () => {
    const trimmed = props.newFact.trim();
    if (!trimmed) return;
    if (!props.selected.includes(trimmed)) {
      props.onChange([...props.selected, trimmed]);
    }
    props.onChangeNewFact('');
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {presets.map((fact) => {
          const active = props.selected.includes(fact);
          return (
            <button
              key={fact}
              type="button"
              onClick={() => toggle(fact)}
              style={{
                borderRadius: 999,
                padding: '6px 10px',
                border: active ? '2px solid rgba(90,130,255,0.95)' : '1px solid rgba(255,255,255,0.22)',
                background: active ? 'rgba(90,130,255,0.16)' : 'rgba(255,255,255,0.06)',
                cursor: 'pointer',
                color: 'var(--v2-text)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {fact}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input
          value={props.newFact}
          onChange={(e) => props.onChangeNewFact(e.target.value)}
          placeholder="Add your own\u2026"
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.25)',
            color: 'var(--v2-text)',
            outline: 'none',
            fontSize: 13,
          }}
        />
        <PrimaryButton tone="ghost" onClick={addNew}>
          Add
        </PrimaryButton>
      </div>
    </div>
  );
}

type ProfileSubstep = 'name' | 'age' | 'book' | 'facts';
const PROFILE_SUBSTEPS: ProfileSubstep[] = ['name', 'age', 'book', 'facts'];

function ChildProfileWizard(props: {
  name: string | null;
  ageGroup: DemoSession['ageGroup'] | undefined;
  favoriteBook: string;
  funFacts: string[];
  onChangeName: (name: string) => void;
  onChangeAgeGroup: (ageGroup: DemoSession['ageGroup']) => void;
  onChangeFavoriteBook: (book: string) => void;
  onChangeFunFacts: (facts: string[]) => void;
  newFunFact: string;
  onChangeNewFunFact: (value: string) => void;
  onBack?: () => void;
  onComplete: () => void;
}) {
  const [substep, setSubstep] = useState<ProfileSubstep>('name');

  const substepIdx = PROFILE_SUBSTEPS.indexOf(substep);
  const hasPrev = substepIdx > 0;
  const hasNext = substepIdx < PROFILE_SUBSTEPS.length - 1;

  const goPrev = () => {
    if (hasPrev) setSubstep(PROFILE_SUBSTEPS[substepIdx - 1]);
    else props.onBack?.();
  };
  const goNext = () => {
    if (hasNext) setSubstep(PROFILE_SUBSTEPS[substepIdx + 1]);
    else props.onComplete();
  };

  const ageChoice: ChildAgeChoice =
    props.ageGroup === '4-6' ? 'threeToFive' : props.ageGroup === '7-9' ? 'sixToTen' : 'noShare';

  const pillStyle = (active: boolean): React.CSSProperties => ({
    flex: '1 1 140px',
    minWidth: 0,
    padding: '14px 16px',
    borderRadius: 999,
    border: active ? '2px solid rgba(90,130,255,0.95)' : '1px solid rgba(255,255,255,0.20)',
    background: active ? 'rgba(90,130,255,0.18)' : 'rgba(255,255,255,0.04)',
    cursor: 'pointer',
    color: 'var(--v2-text)',
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    transition: 'border-color 120ms, background 120ms',
  });

  return (
    <div style={{ display: 'grid', gap: 14, width: '100%', maxWidth: 480 }}>
      {/* Sub-step progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {PROFILE_SUBSTEPS.map((s, i) => (
          <div
            key={s}
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background:
                i === substepIdx
                  ? 'rgba(90,130,255,0.95)'
                  : i < substepIdx
                    ? 'rgba(90,130,255,0.45)'
                    : 'rgba(255,255,255,0.18)',
              transition: 'background 200ms',
            }}
          />
        ))}
      </div>

      {/* ---- Name ---- */}
      {substep === 'name' && (
        <Card title="What should Shelly call you?">
          <PlayfulKeyboard
            value={props.name ?? ''}
            onChange={props.onChangeName}
            placeholder="Type your name"
            displayPlaceholder="Your name"
          />
        </Card>
      )}

      {/* ---- Age ---- */}
      {substep === 'age' && (
        <Card title="How old are you?">
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { id: 'threeToFive' as ChildAgeChoice, label: 'Three to Five' },
              { id: 'sixToTen' as ChildAgeChoice, label: 'Six to Ten' },
              { id: 'noShare' as ChildAgeChoice, label: "I don't wanna share" },
            ].map((opt) => {
              const active = ageChoice === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    props.onChangeAgeGroup(mapChildAgeChoiceToAgeGroup(opt.id));
                  }}
                  style={pillStyle(active)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* ---- Favorite Book ---- */}
      {substep === 'book' && (
        <Card title="What's your favorite book?">
          <InfoHint text="You can skip this one if you want!" />
          <PlayfulKeyboard
            value={props.favoriteBook}
            onChange={props.onChangeFavoriteBook}
            placeholder="Type a book name"
            displayPlaceholder="e.g. The Pout-Pout Fish"
          />
        </Card>
      )}

      {/* ---- Fun Facts ---- */}
      {substep === 'facts' && (
        <Card title="Tell us something cool about you!">
          <div style={{ display: 'grid', gap: 10 }}>
            <InfoHint text="Tap any that sound like you, or add your own!" />
            <FunFactsBubbles
              selected={props.funFacts}
              onChange={props.onChangeFunFacts}
              newFact={props.newFunFact}
              onChangeNewFact={props.onChangeNewFunFact}
            />
          </div>
        </Card>
      )}

      {/* Navigation */}
      <StepNavigation
        onPrevious={hasPrev || props.onBack ? goPrev : undefined}
        onNext={goNext}
        nextLabel={substep === 'facts' ? 'Continue to Shelly' : 'Next'}
      />
    </div>
  );
}

function DemoParentDashboard(props: {
  parentPriority: DemoParentPriority;
  childName: string | null;
  topics: string[];
  messages: Message[];
  completedCount: number;
  activeCount: number;
  onChangePriority: (p: DemoParentPriority) => void;
  onEndDemo: () => void;
  onHelp: () => void;
}) {
  const recommendedBooks = useMemo(() => {
    const safeBooks = (books as Book[]) ?? [];
    if (props.topics.length === 0) return safeBooks.slice(0, 4);
    const lowerTopics = new Set(props.topics.map((t) => t.toLowerCase()));
    const byTag = safeBooks.filter((b) => {
      const rec = Array.isArray(b.recommendedFor) ? b.recommendedFor : [];
      return rec.some((t) => lowerTopics.has(String(t).toLowerCase()));
    });
    return (byTag.length ? byTag : safeBooks).slice(0, 4);
  }, [props.topics]);

  const highlights = useMemo(() => {
    const lastUser = [...props.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const lastAssistant = [...props.messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';
    return [
      lastUser ? `Child said: "${lastUser.slice(0, 120)}${lastUser.length > 120 ? '\u2026' : ''}"` : null,
      lastAssistant ? `Shelly responded: "${lastAssistant.slice(0, 120)}${lastAssistant.length > 120 ? '\u2026' : ''}"` : null,
    ].filter(Boolean) as string[];
  }, [props.messages]);

  return (
    <div
      style={{
        display: 'grid',
        gap: 14,
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <Card
          title="Parent dashboard"
          right={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <HelpIconButton aria-label="What is in this parent view?" onClick={props.onHelp} />
              <PrimaryButton tone="ghost" onClick={props.onEndDemo}>
                End session
              </PrimaryButton>
            </div>
          }
        >
          <InfoHint text={`Here's what Shelly learned about ${props.childName ?? 'your child'} today.`} />
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div
                style={{
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 12,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--v2-text-secondary)' }}>Missions</div>
                <div style={{ fontWeight: 800 }}>
                  {props.completedCount} completed \u00B7 {props.activeCount} active
                </div>
              </div>
              <div
                style={{
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 12,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--v2-text-secondary)' }}>Topics</div>
                <div style={{ fontWeight: 800 }}>{props.topics.length ? props.topics.slice(0, 3).join(', ') : '\u2014'}</div>
              </div>
            </div>

            {highlights.length > 0 && (
              <div style={{ borderLeft: '3px solid rgba(140,120,255,0.6)', paddingLeft: 10, display: 'grid', gap: 6 }}>
                {highlights.map((h) => (
                  <div key={h} style={{ color: 'var(--v2-text-secondary)', lineHeight: 1.35 }}>
                    {h}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 14,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {[
              { value: 'weeklySummary' as DemoParentPriority, label: 'Summary' },
              { value: 'dinnerQuestions' as DemoParentPriority, label: 'Dinner questions' },
              { value: 'books' as DemoParentPriority, label: 'Books' },
              { value: 'wishList' as DemoParentPriority, label: 'Wish list' },
            ].map((opt) => {
              const isActive = props.parentPriority === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => props.onChangePriority(opt.value)}
                  style={{
                    appearance: 'none',
                    cursor: 'pointer',
                    borderRadius: 999,
                    padding: '6px 10px',
                    border: isActive ? '2px solid rgba(140,120,255,0.9)' : '1px solid rgba(255,255,255,0.18)',
                    background: isActive ? 'rgba(140,120,255,0.22)' : 'rgba(255,255,255,0.06)',
                    color: 'var(--v2-text)',
                    fontSize: 12,
                    fontWeight: 650,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div>
        {props.parentPriority === 'weeklySummary' && (
          <Card title="Weekly-style summary">
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: 'var(--v2-text-secondary)', lineHeight: 1.5 }}>
              <li>Confidence-building: {props.completedCount ? 'showing progress' : 'getting started'}</li>
              <li>Curiosity topics: {props.topics.length ? props.topics.slice(0, 5).join(', ') : 'not enough data yet'}</li>
              <li>Next step: choose a small mission and celebrate completion</li>
            </ul>
          </Card>
        )}

        {props.parentPriority === 'dinnerQuestions' && (
          <Card title="Dinner questions">
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--v2-text-secondary)', lineHeight: 1.55 }}>
              <li>What was the bravest tiny thing you did today?</li>
              <li>What's something you want to get better at this week?</li>
              <li>If Shelly could join dinner, what would you teach her?</li>
            </ul>
          </Card>
        )}

        {props.parentPriority === 'books' && (
          <Card title="Recommended books">
            <div style={{ display: 'grid', gap: 10 }}>
              {recommendedBooks.map((b) => (
                <div
                  key={b.title}
                  style={{
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 14,
                    padding: 12,
                    background: 'rgba(0,0,0,0.16)',
                    display: 'grid',
                    gap: 4,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{b.title}</div>
                  <div style={{ color: 'var(--v2-text-secondary)', fontSize: 13 }}>{b.author}</div>
                  {b.whyRecommended && (
                    <div style={{ color: 'var(--v2-text-secondary)', fontSize: 13 }}>{b.whyRecommended}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {props.parentPriority === 'wishList' && (
          <Card title="Wish list">
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: 'var(--v2-text-secondary)', lineHeight: 1.55 }}>
              <li>Plant a tiny "bravery seed" (sticker chart)</li>
              <li>Pick a weekend adventure together</li>
              <li>Write a proud note and save it</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main DemoFlow component                                            */
/* ------------------------------------------------------------------ */

export default function DemoFlow() {
  const { status, requestPermission } = useMicPermission();

  const [session, setSession] = useState<DemoSession>(() => {
    const loaded = loadDemoSession();
    if (loaded.step === 'introParentSetup') {
      return { ...loaded, step: getFirstStep(SKIPPED_STEPS) };
    }
    return loaded;
  });
  const step: DemoStep = session.step;

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !session.hasSeenOnboarding);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [helpSection, setHelpSection] = useState<'voice' | 'missions' | 'parentDashboard' | 'survey' | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const updateSession = useCallback((patch: Partial<DemoSession>) => {
    setSession((prev) => {
      const next: DemoSession = {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      saveDemoSession(next);
      return next;
    });
  }, []);

  const goToStep = useCallback(
    (target: DemoStep) => updateSession({ step: target }),
    [updateSession],
  );

  const goForward = useCallback(() => {
    const next = getNextStep(step, SKIPPED_STEPS);
    if (next) updateSession({ step: next });
  }, [step, updateSession]);

  const goBack = useCallback(() => {
    const prev = getPreviousStep(step, SKIPPED_STEPS);
    if (prev) updateSession({ step: prev });
  }, [step, updateSession]);

  const { childName, messages: savedMessages, topics, saveChildName, saveTopic, saveMessages, clearAll } =
    usePersonalMemory(undefined);

  const { activeMissions, completedMissions, addMission, completeMission, deleteMission } =
    useMissions(undefined);

  const providerRef = useRef<ReturnType<typeof createVoiceProvider> | null>(null);
  if (!providerRef.current) providerRef.current = createVoiceProvider();

  const [pendingMissionChoices, setPendingMissionChoices] = useState<MissionSuggestion[] | null>(null);
  const pendingChoices: DemoMissionChoice[] = useMemo(
    () => (pendingMissionChoices ?? []).map((c, i) => ({ ...c, __index: i })),
    [pendingMissionChoices],
  );

  const difficultyProfile: 'beginner' | 'intermediate' | 'confident' =
    completedMissions.length >= 5 ? 'confident' : completedMissions.length >= 2 ? 'intermediate' : 'beginner';

  const activeMission = activeMissions[0] ?? null;

  const voice = useVoiceSession(providerRef.current, {
    autoConnect: step === 'childCourageConversation' && status === 'granted',
    initialMessages: savedMessages,
    childName,
    topics,
    difficultyProfile,
    activeMission,
    ageGroup: session.ageGroup ?? null,
    favoriteBook: session.favoriteBook ?? null,
    funFacts: session.funFacts ?? [],
    onChildName: saveChildName,
    onTopic: saveTopic,
    onMessagesChange: saveMessages,
    onMissionChoices: (choices) => {
      setPendingMissionChoices(choices);
    },
  });

  const hasError = !!voice.error;
  const statusBadge = hasError ? 'error' : voice.state === 'connecting' ? 'warning' : 'ok';
  const callActive = ACTIVE_STATES.has(voice.state);

  useEffect(() => {
    if (!session.demoId && typeof window !== 'undefined') {
      const randomId = `TT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      updateSession({ demoId: randomId });
    }
  }, [session.demoId, updateSession]);

  // Persist a session row immediately so the parent page can find it even before
  // the child has entered any data. Subsequent upserts add richer fields.
  const earlyPersistDone = useRef(false);
  useEffect(() => {
    if (earlyPersistDone.current) return;
    if (!session.demoId) return;
    earlyPersistDone.current = true;
    void fetch('/api/demo/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        demoId: session.demoId,
        childName: childName ?? null,
        ageGroup: session.ageGroup ?? null,
        favoriteBook: session.favoriteBook ?? '',
        funFacts: session.funFacts ?? [],
      }),
    }).catch(() => {});
  }, [childName, session.ageGroup, session.demoId, session.favoriteBook, session.funFacts]);

  useEffect(() => {
    if (step !== 'survey' || !session.demoId) return;
    const payload = {
      demoId: session.demoId,
      childName,
      ageGroup: session.ageGroup ?? null,
      favoriteBook: session.favoriteBook ?? '',
      funFacts: session.funFacts ?? [],
      completedMissionsCount: completedMissions.length,
      wishChoice: session.wishChoice ?? null,
      topics,
      messagesSummary: (voice.messages ?? []).slice(-6),
    };
    void fetch('/api/demo/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [
    childName,
    completedMissions.length,
    session.ageGroup,
    session.demoId,
    session.favoriteBook,
    session.funFacts,
    session.wishChoice,
    step,
    topics,
    voice.messages,
  ]);

  const [newFunFact, setNewFunFact] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const typedBusyRef = useRef(false);

  const submitTyped = useCallback(async () => {
    const text = typedInput.trim();
    if (!text) return;
    if (typedBusyRef.current) return;
    typedBusyRef.current = true;
    try {
      const res = await fetch('/api/demo/talk-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: text,
          context: {
            messages: (voice.messages ?? []).slice(-20),
            childName,
            topics,
            difficultyProfile,
            activeMission,
          },
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        userText: string;
        responseText: string;
        mood?: string;
        missionChoices?: MissionSuggestion[];
        childName?: string;
        topic?: string;
      };
      const nextMessages: Message[] = [
        ...(voice.messages ?? []),
        { role: 'user', content: data.userText },
        ...(data.responseText ? [{ role: 'assistant', content: data.responseText } as const] : []),
      ];
      saveMessages(nextMessages);
      if (data.childName) saveChildName(data.childName);
      if (data.topic) saveTopic(data.topic);
      if (data.missionChoices?.length) {
        setPendingMissionChoices(data.missionChoices);
        updateSession({ step: 'missionsPick' });
      }
      setTypedInput('');
    } finally {
      typedBusyRef.current = false;
    }
  }, [activeMission, childName, difficultyProfile, saveChildName, saveMessages, saveTopic, topics, typedInput, updateSession, voice.messages]);

  const goNext = useCallback((next: DemoStep) => updateSession({ step: next }), [updateSession]);

  const resetAll = useCallback(() => {
    clearDemoSession();
    const fresh = createFreshDemoSession();
    fresh.step = getFirstStep(SKIPPED_STEPS);
    setSession(fresh);
    setPendingMissionChoices(null);
    clearAll();
    try {
      const db = getGuestDb();
      const id = typeof window !== 'undefined' ? getDeviceId() : 'default';
      void db.clearMissions?.(id);
    } catch {
      // ignore
    }
  }, [clearAll]);

  // Auto-advance past skipped steps
  useEffect(() => {
    if (SKIPPED_STEPS.has(step)) {
      const next = getNextStep(step, SKIPPED_STEPS);
      if (next) {
        updateSession({ step: next });
      }
    }
  }, [step, updateSession]);

  useEffect(() => {
    if (step === 'tattleCard' && !session.hasSeenOnboarding && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [session.hasSeenOnboarding, showOnboarding, step]);

  useEffect(() => {
    if (!callActive && pendingMissionChoices != null && step === 'childCourageConversation') {
      updateSession({ step: 'missionsPick' });
    }
  }, [callActive, pendingMissionChoices, step, updateSession]);

  useEffect(() => {
    if (step === 'missionsPick' && pendingMissionChoices == null) {
      updateSession({ step: 'childCourageConversation' });
    }
  }, [pendingMissionChoices, step, updateSession]);

  // Navigation helpers that respect the step ordering
  const previousStep = getPreviousStep(step, SKIPPED_STEPS);
  const nextStep = getNextStep(step, SKIPPED_STEPS);

  if (status === 'checking') {
    return (
      <DemoShell onResetAll={resetAll} theme={session.demoTheme ?? 'dark'}>
        <main style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
          <p style={{ color: 'var(--v2-text-secondary)' }}>Loading\u2026</p>
        </main>
      </DemoShell>
    );
  }

  if (status === 'denied' || status === 'prompt') {
    return (
      <DemoShell onResetAll={resetAll} theme={session.demoTheme ?? 'dark'}>
        <MicPermissionV2 onGranted={requestPermission} onDenied={() => {}} />
      </DemoShell>
    );
  }

  return (
    <DemoShell onResetAll={() => setConfirmResetOpen(true)} theme={session.demoTheme ?? 'dark'}>
      <OnboardingModal
        open={showOnboarding && step === 'tattleCard' && status === 'granted'}
        onClose={() => {
          setShowOnboarding(false);
          updateSession({ hasSeenOnboarding: true });
        }}
      />
      <DemoSettingsModal open={showSettings} onClose={() => setShowSettings(false)} session={session} onUpdate={updateSession} />
      <ConfirmModal
        open={confirmResetOpen}
        title="Start over?"
        body="This clears the current missions, notes, and local progress on this device so you can start fresh."
        confirmLabel="Yes, start over"
        cancelLabel="Keep current run"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          setConfirmResetOpen(false);
          resetAll();
        }}
      />
      <ConfirmModal
        open={confirmEndOpen}
        title="End this walkthrough?"
        body="You'll jump to the quick feedback page. You can always start another session afterwards."
        confirmLabel="Go to feedback"
        onCancel={() => setConfirmEndOpen(false)}
        onConfirm={() => {
          setConfirmEndOpen(false);
          goNext('survey');
        }}
      />
      {helpSection && <HelpModal section={helpSection} onClose={() => setHelpSection(null)} />}

      {showQrModal && (
        <ModalBackdrop onClose={() => setShowQrModal(false)}>
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 750,
                letterSpacing: 0.2,
                color: '#0E1020',
                textAlign: 'center',
              }}
            >
              Parent, scan here to check progress
            </h2>
            <div
              style={{
                padding: 12,
                borderRadius: 16,
                border: '1px solid rgba(0,0,40,0.08)',
                background: '#fff',
                display: 'inline-flex',
              }}
            >
              <QRCode
                value={
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/demo/parent?session=${session.demoId ?? ''}`
                    : '/demo/parent'
                }
                size={160}
                bgColor="#ffffff"
                fgColor="#0E1020"
              />
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#384165',
                textAlign: 'center',
              }}
            >
              Session ID:{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>
                {session.demoId || '\u2026'}
              </span>
            </div>
          </div>
          <div
            style={{
              padding: 16,
              borderTop: '1px solid rgba(0,0,40,0.06)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <PrimaryButton tone="ghost" onClick={() => setShowQrModal(false)}>
              Close
            </PrimaryButton>
          </div>
        </ModalBackdrop>
      )}

      <div
        style={{
          position: 'fixed',
          top: 'max(74px, env(safe-area-inset-top))',
          right: 'max(16px, env(safe-area-inset-right))',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <TalkStatusIndicator status={statusBadge} hasError={hasError} />
      </div>

      <main
        style={{
          maxWidth: 980,
          margin: '0 auto',
          padding: 24,
          display: 'grid',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 20,
            alignContent: 'center',
            minHeight: 'calc(100vh - 160px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <StepMap step={step} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: 'rgba(215,222,255,0.7)',
                  letterSpacing: 0.5,
                }}
              >
                {session.demoId || '\u2026'}
              </span>
              <button
                type="button"
                aria-label="Show QR code for parent"
                onClick={() => setShowQrModal(true)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(215,222,255,0.8)',
                  transition: 'background 150ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="8" height="8" rx="1" />
                  <rect x="14" y="2" width="8" height="8" rx="1" />
                  <rect x="2" y="14" width="8" height="8" rx="1" />
                  <rect x="14" y="14" width="4" height="4" rx="0.5" />
                  <line x1="22" y1="14" x2="22" y2="18" />
                  <line x1="18" y1="22" x2="22" y2="22" />
                  <rect x="5" y="5" width="2" height="2" rx="0.25" fill="currentColor" stroke="none" />
                  <rect x="17" y="5" width="2" height="2" rx="0.25" fill="currentColor" stroke="none" />
                  <rect x="5" y="17" width="2" height="2" rx="0.25" fill="currentColor" stroke="none" />
                </svg>
              </button>
            </div>
          </div>

          {/* ---- tattleCard ---- */}
          {step === 'tattleCard' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <TattleCardPicker
                selectedId={session.tattleCardId ?? null}
                onSelect={(id) => {
                  updateSession({ tattleCardId: id });
                }}
              />
              <StepNavigation
                onPrevious={previousStep ? goBack : undefined}
                onNext={() => {
                  if (!session.tattleCardId) {
                    updateSession({ tattleCardId: 'physical' });
                  }
                  goForward();
                }}
                nextLabel="Next"
              />
            </div>
          )}

          {/* ---- childWarmupName ---- */}
          {step === 'childWarmupName' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <ChildProfileWizard
                name={childName}
                ageGroup={session.ageGroup}
                favoriteBook={session.favoriteBook ?? ''}
                funFacts={session.funFacts ?? []}
                onChangeName={saveChildName}
                onChangeAgeGroup={(ageGroup) => updateSession({ ageGroup })}
                onChangeFavoriteBook={(favoriteBook) => updateSession({ favoriteBook })}
                onChangeFunFacts={(funFacts) => updateSession({ funFacts })}
                newFunFact={newFunFact}
                onChangeNewFunFact={setNewFunFact}
                onBack={previousStep ? goBack : undefined}
                onComplete={goForward}
              />
            </div>
          )}

          {/* ---- childCourageConversation (centered single-column) ---- */}
          {(step === 'childCourageConversation' || (step === 'missionsPick' && callActive)) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                maxWidth: 500,
                margin: '0 auto',
                width: '100%',
                paddingBottom: 120,
              }}
            >
              <ShellyLogoPlaceholder animate={voice.state === 'connecting'} compact={voice.state !== 'idle'} />
              <TalkConversationCard
                messages={voice.messages}
                pendingUserTranscript={voice.pendingUserTranscript}
                isThinking={voice.state === 'processing'}
                state={voice.state}
                hideIntroCopy
              />
            </div>
          )}

          {/* ---- missionsPick modal ---- */}
          {step === 'missionsPick' && pendingChoices.length > 0 && !callActive && (
            <ModalBackdrop onClose={() => {
              setPendingMissionChoices(null);
              updateSession({ step: 'wish', missionStatus: 'dismissed' });
            }}>
              <div style={{ padding: 20, maxHeight: '80vh', overflowY: 'auto' }}>
                <MissionChoicesCard
                  choices={pendingChoices}
                  onDismiss={() => {
                    setPendingMissionChoices(null);
                    updateSession({ step: 'wish', missionStatus: 'dismissed' });
                  }}
                  onTalkMore={() => {
                    setPendingMissionChoices(null);
                    updateSession({ step: 'childCourageConversation' });
                    void voice.startListening();
                  }}
                  onHelp={() => setHelpSection('missions')}
                  onAccept={(choice) => {
                    addMission(choice);
                    setPendingMissionChoices(null);
                    updateSession({ step: 'missionDo', missionStatus: 'active' });
                  }}
                />
                <div style={{ marginTop: 12 }}>
                  <StepNavigation
                    onPrevious={() => goToStep('childCourageConversation')}
                    onNext={() => goToStep('wish')}
                    nextLabel="Skip missions"
                  />
                </div>
              </div>
            </ModalBackdrop>
          )}

          <section
            style={{
              display: 'grid',
              gap: 20,
              justifyItems: 'center',
            }}
          >
              {/* ---- missionDo ---- */}
              {step === 'missionDo' && (
                <div style={{ display: 'grid', gap: 12, width: '100%' }}>
                  <Card
                    title={activeMissions[0]?.title ?? 'Your brave mission'}
                    right={<HelpIconButton aria-label="What does this mission do?" onClick={() => setHelpSection('missions')} />}
                  >
                    {activeMissions[0]?.description && (
                      <p style={{ margin: '0 0 8px', color: 'var(--v2-text-secondary)', lineHeight: 1.4 }}>
                        {activeMissions[0].description}
                      </p>
                    )}
                    <InfoHint text="Complete it or skip for now!" />
                    <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <PrimaryButton
                        tone="ghost"
                        onClick={() => {
                          const m = activeMissions[0];
                          if (m) deleteMission(m.id);
                          updateSession({ step: 'wish', missionStatus: 'dismissed' });
                        }}
                      >
                        Dismiss
                      </PrimaryButton>
                      <PrimaryButton
                        onClick={() => {
                          const m = activeMissions[0];
                          if (m) completeMission(m.id);
                          updateSession({ step: 'wish', missionStatus: 'completed' });
                        }}
                      >
                        Mark complete
                      </PrimaryButton>
                    </div>
                  </Card>
                  <StepNavigation
                    onPrevious={() => goToStep('missionsPick')}
                    onNext={() => goToStep('wish')}
                  />
                </div>
              )}

              {/* ---- wish ---- */}
              {step === 'wish' && (
                <div style={{ display: 'grid', gap: 12, width: '100%' }}>
                  <Card title="Make a wish">
                    <div style={{ display: 'grid', gap: 10 }}>
                      <InfoHint text="Pick how you'd like to make your wish!" />
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          marginTop: 6,
                        }}
                      >
                        {[
                          { id: 'solo' as const, label: 'Just me (solo)' },
                          { id: 'withParent' as const, label: 'With my grown-up' },
                          { id: 'withFriend' as const, label: 'With a friend' },
                        ].map((opt) => {
                          const active = session.wishChoice === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (session.wishChoice !== opt.id && typeof window !== 'undefined') {
                                  void confetti({
                                    particleCount: 60,
                                    spread: 60,
                                    startVelocity: 35,
                                    gravity: 0.9,
                                    origin: { y: 0.85 },
                                  });
                                }
                                updateSession({ wishChoice: opt.id });
                              }}
                              style={{
                                flex: '1 1 150px',
                                minWidth: 0,
                                padding: '8px 10px',
                                borderRadius: 999,
                                border: active
                                  ? '2px solid rgba(140,120,255,0.95)'
                                  : '1px solid rgba(255,255,255,0.20)',
                                background: active ? 'rgba(140,120,255,0.22)' : 'rgba(255,255,255,0.06)',
                                cursor: 'pointer',
                                color: 'var(--v2-text)',
                                fontSize: 13,
                                fontWeight: 600,
                                textAlign: 'center',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                  <StepNavigation
                    onPrevious={previousStep ? goBack : undefined}
                    onNext={goForward}
                  />
                </div>
              )}

              {/* ---- parentDashboard (kept for direct navigation / parent flow) ---- */}
              {step === 'parentDashboard' && (
                <DemoParentDashboard
                  parentPriority={session.parentPriority}
                  childName={childName}
                  topics={topics}
                  messages={voice.messages}
                  completedCount={completedMissions.length}
                  activeCount={activeMissions.length}
                  onChangePriority={(p) => updateSession({ parentPriority: p })}
                  onEndDemo={() => setConfirmEndOpen(true)}
                  onHelp={() => setHelpSection('parentDashboard')}
                />
              )}

              {/* ---- survey ---- */}
              {step === 'survey' && (
                <div style={{ display: 'grid', gap: 12, width: '100%' }}>
                  <Card
                    title="Quick check-in"
                    right={<HelpIconButton aria-label="Why this quick survey?" onClick={() => setHelpSection('survey')} />}
                  >
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, alignItems: 'center' }}>
                        <div style={{ color: 'var(--v2-text-secondary)', fontSize: 13 }}>How did this feel?</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {[
                            { value: 1 as const, label: '\u{1F615}', title: 'Not quite right' },
                            { value: 3 as const, label: '\u{1F642}', title: 'Nice start' },
                            { value: 5 as const, label: '\u{1F929}', title: 'Loved it' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateSession({ survey: { ...session.survey, rating: opt.value } })}
                              style={{
                                appearance: 'none',
                                cursor: 'pointer',
                                borderRadius: 999,
                                padding: '8px 12px',
                                border: session.survey.rating === opt.value
                                  ? '2px solid rgba(140,120,255,0.95)'
                                  : '1px solid rgba(255,255,255,0.14)',
                                background:
                                  session.survey.rating === opt.value ? 'rgba(140,120,255,0.22)' : 'rgba(255,255,255,0.05)',
                                fontSize: 20,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              aria-pressed={session.survey.rating === opt.value}
                              title={opt.title}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12 }}>
                        <div style={{ color: 'var(--v2-text-secondary)', fontSize: 13 }}>Feedback</div>
                        <textarea
                          value={session.survey.feedback}
                          onChange={(e) => updateSession({ survey: { ...session.survey, feedback: e.target.value } })}
                          placeholder="What should we improve?"
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.14)',
                            background: 'rgba(0,0,0,0.18)',
                            color: 'var(--v2-text)',
                            outline: 'none',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                      <InputRow
                        label="Email (optional, for waitlist)"
                        value={session.survey.email}
                        placeholder="you@example.com"
                        onChange={(v) => updateSession({ survey: { ...session.survey, email: v } })}
                      />
                      <SelectRow
                        label="Try the full version when it's ready?"
                        value={session.survey.wantsFullVersion === null ? 'maybe' : session.survey.wantsFullVersion ? 'yes' : 'no'}
                        onChange={(v) =>
                          updateSession({
                            survey: {
                              ...session.survey,
                              wantsFullVersion: v === 'maybe' ? null : v === 'yes',
                            },
                          })
                        }
                        options={[
                          { value: 'yes', label: 'Yes' },
                          { value: 'no', label: 'No' },
                          { value: 'maybe', label: 'Not sure' },
                        ]}
                      />
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                          gap: 16,
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'grid', gap: 8 }}>
                          <div style={{ color: 'var(--v2-text-secondary)', fontSize: 13 }}>
                            Scan this on your phone to open the parent demo.
                          </div>
                          <div
                            style={{
                              padding: 8,
                              borderRadius: 16,
                              border: '1px solid rgba(255,255,255,0.18)',
                              background: 'rgba(0,0,0,0.28)',
                              display: 'inline-flex',
                            }}
                          >
                            <QRCode
                              value={
                                typeof window !== 'undefined'
                                  ? `${window.location.origin}/demo/parent?session=${session.demoId ?? ''}`
                                  : '/demo/parent'
                              }
                              size={96}
                              bgColor="transparent"
                              fgColor="#F5F7FF"
                            />
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--v2-text-secondary)',
                              wordBreak: 'break-all',
                            }}
                          >
                            Session ID:{' '}
                            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                              {session.demoId || '\u2026'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                  <StepNavigation
                    onPrevious={previousStep ? goBack : undefined}
                    onNext={() => resetAll()}
                    nextLabel="Start over"
                  />
                </div>
              )}
          </section>
        </div>
      </main>

      {/* Bottom bar with voice controls -- centered column layout */}
      {(step === 'childCourageConversation' || (step === 'missionsPick' && callActive)) && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 45,
            padding: 'max(16px, env(safe-area-inset-bottom)) 20px',
            background: 'linear-gradient(to top, rgba(10,10,14,0.92) 60%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          {previousStep && (
            <PrimaryButton
              tone="ghost"
              onClick={goBack}
              style={{ fontSize: 13, padding: '8px 12px' }}
            >
              Back
            </PrimaryButton>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <TalkEndCallButton
              state={voice.state}
              hasError={hasError}
              missionGenerated={!!pendingMissionChoices && callActive}
              onEnd={() => {
                voice.endConversation();
                const dest: DemoStep = pendingChoices.length > 0 ? 'missionsPick' : 'wish';
                updateSession({ step: dest });
              }}
              onRetry={voice.startListening}
              onStart={voice.startListening}
            />
            <TalkMuteToggle isMuted={voice.isMuted} onToggle={voice.toggleMute} callActive={callActive} />
          </div>

          {!callActive && (
            <PrimaryButton
              onClick={() => {
                const dest = pendingChoices.length > 0 ? 'missionsPick' : 'wish';
                updateSession({ step: dest as DemoStep });
              }}
              style={{ fontSize: 13, padding: '8px 12px' }}
            >
              Next
            </PrimaryButton>
          )}
        </div>
      )}
    </DemoShell>
  );
}
