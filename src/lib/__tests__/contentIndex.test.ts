import { describe, it, expect } from 'vitest';
import { buildContentIndex } from '../contentIndex';
import type { EpisodeData, EpisodeMeta } from '../types';

function meta(id: string): EpisodeMeta {
  return { id, file: `${id}.json`, label: id, title: id, subtitle: '', season: 1, sealed: false };
}

function ep(id: string, opts: { themes?: [string, string][]; people?: [string, string][]; refs?: [string, string][] }): EpisodeData {
  const sections: EpisodeData['sections'] = [];
  if (opts.themes) {
    const lis = opts.themes.map(([t, g]) => `<li><strong>${t}</strong>: ${g}</li>`).join('');
    sections.push({ label: 'Major themes', html: `<section class="ep-sec" data-rail="Major themes"><ul>${lis}</ul></section>` });
  }
  // A summary section with its own <li> list — must NOT be picked up as themes.
  sections.push({ label: 'Episode summary', html: `<section class="ep-sec" data-rail="Episode summary"><ul><li><strong>Events</strong>: x</li></ul></section>` });
  if (opts.people) {
    const profs = opts.people
      .map(([n, r]) => `<div class="profile"><div class="p-name">${n}</div><div class="p-role">${r}</div><p>x</p></div>`)
      .join('');
    sections.push({ label: 'Character profiles', html: `<section class="ep-sec">${profs}</section>` });
  }
  if (opts.refs) {
    const spans = opts.refs.map(([ref, label]) => `<span class="ref" data-ref="${ref}">${label}</span>`).join(' ');
    sections.push({ label: 'Cross references', html: `<section class="ep-sec"><p>${spans}</p></section>` });
  }
  return { id, season: 1, seasonLabel: '', label: id, title: id, subtitle: '', sections, reflection: [], summary: [] };
}

describe('buildContentIndex', () => {
  const episodes = [meta('ep1'), meta('ep2'), meta('ep3')];
  const data = new Map<string, EpisodeData>([
    ['ep1', ep('ep1', {
      themes: [['Jehovah’s sovereignty', 'a'], ['Sacred rest', 'b']],
      people: [['Jehovah God', 'The central character']],
      refs: [['ge1-1', 'Genesis 1:1']],
    })],
    ['ep2', ep('ep2', {
      themes: [['Jehovah’s sovereignty', 'again'], ['Human dignity', 'c']],
      people: [['Jehovah', 'Creator'], ['Adam', 'First man']],
      refs: [['ge1-1', 'Genesis 1:1'], ['ge2-7', 'Genesis 2:7']],
    })],
    ['ep3', ep('ep3', { themes: [['Human dignity', 'd']], people: [['Adam', 'Named']] })],
  ]);

  const index = buildContentIndex(episodes, data);

  it('collects themes with the episodes they appear in', () => {
    const sovereignty = index.themes.find((t) => t.label.includes('sovereignty'));
    expect(sovereignty).toBeTruthy();
    expect(sovereignty!.kind).toBe('theme');
    expect(sovereignty!.episodes).toEqual(['ep1', 'ep2']);
    const dignity = index.themes.find((t) => t.label === 'Human dignity');
    expect(dignity!.episodes).toEqual(['ep2', 'ep3']);
  });

  it('does not pull summary-section bullets in as themes', () => {
    expect(index.themes.find((t) => t.label === 'Events')).toBeUndefined();
  });

  it('collects people and merges obvious name variants (Jehovah God / Jehovah)', () => {
    const jehovah = index.people.filter((p) => p.label.toLowerCase().startsWith('jehovah'));
    expect(jehovah).toHaveLength(1);
    expect(jehovah[0].episodes).toEqual(['ep1', 'ep2']);
    const adam = index.people.find((p) => p.label === 'Adam');
    expect(adam!.episodes).toEqual(['ep2', 'ep3']);
  });

  it('keeps a single-episode entry (Sacred rest) but it is not a multi-episode thread', () => {
    const rest = index.themes.find((t) => t.label === 'Sacred rest');
    expect(rest!.episodes).toEqual(['ep1']);
  });

  it('exposes refs per episode, deduped', () => {
    expect(index.refsByEpisode['ep2'].map((r) => r.ref)).toEqual(['ge1-1', 'ge2-7']);
  });

  it('does not duplicate an episode id within an entry', () => {
    for (const e of [...index.themes, ...index.people]) {
      expect(new Set(e.episodes).size).toBe(e.episodes.length);
    }
  });
});
