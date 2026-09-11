import { describe, it, expect, beforeEach } from 'vitest';
import { isDone, setDone, getTheme, setTheme } from '../storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('records completion under the legacy key', () => {
    expect(isDone('ep1')).toBe(false);
    setDone('ep1');
    expect(localStorage.getItem('be-episode-ep1')).toBe('done');
    expect(isDone('ep1')).toBe(true);
  });

  it('defaults theme to dark and persists changes', () => {
    expect(getTheme()).toBe('dark');
    setTheme('light');
    expect(localStorage.getItem('be-theme')).toBe('light');
    expect(getTheme()).toBe('light');
  });
});
