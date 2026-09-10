import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Skeleton } from '../components/Skeleton';
import { useEpisode } from '../hooks/useEpisode';
import { useEpisodes } from '../hooks/useEpisodes';
import { episodeArt, FALLBACKS } from '../lib/art';
import { sanitizeHtml } from '../lib/sanitize';
import { cleanTitle, getBookmarks, isDone, setDone, toggleBookmark } from '../lib/storage';
import { toast } from '../lib/toast';

// Layers the episode's art image over a FALLBACKS gradient (same rotation
// EpisodeCard/Home use) so a missing or failed image still shows a themed
// gradient behind the reader header.
function headStyle(id: string, index: number): CSSProperties {
  const fallback = FALLBACKS[((index % FALLBACKS.length) + FALLBACKS.length) % FALLBACKS.length];
  return {
    backgroundImage: [`url(${episodeArt(id)})`, fallback].filter(Boolean).join(', '),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

// react-router's history.state carries a monotonic `idx` for in-app
// navigations (both BrowserRouter and HashRouter). idx > 0 means there is
// somewhere in *this app's* history to go back to; idx 0 (or missing state,
// e.g. a fresh deep link) means there isn't, so fall back to Journey rather
// than leaving the app entirely.
function hasInAppHistory(): boolean {
  const state = window.history.state as { idx?: number } | null;
  return (state?.idx ?? 0) > 0;
}

export default function Reader() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { episodes } = useEpisodes();
  const { meta, data, status } = useEpisode(id);

  const [saved, setSaved] = useState(() => getBookmarks().includes(id));
  const [done, setDoneState] = useState(() => isDone(id));

  // Reader stays mounted across "Next"/"Continue" navigations (same route,
  // different :id param), so saved/done must be re-read whenever id changes
  // rather than only on first mount.
  useEffect(() => {
    setSaved(getBookmarks().includes(id));
    setDoneState(isDone(id));
  }, [id]);

  if (status === 'loading') {
    return (
      <section className="reader-loading" aria-live="polite">
        <span className="eyebrow">LOADING EXPERIENCE</span>
        <h1>{meta ? cleanTitle(meta.title) : 'Loading…'}</h1>
        <div className="loading-indicator" role="status" aria-label="Loading episode">
          <span />
          <span />
          <span />
        </div>
        <div className="skeleton-lines">
          <Skeleton style={{ width: '90%' }} />
          <Skeleton style={{ width: '100%' }} />
          <Skeleton style={{ width: '70%' }} />
        </div>
        <p>Gathering the reading, context and geography for this experience.</p>
      </section>
    );
  }

  if (status === 'error' || !meta || !data) {
    return (
      <section className="reader-error">
        <span className="eyebrow">EXPERIENCE UNAVAILABLE</span>
        <h1>{meta ? cleanTitle(meta.title) : 'Episode'}</h1>
        <p>This episode could not be loaded. Check your connection and try again.</p>
        <button className="primary-btn" onClick={() => navigate('/journey')}>
          <Icon name="back" /> Return to Journey
        </button>
      </section>
    );
  }

  const index = episodes.findIndex((episode) => episode.id === meta.id);
  const previous = index > 0 ? episodes[index - 1] : undefined;
  const next = index >= 0 ? episodes[index + 1] : undefined;

  const goBack = () => {
    if (hasInAppHistory()) navigate(-1);
    else navigate('/journey');
  };

  const goToEpisode = (episodeId: string) => navigate(`/episode/${encodeURIComponent(episodeId)}`);

  const handleBookmark = () => {
    const bookmarks = toggleBookmark(meta.id);
    const nowSaved = bookmarks.includes(meta.id);
    setSaved(nowSaved);
    toast(nowSaved ? 'Saved to your library' : 'Removed from saved experiences');
  };

  const handleComplete = () => {
    setDone(meta.id);
    setDoneState(true);
    toast('Episode completed');
  };

  return (
    <>
      <section className="reader-head" style={headStyle(meta.id, Math.max(index, 0))}>
        <button className="back-btn" id="readerBack" onClick={goBack}>
          <Icon name="back" /> Journey
        </button>
        <span className="eyebrow">{meta.label}</span>
        <h1>{cleanTitle(meta.title)}</h1>
        <p>{meta.subtitle}</p>
        <div className="reader-meta">
          <span>{data.sections.length} sections</span>
          <button id="bookmark" className={`save-btn${saved ? ' saved' : ''}`} onClick={handleBookmark}>
            <Icon name="bookmark" /> {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </section>

      <article className="reader-content reader">
        {data.sections.map((section, sectionIndex) => (
          <section
            key={`${meta.id}-${sectionIndex}`}
            className="reading-section"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.html) }}
          />
        ))}

        {data.reflection.length > 0 && (
          <section className="reading-section reader-reflection">
            <span className="eyebrow">REFLECT</span>
            <h2>Questions to consider</h2>
            <ol>
              {data.reflection.map((question, questionIndex) => (
                <li key={questionIndex}>{question}</li>
              ))}
            </ol>
          </section>
        )}

        {data.summary.length > 0 && (
          <section className="reading-section reader-summary">
            <span className="eyebrow">RECAP</span>
            <h2>In summary</h2>
            <ul>
              {data.summary.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <div className="reader-footer">
        <div className="reader-sequence">
          {previous ? (
            <button className="secondary-btn" onClick={() => goToEpisode(previous.id)}>
              <Icon name="back" /> {cleanTitle(previous.title)}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button className="secondary-btn next-link" onClick={() => goToEpisode(next.id)}>
              Next <Icon name="arrow" />
            </button>
          ) : (
            <span />
          )}
        </div>
        {next ? (
          <button className="primary-btn continue-btn" onClick={() => goToEpisode(next.id)}>
            Continue to {cleanTitle(next.title)} <Icon name="arrow" />
          </button>
        ) : (
          <button id="complete" className="primary-btn" onClick={handleComplete}>
            {done ? 'Completed ✓' : 'Mark episode complete'} <Icon name="arrow" />
          </button>
        )}
      </div>
    </>
  );
}
