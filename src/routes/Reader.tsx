import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { ConnectionsPanel } from '../components/ConnectionsPanel';
import { Icon } from '../components/Icon';
import { SectionRail } from '../components/SectionRail';
import { Skeleton } from '../components/Skeleton';
import { useEpisode } from '../hooks/useEpisode';
import { useEpisodes } from '../hooks/useEpisodes';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { episodeArt, FALLBACKS } from '../lib/art';
import { sanitizeHtml } from '../lib/sanitize';
import { cleanTitle, getBookmarks, isDone, setDone, toggleBookmark } from '../lib/storage';
import { currentIndex, isEpisodeUnlocked } from '../lib/progress';
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

function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
}

// Derives a stable `sec-<slug>` id per episode section (from its label),
// deduping in the rare case two sections share a label so ids stay unique.
function buildSectionIds(labels: string[]): string[] {
  const used = new Set<string>();
  return labels.map((label) => {
    const base = `sec-${slugify(label)}`;
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    return id;
  });
}

// Tracks scroll progress (0-100) through the reader article, for the thin
// reading-progress bar fixed under the top bar. Recomputes whenever `dep`
// changes (episode data), since the article's height changes with it even
// though the <article> DOM node itself persists across in-app navigation.
function useReadingProgress(ref: RefObject<HTMLElement>, dep: unknown): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        setProgress(100);
        return;
      }
      setProgress(Math.max(0, Math.min(100, (-rect.top / total) * 100)));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ref, dep]);

  return progress;
}

export default function Reader() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { episodes } = useEpisodes();
  const { meta, data, status } = useEpisode(id);

  const [saved, setSaved] = useState(() => getBookmarks().includes(id));
  const [done, setDoneState] = useState(() => isDone(id));
  const articleRef = useRef<HTMLElement>(null);
  const [threadHost, setThreadHost] = useState<HTMLElement | null>(null);

  // Reader stays mounted across "Next"/"Continue" navigations (same route,
  // different :id param), so saved/done must be re-read whenever id changes
  // rather than only on first mount.
  useEffect(() => {
    setSaved(getBookmarks().includes(id));
    setDoneState(isDone(id));
  }, [id]);

  const sectionIds = buildSectionIds(data?.sections.map((section) => section.label) ?? []);
  const activeSectionId = useScrollSpy(sectionIds);
  const progress = useReadingProgress(articleRef, data);

  // After each episode's section HTML mounts, enhance it in place — without
  // touching the sanitized markup itself: make `.ref` spans keyboard
  // focusable with a tooltip, and portal the ConnectionsPanel into that
  // episode's `.threadHost[data-ep]` placeholder. Re-runs whenever the
  // episode data changes (including Next/Continue navigation, which keeps
  // this component mounted).
  useEffect(() => {
    const article = articleRef.current;
    if (!article || !data) {
      setThreadHost(null);
      return;
    }

    setThreadHost(article.querySelector<HTMLElement>('.threadHost[data-ep]'));

    article.querySelectorAll<HTMLElement>('.ref').forEach((el) => {
      el.tabIndex = 0;
      const label = el.textContent?.trim();
      if (label) el.title = label;
    });
  }, [data]);

  // Sanitizing every section re-parses its HTML via DOMParser, which is
  // wasteful to redo on each render (e.g. every scroll-driven progress/
  // scroll-spy state update). Memoize on episode `data` so it only runs
  // once per episode load.
  const sanitizedSections = useMemo(
    () => (data ? data.sections.map((section) => ({ ...section, html: sanitizeHtml(section.html) })) : []),
    [data],
  );

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

  // Progression guard: a sealed episode (reached by a deep link, or a link
  // from the timeline/tapestry/search) shows a sealed state, never the
  // content. It points to the experience the reader should play next.
  if (!isEpisodeUnlocked(meta.id, episodes)) {
    const ci = currentIndex(episodes);
    const current = ci < episodes.length ? episodes[ci] : undefined;
    return (
      <section className="reader-error reader-sealed">
        <span className="eyebrow">SEALED</span>
        <h1>This experience is sealed</h1>
        <p>Work through the journey in order — complete the experiences before it to unlock this one.</p>
        <div className="reader-sequence">
          {current && (
            <button className="primary-btn" onClick={() => navigate(`/episode/${encodeURIComponent(current.id)}`)}>
              <Icon name="play" /> Continue with “{cleanTitle(current.title)}”
            </button>
          )}
          <button className="secondary-btn" onClick={() => navigate('/journey')}>
            <Icon name="back" /> Journey
          </button>
        </div>
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

  const railSections = data.sections.map((section, sectionIndex) => ({
    id: sectionIds[sectionIndex],
    label: section.label,
  }));

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

      <div className="reading-progress" aria-hidden="true">
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="reader-layout">
        <SectionRail sections={railSections} activeId={activeSectionId} />

        <article className="reader-content reader" ref={articleRef}>
          {sanitizedSections.map((section, sectionIndex) => (
            <section
              key={`${meta.id}-${sectionIndex}`}
              id={sectionIds[sectionIndex]}
              className="reading-section"
              dangerouslySetInnerHTML={{ __html: section.html }}
            />
          ))}

          {threadHost ? createPortal(<ConnectionsPanel episodeId={meta.id} sections={data.sections} />, threadHost) : null}

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
      </div>

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
