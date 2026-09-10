import { useEffect, useState } from 'react';
import { loadEpisode } from '../lib/content';
import { buildTapestryThreads, type TapestryThreads } from '../lib/tapestryThreads';
import type { EpisodeData } from '../lib/types';
import { useEpisodes } from './useEpisodes';

let cache: TapestryThreads | null = null;

/**
 * Loads every episode's prose (mostly from cache — episodes prefetch at app
 * start) and detects the curated Tapestry threads within it. Built once per
 * session.
 */
export function useTapestryThreads(): { threads: TapestryThreads | null; loading: boolean } {
  const { episodes, loading: episodesLoading } = useEpisodes();
  const [threads, setThreads] = useState<TapestryThreads | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setThreads(cache);
      setLoading(false);
      return;
    }
    if (episodesLoading || episodes.length === 0) return;

    let cancelled = false;
    (async () => {
      const map = new Map<string, EpisodeData>();
      await Promise.all(
        episodes.map(async (meta) => {
          try {
            map.set(meta.id, await loadEpisode(meta.id, meta.file));
          } catch {
            /* a missing episode contributes no threads */
          }
        }),
      );
      const built = buildTapestryThreads(episodes, map);
      cache = built;
      if (!cancelled) {
        setThreads(built);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [episodes, episodesLoading]);

  return { threads, loading };
}
