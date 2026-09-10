import { describe, it, expect } from 'vitest';
import { buildTapestryThreads } from '../tapestryThreads';
import type { EpisodeData, EpisodeMeta } from '../types';

const meta = (id: string): EpisodeMeta => ({ id, file: '', label: id, title: id, subtitle: '', season: 1, sealed: false });
const ep = (id: string, prose: string): EpisodeData => ({
  id, season: 1, seasonLabel: '', label: id, title: id, subtitle: '',
  sections: [{ label: 'Narrative', html: `<p>${prose}</p>` }], reflection: [], summary: [],
});

describe('buildTapestryThreads', () => {
  const episodes = [meta('ep1'), meta('ep2'), meta('ep3')];
  const data = new Map<string, EpisodeData>([
    ['ep1', ep('ep1', 'Jehovah the Creator blessed the seventh day of rest.')],
    ['ep2', ep('ep2', 'Jehovah blessed Adam and Eve; the offspring promise begins.')],
    ['ep3', ep('ep3', 'The serpent deceived Eve. The woman’s seed would crush the serpent’s head.')],
  ]);
  const t = buildTapestryThreads(episodes, data);

  it('detects a motif only in the episodes whose prose contains its terms', () => {
    const seed = t.motifs.find((m) => m.id === 'm-seed');
    expect(seed?.episodes).toEqual(['ep2', 'ep3']);
    const rest = t.motifs.find((m) => m.id === 'm-rest');
    expect(rest?.episodes).toEqual(['ep1']);
  });

  it('detects figures across the prose, not just profile sections', () => {
    const jehovah = t.people.find((p) => p.id === 'p-jehovah');
    expect(jehovah?.episodes).toEqual(['ep1', 'ep2']);
    const serpent = t.people.find((p) => p.id === 'p-serpent');
    expect(serpent?.episodes).toEqual(['ep3']);
  });

  it('omits threads that never appear', () => {
    expect(t.motifs.find((m) => m.id === 'm-flood')).toBeUndefined();
  });
});
