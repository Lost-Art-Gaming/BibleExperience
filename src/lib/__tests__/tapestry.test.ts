import { describe, it, expect } from 'vitest';
import { buildTapestry, newlyWovenLabels } from '../tapestry';
import type { IndexEntry } from '../contentIndex';

describe('newlyWovenLabels', () => {
  const entries: IndexEntry[] = [
    { id: 'a', kind: 'theme', label: 'Faith', episodes: ['ep1', 'ep2', 'ep4'] },
    { id: 'b', kind: 'theme', label: 'Blessing', episodes: ['ep3', 'ep4'] },
    { id: 'c', kind: 'theme', label: 'Rest', episodes: ['ep4'] },
  ];
  it('returns threads that connect the just-completed episode to earlier ones', () => {
    // completing ep4 with ep1,ep2 already done: Faith connects (ep1/ep2), Blessing does not (ep3 not done), Rest is solo
    expect(newlyWovenLabels(entries, 'ep4', new Set(['ep1', 'ep2']))).toEqual(['Faith']);
    // with ep3 also done, Blessing now weaves too
    expect(newlyWovenLabels(entries, 'ep4', new Set(['ep1', 'ep3']))).toEqual(['Faith', 'Blessing']);
    // nothing completed before: no new connections
    expect(newlyWovenLabels(entries, 'ep4', new Set())).toEqual([]);
  });
});

const meta = (ids: string[]) => ids.map((id) => ({ id, file: '', label: id, title: id, subtitle: '', season: 1, sealed: false }));

const thread = (id: string, label: string, episodes: string[]): IndexEntry => ({ id, kind: 'theme', label, detail: undefined, episodes });

describe('buildTapestry', () => {
  const episodes = meta(['ep1', 'ep2', 'ep3', 'ep4']);
  const threads = [
    thread('t-a', 'Sovereignty', ['ep1', 'ep2', 'ep3']), // pairs: 1-2, 1-3, 2-3
    thread('t-b', 'Seed', ['ep2', 'ep4']), //               pairs: 2-4
  ];

  it('creates one edge per unique episode-pair that shares >=1 thread', () => {
    const t = buildTapestry(episodes, threads, new Set());
    // pairs: 1-2, 1-3, 2-3 (from t-a) + 2-4 (from t-b) = 4 edges
    expect(t.total).toBe(4);
    expect(t.edges).toHaveLength(4);
    const e12 = t.edges.find((e) => e.a === 'ep1' && e.b === 'ep2');
    expect(e12?.threadLabels).toContain('Sovereignty');
  });

  it('marks an edge woven only when BOTH endpoints are completed', () => {
    const t = buildTapestry(episodes, threads, new Set(['ep1', 'ep2']));
    // only 1-2 has both endpoints complete
    expect(t.discovered).toBe(1);
    expect(t.edges.find((e) => e.a === 'ep1' && e.b === 'ep2')?.woven).toBe(true);
    expect(t.edges.find((e) => e.a === 'ep1' && e.b === 'ep3')?.woven).toBe(false);
  });

  it('reports node completion state and preserves episode order', () => {
    const t = buildTapestry(episodes, threads, new Set(['ep2', 'ep3']));
    expect(t.nodes.map((n) => n.id)).toEqual(['ep1', 'ep2', 'ep3', 'ep4']);
    expect(t.nodes.find((n) => n.id === 'ep2')?.completed).toBe(true);
    expect(t.nodes.find((n) => n.id === 'ep1')?.completed).toBe(false);
    // 2-3 becomes woven
    expect(t.discovered).toBe(1);
  });

  it('lists woven thread ids (threads with >=1 woven edge)', () => {
    const t = buildTapestry(episodes, threads, new Set(['ep2', 'ep4']));
    // t-b (2-4) is woven; t-a needs two of 1/2/3 completed — only ep2 is
    expect(t.wovenThreadIds).toEqual(['t-b']);
  });

  it('computes newly woven edges when one more episode is completed', () => {
    const before = new Set(['ep1', 'ep2']);
    const t = buildTapestry(episodes, threads, new Set(['ep1', 'ep2', 'ep3']), before);
    // completing ep3 newly weaves 1-3 and 2-3
    expect(t.newlyWoven).toBe(2);
  });
});
