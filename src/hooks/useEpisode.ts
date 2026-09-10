import { useEffect, useRef, useState } from 'react';
import { loadEpisode } from '../lib/content';
import type { EpisodeData, EpisodeMeta } from '../lib/types';
import { useEpisodes } from './useEpisodes';

export type EpisodeStatus = 'loading' | 'ready' | 'error';

export interface UseEpisodeResult {
  meta: EpisodeMeta | undefined;
  data: EpisodeData | null;
  status: EpisodeStatus;
}

/**
 * Resolves an episode's metadata (from the shared episode index) and its
 * full content (fetched on demand via lib/content.loadEpisode).
 *
 * Status stays 'loading' until either the episode index has finished
 * loading, or the fetch for this specific episode settles. If the index has
 * finished loading and no episode matches `id`, status becomes 'error'
 * immediately (a bad/removed id) rather than hanging in 'loading' forever.
 *
 * Guards against races: navigating from one episode to another re-triggers
 * the effect, and any in-flight fetch for the *previous* id is ignored when
 * it resolves (via a monotonically increasing request token), as is a
 * fetch that resolves after the component has unmounted.
 */
export function useEpisode(id: string | undefined): UseEpisodeResult {
  const { episodes, loading: episodesLoading } = useEpisodes();
  const meta = episodes.find((episode) => episode.id === id);
  const [data, setData] = useState<EpisodeData | null>(null);
  const [status, setStatus] = useState<EpisodeStatus>('loading');
  const requestRef = useRef(0);

  useEffect(() => {
    if (!meta) {
      setData(null);
      setStatus(episodesLoading ? 'loading' : 'error');
      return;
    }

    const requestId = ++requestRef.current;
    let cancelled = false;
    setData(null);
    setStatus('loading');

    loadEpisode(meta.id, meta.file)
      .then((episodeData) => {
        if (cancelled || requestRef.current !== requestId) return;
        setData(episodeData);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled || requestRef.current !== requestId) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [meta, episodesLoading]);

  return { meta, data, status };
}
