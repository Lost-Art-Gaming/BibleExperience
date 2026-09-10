import { useEffect, useState } from 'react';
import { loadEpisode } from '../lib/content';
import { buildContentIndex, type ContentIndex } from '../lib/contentIndex';
import type { EpisodeData } from '../lib/types';
import { useEpisodes } from './useEpisodes';

// Built once per session: the derivation is pure and the episode content is
// immutable, so there's no reason to recompute it on every mount.
let cache: ContentIndex | null = null;

/**
 * Loads every episode's body (served mostly from cache — episodes are
 * prefetched at app start) and derives the shared content index (themes,
 * people, refs). Returns a loading state until the index is ready.
 */
export function useContentIndex(): { index: ContentIndex | null; loading: boolean } {
  const { episodes, loading: episodesLoading } = useEpisodes();
  const [index, setIndex] = useState<ContentIndex | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setIndex(cache);
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
            // A missing episode simply contributes nothing to the index.
          }
        }),
      );
      const built = buildContentIndex(episodes, map);
      cache = built;
      if (!cancelled) {
        setIndex(built);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [episodes, episodesLoading]);

  return { index, loading };
}
