import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTapestryThreads } from '../hooks/useTapestryThreads';
import { useEpisodes } from '../hooks/useEpisodes';
import { isDone } from '../lib/storage';
import { threads as toThreads } from '../lib/contentIndex';
import { buildTapestry } from '../lib/tapestry';
import { Icon } from './Icon';

/**
 * A compact, live preview of the Tapestry on Home — the app's differentiator,
 * otherwise buried in the Library. Shows how many connections you've woven
 * and a few of the threads, and opens the full loom.
 */
export function HomeTapestryTeaser() {
  const { threads } = useTapestryThreads();
  const { episodes } = useEpisodes();
  const navigate = useNavigate();

  const completed = useMemo(() => new Set(episodes.filter((e) => isDone(e.id)).map((e) => e.id)), [episodes]);
  const tap = useMemo(
    () => (threads ? buildTapestry(episodes, toThreads(threads.motifs), completed) : null),
    [threads, episodes, completed],
  );
  if (!tap || !threads) return null;

  const wovenLabels = threads.motifs.filter((t) => tap.wovenThreadIds.includes(t.id)).map((t) => t.label);
  const empty = tap.discovered === 0;
  const open = () => navigate('/tapestry');

  // A small decorative weave: a few chords across a compact arc of nodes.
  const N = 7;
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (-90 + (i / N) * 360) * (Math.PI / 180);
    return [60 + 46 * Math.cos(a), 60 + 46 * Math.sin(a)] as const;
  });
  const chords: Array<[number, number]> = [[0, 3], [1, 4], [2, 5], [0, 4], [2, 6]];

  return (
    <section className="content-section">
      <div
        className="tap-teaser"
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        }}
      >
        <svg viewBox="0 0 120 120" className="tap-teaser-weave" aria-hidden="true">
          {chords.map(([a, b], i) => (
            <path
              key={i}
              d={`M ${pts[a][0]} ${pts[a][1]} Q 60 60 ${pts[b][0]} ${pts[b][1]}`}
              className={`tt-chord ${!empty && i < tap.discovered ? 'on' : ''}`}
            />
          ))}
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3.4} className={`tt-node ${!empty && i < completed.size ? 'on' : ''}`} />
          ))}
        </svg>

        <div className="tap-teaser-copy">
          <span className="eyebrow">The Tapestry</span>
          {empty ? (
            <>
              <h2>See how it all connects</h2>
              <p>As you complete episodes, the themes and people they share weave into a growing map of Genesis.</p>
            </>
          ) : (
            <>
              <h2>
                <b>{tap.discovered}</b> connections woven
              </h2>
              <p className="tap-teaser-threads">{wovenLabels.slice(0, 4).join(' · ')}</p>
            </>
          )}
          <span className="tap-teaser-cta">
            Open the Tapestry <Icon name="arrow" />
          </span>
        </div>
      </div>
    </section>
  );
}
