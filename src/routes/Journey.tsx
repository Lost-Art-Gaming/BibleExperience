import type { CSSProperties } from 'react';
import { EpisodeCard } from '../components/EpisodeCard';
import { Reveal } from '../components/Reveal';
import { useEpisodes } from '../hooks/useEpisodes';
import { FALLBACKS, HOME_ART, OVERLAYS } from '../lib/art';
import { currentIndex, hiddenCount, visibleEpisodes } from '../lib/progress';

// Season card reuses the Home route's HOME_ART/OVERLAYS wiring for
// '.season-card' (ep01 art + its overlay gradient), same layering pattern
// as Home.tsx's artStyle: image on top of an underlying fallback gradient.
function seasonCardStyle(): CSSProperties {
  const asset = HOME_ART['.season-card'];
  const overlay = OVERLAYS['.season-card'];
  const fallback = FALLBACKS[0];
  return {
    backgroundImage: [overlay, asset ? `url(${asset})` : null, fallback].filter(Boolean).join(', '),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

export default function Journey() {
  const { episodes } = useEpisodes();
  const current = currentIndex(episodes);
  const visible = visibleEpisodes(episodes);
  const remaining = hiddenCount(episodes);

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">WALK WITH SCRIPTURE</span>
        <h1>Origins</h1>
        <p>From creation to the promise given to Abraham. Ten experiences, one unfolding story.</p>
      </section>

      <section className="season-card" style={seasonCardStyle()}>
        <div>
          <span>SEASON 1 · ORIGINS</span>
          <h2>The beginning of the story.</h2>
          <p>Genesis 1–12 · {episodes.length} experiences</p>
        </div>
        <div className="season-sun" />
      </section>

      <section className="episode-list">
        {visible.map((episode, index) => (
          <Reveal key={episode.id} delay={Math.min(index, 6) * 60}>
            <EpisodeCard episode={episode} index={index} locked={index > current} />
          </Reveal>
        ))}
      </section>

      {remaining > 0 && (
        <p className="journey-more">
          {remaining} more {remaining === 1 ? 'experience unlocks' : 'experiences unlock'} as you continue.
        </p>
      )}
    </>
  );
}
