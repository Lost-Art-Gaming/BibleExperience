import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { HomeTapestryTeaser } from '../components/HomeTapestryTeaser';
import { ProgressBar } from '../components/ProgressBar';
import { Reveal } from '../components/Reveal';
import { useEpisodes } from '../hooks/useEpisodes';
import { FALLBACKS, HOME_ART, OVERLAYS } from '../lib/art';
import { cleanTitle, getBookmarks, getLastRead, isDone } from '../lib/storage';
import { isEpisodeUnlocked } from '../lib/progress';

function artStyle(selector: string, fallbackIndex: number): CSSProperties {
  const asset = HOME_ART[selector];
  const overlay = OVERLAYS[selector];
  const fallback = FALLBACKS[fallbackIndex % FALLBACKS.length];
  const layers = [overlay, asset ? `url(${asset})` : null, fallback].filter(Boolean).join(', ');
  return { backgroundImage: layers, backgroundSize: 'cover', backgroundPosition: 'center' };
}

export default function Home() {
  const { episodes } = useEpisodes();
  const navigate = useNavigate();

  const next = episodes.find((episode) => !isDone(episode.id)) || episodes[0];
  const doneCount = episodes.filter((episode) => isDone(episode.id)).length;
  const total = episodes.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const savedCount = getBookmarks().length;
  const nextIndex = next ? Math.max(0, episodes.findIndex((episode) => episode.id === next.id)) : 0;
  const heroNumber = total ? Math.min(nextIndex + 1, total) : 0;

  const goToNext = () => {
    if (next) navigate(`/episode/${encodeURIComponent(next.id)}`);
  };

  const last = getLastRead();
  const resume =
    last && isEpisodeUnlocked(last.id, episodes) && last.id !== next?.id
      ? episodes.find((e) => e.id === last.id)
      : undefined;

  return (
    <>
      {resume && (
        <button className="resume-bar" onClick={() => navigate(`/episode/${encodeURIComponent(resume.id)}`)}>
          <span className="resume-icon">
            <Icon name="play" />
          </span>
          <span>
            <small>Continue reading</small>
            <b>{cleanTitle(resume.title)}</b>
          </span>
          <span className="resume-go">
            <Icon name="arrow" />
          </span>
        </button>
      )}
      <Reveal>
        <section className="hero-home" style={artStyle('.hero-home', 0)}>
          <div className="hero-glow" />
          <div className="hero-mountains" />
          <div className="hero-content">
            <span className="eyebrow">SEASON 1 · ORIGINS</span>
            <h1>
              See the <em>bigger picture.</em>
            </h1>
            <p>
              Experience the Bible as a connected story—Scripture, history, geography and prophecy brought together.
            </p>
            <button className="primary-btn" data-episode={next?.id || ''} onClick={goToNext}>
              <Icon name="play" /> {pct ? 'Continue your journey' : 'Begin the journey'}
            </button>
          </div>
          <div className="hero-mark" aria-label={`Next experience ${heroNumber} of ${total}`}>
            {String(heroNumber).padStart(2, '0')}<span>/</span>{String(total).padStart(2, '0')}
          </div>
        </section>
      </Reveal>

      <Reveal delay={80}>
        <section className="content-section journey-progress">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR JOURNEY</span>
              <h2>Walk through the Bible</h2>
            </div>
            <strong>{pct}%</strong>
          </div>
          <ProgressBar value={pct} />
          <div className="mini-stats">
            <span>
              <b>{doneCount}</b> completed
            </span>
            <span>
              <b>{total}</b> experiences
            </span>
            <span>
              <b>{savedCount}</b> saved
            </span>
          </div>
        </section>
      </Reveal>

      <Reveal delay={120}>
        <HomeTapestryTeaser />
      </Reveal>

      <Reveal delay={160}>
        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORE</span>
              <h2>Go beyond the page</h2>
            </div>
          </div>
          <div className="feature-grid">
            <button
              className="feature-card map-feature"
              style={artStyle('.map-feature', 1)}
              onClick={() => navigate('/explore')}
            >
              <span className="feature-icon">
                <Icon name="map" />
              </span>
              <b>Biblical Geography</b>
              <small>Walk the places of Scripture</small>
              <span className="feature-arrow">
                <Icon name="arrow" />
              </span>
            </button>
            <button
              className="feature-card timeline-feature"
              style={artStyle('.timeline-feature', 2)}
              onClick={() => navigate('/timeline')}
            >
              <span className="feature-icon">
                <Icon name="timeline" />
              </span>
              <b>Biblical Timeline</b>
              <small>See Jehovah&rsquo;s purpose unfold</small>
              <span className="feature-arrow">
                <Icon name="arrow" />
              </span>
            </button>
            <button
              className="feature-card journey-feature"
              style={artStyle('.journey-feature', 3)}
              onClick={() => navigate('/journey')}
            >
              <span className="feature-icon">
                <Icon name="journey" />
              </span>
              <b>Scripture Journey</b>
              <small>Read, reflect and discover</small>
              <span className="feature-arrow">
                <Icon name="arrow" />
              </span>
            </button>
          </div>
        </section>
      </Reveal>
    </>
  );
}
