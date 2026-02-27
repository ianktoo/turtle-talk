'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@/lib/speech/types';

const KEY_NAME = 'turtle-talk-child-name';
const KEY_MSGS = 'turtle-talk-messages';
const KEY_TOPICS = 'turtle-talk-topics';
const MAX_MESSAGES = 20;
const MAX_TOPICS = 15;

function loadString(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function persist(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

function removeKeys(...keys: string[]): void {
  try { keys.forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
}

export function usePersonalMemory() {
  const [childName, setChildName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    setChildName(loadString(KEY_NAME));
    setMessages(loadJSON<Message[]>(KEY_MSGS, []));
    setTopics(loadJSON<string[]>(KEY_TOPICS, []));
  }, []);

  const saveChildName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setChildName(trimmed);
    persist(KEY_NAME, trimmed);
  }, []);

  const saveMessages = useCallback((msgs: Message[]) => {
    const trimmed = msgs.slice(-MAX_MESSAGES);
    setMessages(trimmed);
    persist(KEY_MSGS, JSON.stringify(trimmed));
  }, []);

  const saveTopic = useCallback((topic: string) => {
    const normalised = topic.trim().toLowerCase();
    if (!normalised) return;
    setTopics((prev) => {
      const deduped = [normalised, ...prev.filter((t) => t !== normalised)].slice(0, MAX_TOPICS);
      persist(KEY_TOPICS, JSON.stringify(deduped));
      return deduped;
    });
  }, []);

  const clearAll = useCallback(() => {
    removeKeys(KEY_NAME, KEY_MSGS, KEY_TOPICS);
    setChildName(null);
    setMessages([]);
    setTopics([]);
  }, []);

  return { childName, messages, topics, saveChildName, saveMessages, saveTopic, clearAll };
}
