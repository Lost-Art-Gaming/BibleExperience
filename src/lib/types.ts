export interface EpisodeMeta {
  id: string;
  file: string;
  label: string;
  title: string;
  subtitle: string;
  season: number;
  sealed: boolean;
}

export interface EpisodeSection {
  label: string;
  html: string;
}

export interface EpisodeData {
  id: string;
  season: number;
  seasonLabel: string;
  label: string;
  title: string;
  subtitle: string;
  sections: EpisodeSection[];
  reflection: string[];
  summary: string[];
}

export interface TimelineItem {
  kind: 'anchor' | 'derived' | 'approx' | 'undated';
  ep?: string;
  when: string;
  what: string;
  note: string;
}

export interface GeoPoint {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  /** The episode where this place's story is told (for cross-linking). */
  episode?: string;
}
