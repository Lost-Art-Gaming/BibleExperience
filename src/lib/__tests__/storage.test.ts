import { describe, it, expect, beforeEach } from 'vitest';
import { isDone, setDone, getBookmarks, toggleBookmark, getTheme, setTheme } from '../storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('records completion under the legacy key', () => {
    expect(isDone('ep1')).toBe(false);
    setDone('ep1');
    expect(localStorage.getItem('be-episode-ep1')).toBe('done');
    expect(isDone('ep1')).toBe(true);
  });

  it('toggles bookmarks and persists as be-bookmarks JSON', () => {
    expect(getBookmarks()).toEqual([]);
    expect(toggleBookmark('ep2')).toEqual(['ep2']);
    expect(JSON.parse(localStorage.getItem('be-bookmarks')!)).toEqual(['ep2']);
    expect(toggleBookmark('ep2')).toEqual([]);
  });

  it('defaults theme to dark and persists changes', () => {
    expect(getTheme()).toBe('dark');
    setTheme('light');
    expect(localStorage.getItem('be-theme')).toBe('light');
    expect(getTheme()).toBe('light');
  });
});
