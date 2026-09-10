// Legacy-compatible localStorage semantics, ported from the old app.js.
// Keys and value shapes must match exactly so existing user data keeps working.

const STORAGE = {
  bookmarks: 'be-bookmarks',
  theme: 'be-theme',
} as const;

export type Theme = 'light' | 'dark';

export function isDone(id: string): boolean {
  return localStorage.getItem(`be-episode-${id}`) === 'done';
}

export function setDone(id: string): void {
  localStorage.setItem(`be-episode-${id}`, 'done');
}

export function getBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE.bookmarks);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: string[]): void {
  localStorage.setItem(STORAGE.bookmarks, JSON.stringify(bookmarks));
}

export function toggleBookmark(id: string): string[] {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(id);
  }
  saveBookmarks(bookmarks);
  return bookmarks;
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
