import type { EpisodeMeta } from './types';
import type { IndexEntry } from './contentIndex';

export interface TapestryNode {
  id: string;
  index: number; // position in episode order
  completed: boolean;
}

export interface TapestryEdge {
  a: string; // episode id (earlier in order)
  b: string; // episode id (later in order)
  ai: number;
  bi: number;
  threadIds: string[];
  threadLabels: string[];
  woven: boolean; // both endpoints completed
}

export interface Tapestry {
  nodes: TapestryNode[];
  edges: TapestryEdge[];
  total: number; // total connectable episode-pairs (across all threads)
  discovered: number; // woven edges
  newlyWoven: number; // edges woven now that were not woven under `previous`
  wovenThreadIds: string[]; // threads with >=1 woven edge
}

const pairKey = (a: string, b: string) => `${a}::${b}`;

/**
 * Compute the tapestry state from the derived threads and the set of
 * completed episodes. A connection (edge) exists between two episodes when
 * they share at least one thread; it is *woven* once both episodes are
 * completed. `threads` should already be filtered to the active dimension
 * (themes or people) by the caller.
 */
export function buildTapestry(
  episodes: EpisodeMeta[],
  threads: IndexEntry[],
  completed: Set<string>,
  previous?: Set<string>,
): Tapestry {
  const order = new Map(episodes.map((e, i) => [e.id, i] as const));
  const nodes: TapestryNode[] = episodes.map((e, i) => ({
    id: e.id,
    index: i,
    completed: completed.has(e.id),
  }));

  const byPair = new Map<string, TapestryEdge>();
  for (const t of threads) {
    // Only episodes that exist in the current episode set, in order.
    const eps = t.episodes.filter((id) => order.has(id)).sort((x, y) => order.get(x)! - order.get(y)!);
    for (let i = 0; i < eps.length; i++) {
      for (let j = i + 1; j < eps.length; j++) {
        const a = eps[i];
        const b = eps[j];
        const key = pairKey(a, b);
        let edge = byPair.get(key);
        if (!edge) {
          edge = {
            a,
            b,
            ai: order.get(a)!,
            bi: order.get(b)!,
            threadIds: [],
            threadLabels: [],
            woven: completed.has(a) && completed.has(b),
          };
          byPair.set(key, edge);
        }
        if (!edge.threadIds.includes(t.id)) {
          edge.threadIds.push(t.id);
          edge.threadLabels.push(t.label);
        }
      }
    }
  }

  const edges = [...byPair.values()].sort((e1, e2) => e1.ai - e2.ai || e1.bi - e2.bi);
  const discovered = edges.filter((e) => e.woven).length;

  let newlyWoven = 0;
  if (previous) {
    for (const e of edges) {
      if (e.woven && !(previous.has(e.a) && previous.has(e.b))) newlyWoven++;
    }
  }

  const wovenThreadIds: string[] = [];
  for (const t of threads) {
    if (edges.some((e) => e.woven && e.threadIds.includes(t.id))) wovenThreadIds.push(t.id);
  }

  return { nodes, edges, total: edges.length, discovered, newlyWoven, wovenThreadIds };
}

/**
 * The thread labels newly connected by completing `completedNowId` — a thread
 * it belongs to that already reached at least one previously-completed
 * episode. Used to surface "new connections woven" on completion.
 */
export function newlyWovenLabels(
  entries: IndexEntry[],
  completedNowId: string,
  completedBefore: Set<string>,
): string[] {
  return entries
    .filter(
      (t) =>
        t.episodes.includes(completedNowId) &&
        t.episodes.some((o) => o !== completedNowId && completedBefore.has(o)),
    )
    .map((t) => t.label);
}
