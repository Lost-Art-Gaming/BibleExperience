import { describe, it, expect } from 'vitest';
import { currentIndex, isEpisodeUnlocked, visibleEpisodes, hiddenCount } from '../progress';
import type { EpisodeMeta } from '../types';

const eps: EpisodeMeta[] = Array.from({ length: 10 }, (_, i) => ({
  id: `ep${i + 1}`, file: '', label: '', title: '', subtitle: '', season: 1, sealed: false,
}));
const doneOf = (ids: string[]) => (id: string) => ids.includes(id);

describe('progression gating', () => {
  it('with nothing complete, only ep1 is unlocked and ep1+ep2 are visible', () => {
    const done = doneOf([]);
    expect(currentIndex(eps, done)).toBe(0);
    expect(isEpisodeUnlocked('ep1', eps, done)).toBe(true);
    expect(isEpisodeUnlocked('ep2', eps, done)).toBe(false);
    expect(visibleEpisodes(eps, done).map((e) => e.id)).toEqual(['ep1', 'ep2']);
    expect(hiddenCount(eps, done)).toBe(8);
  });

  it('completing ep1 unlocks ep2 (current) and reveals ep3 as the sealed teaser', () => {
    const done = doneOf(['ep1']);
    expect(currentIndex(eps, done)).toBe(1);
    expect(isEpisodeUnlocked('ep2', eps, done)).toBe(true);
    expect(isEpisodeUnlocked('ep3', eps, done)).toBe(false);
    expect(visibleEpisodes(eps, done).map((e) => e.id)).toEqual(['ep1', 'ep2', 'ep3']);
  });

  it('a later episode stays locked while an earlier one is incomplete', () => {
    const done = doneOf(['ep1', 'ep2']);
    expect(isEpisodeUnlocked('ep3', eps, done)).toBe(true); // current
    expect(isEpisodeUnlocked('ep4', eps, done)).toBe(false); // sealed teaser
    expect(isEpisodeUnlocked('ep5', eps, done)).toBe(false); // hidden
  });

  it('when everything is complete, all are unlocked and visible with none hidden', () => {
    const done = doneOf(eps.map((e) => e.id));
    expect(currentIndex(eps, done)).toBe(10);
    expect(visibleEpisodes(eps, done)).toHaveLength(10);
    expect(hiddenCount(eps, done)).toBe(0);
    expect(isEpisodeUnlocked('ep10', eps, done)).toBe(true);
  });
});
