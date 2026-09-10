import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { episodeArt, FALLBACKS } from '../lib/art';
import { cleanTitle, isDone } from '../lib/storage';
import type { EpisodeMeta } from '../lib/types';

export interface EpisodeCardProps {
  episode: EpisodeMeta;
  index: number;
}

// Layers the episode's art image over a FALLBACKS gradient (keyed by card
// index, same rotation as the legacy artAttr fallback index) so a missing or
// failed image (ep08 has no art file at all) still shows a themed gradient.
function artStyle(id: string, index: number): CSSProperties {
  const asset = episodeArt(id);
  const fallback = FALLBACKS[index % FALLBACKS.length];
  return {
    backgroundImage: [`url(${asset})`, fallback].filter(Boolean).join(', '),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

export function EpisodeCard({ episode, index }: EpisodeCardProps) {
  const navigate = useNavigate();
  const done = isDone(episode.id);
  const badge = `${episode.season === 2 ? 'S2' : 'S1'} · ${String(index + 1).padStart(2, '0')}`;

  return (
    <button
      className={`episode-card${done ? ' done' : ''}`}
      data-episode={episode.id}
      onClick={() => navigate(`/episode/${encodeURIComponent(episode.id)}`)}
    >
      <div className="episode-art" style={artStyle(episode.id, index)}>
        <span>{badge}</span>
        <i />
      </div>
      <div className="episode-copy">
        <small>{episode.label}</small>
        <h3>{cleanTitle(episode.title)}</h3>
        <p>{episode.subtitle}</p>
        <span>
          {done ? 'Completed' : 'Explore'} <Icon name="arrow" />
        </span>
      </div>
    </button>
  );
}
