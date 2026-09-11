import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import { Skeleton } from './Skeleton';
import { useContentIndex } from '../hooks/useContentIndex';
import { useEpisodes } from '../hooks/useEpisodes';
import { cleanTitle, isDone } from '../lib/storage';
import { currentIndex, isEpisodeUnlocked } from '../lib/progress';
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
 * Shared presentation for the People and Themes index pages.
 * People use a single evolving profile card per person; themes retain the
 * compact episode-chip presentation. Both are derived entirely from the
 * episode content index.
 */
export function IndexPage({ kind, eyebrow, title, intro, select }: IndexPageProps) {
  const { index, loading } = useContentIndex();
  const { episodes } = useEpisodes();
  const navigate = useNavigate();

  const episodeById = useMemo(() => new Map(episodes.map((episode) => [episode.id, episode])), [episodes]);
  const done = useMemo(() => new Set(episodes.filter((episode) => isDone(episode.id)).map((episode) => episode.id)), [episodes]);
  const progress = currentIndex(episodes, (id) => done.has(id));

  const labelFor = (id: string) => episodeById.get(id) ? cleanTitle(episodeById.get(id)!.title) : id;
  const shortFor = (id: string) => episodeById.get(id)?.label.split('·')[0].trim() ?? id;

  const entries = useMemo(() => {
    const all = index ? select(index) : [];
    if (kind !== 'person') return all;

    // A person enters the index when their first appearance has been
    // experienced. Subsequent appearances remain milestones on the same
    // card, so the page grows with the journey instead of duplicating people.
    return all.filter((entry) => {
      const first = episodes.findIndex((episode) => episode.id === entry.episodes[0]);
      return first >= 0 && first < progress;
    });
  }, [index, select, kind, episodes, progress]);

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        {kind === 'person' && (
          <div className="people-progress" aria-label={`${entries.length} people discovered`}>
            <span>{entries.length} {entries.length === 1 ? 'person' : 'people'} discovered</span>
            <span>{done.size} {done.size === 1 ? 'experience' : 'experiences'} completed</span>
          </div>
        )}
      </section>

      {loading ? (
        <div className="index-list">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : (
        <section className={`index-list ${kind === 'person' ? 'people-list' : ''}`} aria-label={title}>
          {entries.map((entry, i) => (
            <Reveal key={entry.id} delay={Math.min(i, 6) * 40}>
              {kind === 'person' ? (
                <PersonCard entry={entry} episodes={episodes} done={done} navigate={navigate} />
              ) : (
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
              )}
            </Reveal>
          ))}
          {entries.length === 0 && (
            <div className="empty-state">
              {kind === 'person' ? 'Complete your first experience to meet the people of Genesis.' : 'Nothing to show yet.'}
            </div>
          )}
        </section>
      )}
    </>
  );
}

interface PersonCardProps {
  entry: IndexEntry;
  episodes: ReturnType<typeof useEpisodes>['episodes'];
  done: Set<string>;
  navigate: ReturnType<typeof useNavigate>;
}

function PersonCard({ entry, episodes, done, navigate }: PersonCardProps) {
  const firstEpisode = entry.episodes[0];
  const revealedEpisodes = entry.episodes.filter((id) => done.has(id));
  const nextAppearance = entry.episodes.find((id) => !done.has(id));
  const firstMeta = episodes.find((episode) => episode.id === firstEpisode);
  const revealedCount = revealedEpisodes.length;
  const totalAppearances = entry.episodes.length;

  return (
    <article className="person-card">
      <header className="person-card-head">
        <div className="person-avatar" aria-hidden="true">
          {entry.label.charAt(0).toUpperCase()}
        </div>
        <div className="person-identity">
          <span className="eyebrow">PERSON</span>
          <h2>{entry.label}</h2>
          {entry.detail && <p>{entry.detail}</p>}
        </div>
        <div className="person-progress-ring" aria-label={`${revealedCount} of ${totalAppearances} appearances discovered`}>
          <strong>{revealedCount}</strong>
          <span>/{totalAppearances}</span>
        </div>
      </header>

      <div className="person-card-meta">
        <span>First seen in <b>{firstMeta?.label.split('·')[0].trim() ?? firstEpisode}</b></span>
        <span>{revealedCount === 1 ? '1 appearance revealed' : `${revealedCount} appearances revealed`}</span>
      </div>

      <div className="person-journey" aria-label={`${entry.label}'s appearances across Genesis`}>
        {entry.episodes.map((episodeId, index) => {
          const episode = episodes.find((item) => item.id === episodeId);
          const revealed = done.has(episodeId);
          const available = isEpisodeUnlocked(episodeId, episodes, (id) => done.has(id));
          const locked = !revealed && !available;

          return (
            <div className={`person-milestone ${revealed ? 'revealed' : locked ? 'locked' : 'current'}`} key={episodeId}>
              <span className="person-line" aria-hidden="true" />
              <span className="person-marker" aria-hidden="true">{revealed ? '✓' : locked ? '•' : '○'}</span>
              <div className="person-milestone-copy">
                <span className="person-milestone-label">EPISODE {String(index + 1).padStart(2, '0')}</span>
                <strong>{revealed ? episode?.title : locked ? 'A later chapter' : 'Your current chapter'}</strong>
                {revealed ? (
                  <button onClick={() => navigate(`/episode/${encodeURIComponent(episodeId)}`)}>
                    Revisit this appearance <Icon name="arrow" />
                  </button>
                ) : (
                  <span>{locked ? 'Continue the journey to reveal this part of the story.' : 'Complete this experience to reveal it here.'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {nextAppearance && !done.has(nextAppearance) && (
        <footer className="person-card-footer">
          <span className="person-footer-mark" aria-hidden="true">✦</span>
          <p>
            {revealedCount === 0
              ? 'This person has entered your journey.'
              : `${totalAppearances - revealedCount} ${totalAppearances - revealedCount === 1 ? 'appearance remains' : 'appearances remain'} to be discovered.`}
          </p>
        </footer>
      )}
    </article>
  );
}
