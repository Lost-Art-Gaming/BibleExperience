import type { EpisodeMeta } from './types';
import { isDone as storageIsDone } from './storage';

/**
 * Linear progression gating. Episodes unlock in order: a completed episode
 * and the *current* one (the first not-yet-completed) are unlocked; the very
 * next episode is shown but sealed; everything beyond it is hidden until the
 * window advances.
 *
 * `done` is injectable for testing; it defaults to the real localStorage
 * check.
 */
type Done = (id: string) => boolean;

/**
 * Index of the current episode — the first not-yet-completed one. If every
 * episode is complete, this is `episodes.length` (nothing left / all unlocked).
 */
export function currentIndex(episodes: EpisodeMeta[], done: Done = storageIsDone): number {
  const i = episodes.findIndex((e) => !done(e.id));
  return i < 0 ? episodes.length : i;
}

/** An episode at `index` is unlocked when it's the current one or earlier. */
export function isUnlockedIndex(index: number, episodes: EpisodeMeta[], done: Done = storageIsDone): boolean {
  return index <= currentIndex(episodes, done);
}

/** Whether a given episode id is unlocked (playable). */
export function isEpisodeUnlocked(id: string, episodes: EpisodeMeta[], done: Done = storageIsDone): boolean {
  const i = episodes.findIndex((e) => e.id === id);
  return i >= 0 && i <= currentIndex(episodes, done);
}

/**
 * The episodes to show on the journey: all unlocked ones plus the single
 * sealed "next" teaser. Everything past that stays hidden.
 */
export function visibleEpisodes<T extends EpisodeMeta>(episodes: T[], done: Done = storageIsDone): T[] {
  return episodes.slice(0, currentIndex(episodes, done) + 2);
}

/** How many episodes remain hidden beyond the visible window. */
export function hiddenCount(episodes: EpisodeMeta[], done: Done = storageIsDone): number {
  return Math.max(0, episodes.length - visibleEpisodes(episodes, done).length);
}
