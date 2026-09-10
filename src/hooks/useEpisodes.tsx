import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadIndex, loadTimeline, prefetchEpisodes } from '../lib/content';
import type { EpisodeMeta, TimelineItem } from '../lib/types';

export interface EpisodesContextValue {
  episodes: EpisodeMeta[];
  timeline: TimelineItem[];
  loading: boolean;
}

const EpisodesContext = createContext<EpisodesContextValue | undefined>(undefined);

export function EpisodesProvider({ children }: { children: ReactNode }) {
  const [episodes, setEpisodes] = useState<EpisodeMeta[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [metas, timelineItems] = await Promise.all([loadIndex(), loadTimeline()]);
        if (cancelled) return;
        setEpisodes(metas);
        setTimeline(timelineItems);
        prefetchEpisodes(metas);
      } catch {
        if (cancelled) return;
        setEpisodes([]);
        setTimeline([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<EpisodesContextValue>(
    () => ({ episodes, timeline, loading }),
    [episodes, timeline, loading],
  );

  return <EpisodesContext.Provider value={value}>{children}</EpisodesContext.Provider>;
}

export function useEpisodes(): EpisodesContextValue {
  const context = useContext(EpisodesContext);
  if (!context) {
    throw new Error('useEpisodes must be used within an EpisodesProvider');
  }
  return context;
}
