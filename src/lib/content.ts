import type { EpisodeData, EpisodeMeta, TimelineItem } from './types';

const BASE = import.meta.env.BASE_URL;

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json() as Promise<T>;
}

export async function loadIndex(): Promise<EpisodeMeta[]> {
  const index = await getJson<{ episodes?: EpisodeMeta[] }>('data/Genesis/index.json');
  return Array.isArray(index.episodes) ? index.episodes : [];
}

export async function loadTimeline(): Promise<TimelineItem[]> {
  const timeline = await getJson<TimelineItem[]>('data/timeline.json');
  return Array.isArray(timeline) ? timeline : [];
}

export async function loadEpisode(id: string, file: string): Promise<EpisodeData> {
  const data = await getJson<EpisodeData>(`data/Genesis/${file}`);
  return { ...data, id: data.id ?? id };
}

export function prefetchEpisodes(metas: EpisodeMeta[]): void {
  metas.forEach((meta) => {
    loadEpisode(meta.id, meta.file).catch(() => {
      // Individual episode failures are surfaced only when that episode is opened.
    });
  });
}
