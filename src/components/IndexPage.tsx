import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import { Skeleton } from './Skeleton';
import { useContentIndex } from '../hooks/useContentIndex';
import { useEpisodes } from '../hooks/useEpisodes';
import { cleanTitle } from '../lib/storage';
import type { IndexEntry } from '../lib/contentIndex';

export interface IndexPageProps {
  kind: 'theme' | 'person';
  eyebrow: string;
  title: string;
  intro: string;
  /** Reads the relevant list off the built index. */
  select: (index: NonNullable<ReturnType<typeof useContentIndex>['index']>) => IndexEntry[];
}

/**
 * Shared presentation for the People and Themes index pages: each entry
 * lists the episodes it appears in as chips linking to the reader. Derived
 * entirely from the episodes' own content (character profiles / Major
 * themes) — nothing invented.
 */
export function IndexPage({ kind, eyebrow, title, intro, select }: IndexPageProps) {
  const { index, loading } = useContentIndex();
  const { episodes } = useEpisodes();
  const navigate = useNavigate();

  const labelFor = (id: string) => {
    const meta = episodes.find((e) => e.id === id);
    return meta ? cleanTitle(meta.title) : id;
  };
  const shortFor = (id: string) => {
    const meta = episodes.find((e) => e.id === id);
    return meta ? meta.label.split('·')[0].trim() : id;
  };

  const entries = index ? select(index) : [];

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>

      {loading ? (
        <div className="index-list">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : (
        <section className="index-list" aria-label={title}>
          {entries.map((entry, i) => (
            <Reveal key={entry.id} delay={Math.min(i, 6) * 40}>
              <article className={`index-item index-${kind}`}>
                <div className="index-head">
                  <b>{entry.label}</b>
                  <span className="index-count">
                    {entry.episodes.length} {entry.episodes.length === 1 ? 'episode' : 'episodes'}
                  </span>
                </div>
                {entry.detail && <p className="index-detail">{entry.detail}</p>}
                <div className="index-eps">
                  {entry.episodes.map((id) => (
                    <button
                      className="ep-chip"
                      key={id}
                      data-episode={id}
                      title={labelFor(id)}
                      onClick={() => navigate(`/episode/${encodeURIComponent(id)}`)}
                    >
                      <span>{shortFor(id)}</span>
                      {labelFor(id)}
                      <Icon name="arrow" />
                    </button>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
          {entries.length === 0 && <div className="empty-state">Nothing to show yet.</div>}
        </section>
      )}
    </>
  );
}
