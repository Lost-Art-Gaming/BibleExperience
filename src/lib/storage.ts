// LocalStorage persistence for theme, notes, reading position and completion.
// Keep storage access isolated so UI components do not own persistence details.

const STORAGE = {
  theme: 'be-theme',
  notes: 'be-notes',
  lastRead: 'be-lastread',
} as const;

export type Theme = 'light' | 'dark';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage is optional; reading progress should never crash the reader. */
  }
}

export function isDone(id: string): boolean {
  return localStorage.getItem(`be-episode-${id}`) === 'done';
}

export function setDone(id: string): void {
  localStorage.setItem(`be-episode-${id}`, 'done');
}

export function getTheme(): Theme {
  return localStorage.getItem(STORAGE.theme) === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE.theme, theme);
}

export function cleanTitle(value = ''): string {
  return value.replace(/[“”]/g, '');
}

/* ---- Personal layer: notes + resume --------------------------- */

export function getNote(episodeId: string): string {
  const all = readJson<Record<string, string>>(STORAGE.notes, {});
  return typeof all[episodeId] === 'string' ? all[episodeId] : '';
}

export function setNote(episodeId: string, text: string): void {
  const all = readJson<Record<string, string>>(STORAGE.notes, {});
  if (text.trim()) all[episodeId] = text;
  else delete all[episodeId];
  writeJson(STORAGE.notes, all);
}

export interface LastRead {
  id: string;
  scrollY: number;
  at: number;
}

export function getLastRead(): LastRead | null {
  const v = readJson<LastRead | null>(STORAGE.lastRead, null);
  return v && typeof v.id === 'string' ? v : null;
}

export function setLastRead(id: string, scrollY: number): void {
  writeJson(STORAGE.lastRead, { id, scrollY, at: Date.now() });
}
