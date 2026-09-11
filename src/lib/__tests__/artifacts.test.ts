import { describe, it, expect } from 'vitest';
import { ARTIFACTS, artifactsForEpisode, getArtifact, isArtifactUnlocked, unlockedCount } from '../artifacts';
import { splitCitations } from '../verseLink';
import index from '../../../public/data/Genesis/index.json';

const EPISODE_IDS = new Set(index.episodes.map((e) => e.id));

describe('artifact registry', () => {
  it('has unique ids', () => {
    const ids = ARTIFACTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only unlocks from episodes that actually exist', () => {
    for (const artifact of ARTIFACTS) {
      expect(EPISODE_IDS.has(artifact.episode), `${artifact.id} → ${artifact.episode}`).toBe(true);
    }
  });

  it('carries a linkable scripture citation for every model', () => {
    for (const artifact of ARTIFACTS) {
      const linked = splitCitations(artifact.citation).filter((part) => part.url);
      expect(linked.length, `${artifact.id}: ${artifact.citation}`).toBeGreaterThan(0);
    }
  });

  it('describes every model with a legend', () => {
    for (const artifact of ARTIFACTS) {
      expect(artifact.legend.length).toBeGreaterThan(2);
      for (const item of artifact.legend) {
        expect(item.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.note.length).toBeGreaterThan(0);
      }
    }
  });

  it('is either a place or a building', () => {
    for (const artifact of ARTIFACTS) {
      expect(['place', 'building']).toContain(artifact.kind);
    }
  });
});

describe('lookup', () => {
  it('finds an artifact by id', () => {
    expect(getArtifact('ark')?.name).toBe('The Ark');
  });

  it('returns undefined for an unknown id', () => {
    expect(getArtifact('nope')).toBeUndefined();
  });

  it('groups artifacts by the episode that tells their story', () => {
    expect(artifactsForEpisode('ep6').map((a) => a.id)).toEqual(['ark']);
    expect(artifactsForEpisode('ep1')).toEqual([]);
  });
});

describe('gating', () => {
  const done = (ids: string[]) => (id: string) => ids.includes(id);

  it('keeps an artifact sealed until its episode is complete', () => {
    const ark = getArtifact('ark')!;
    expect(isArtifactUnlocked(ark, done([]))).toBe(false);
    expect(isArtifactUnlocked(ark, done(['ep2']))).toBe(false);
    expect(isArtifactUnlocked(ark, done(['ep6']))).toBe(true);
  });

  it('counts only what has been uncovered', () => {
    expect(unlockedCount(done([]))).toBe(0);
    expect(unlockedCount(done(['ep2']))).toBe(1);
    expect(unlockedCount(done(['ep2', 'ep6', 'ep8', 'ep9']))).toBe(ARTIFACTS.length);
  });
});
