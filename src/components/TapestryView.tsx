import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from './Skeleton';
import { useTapestryThreads } from '../hooks/useTapestryThreads';
import { useEpisodes } from '../hooks/useEpisodes';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { isDone } from '../lib/storage';
import { threads as toThreads, type IndexEntry } from '../lib/contentIndex';
import { buildTapestry, type Tapestry } from '../lib/tapestry';
import { Icon } from './Icon';

type Dimension = 'theme' | 'person';

interface Shared {
  tap: Tapestry;
  entries: IndexEntry[]; // woven threads for the active dimension
  completed: Set<string>;
  epNum: (id: string) => string;
  epTitle: (id: string) => string;
}

export function TapestryView() {
  const { threads, loading } = useTapestryThreads();
  const { episodes } = useEpisodes();
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const [dimension, setDimension] = useState<Dimension>('theme');

  const completed = useMemo(() => new Set(episodes.filter((e) => isDone(e.id)).map((e) => e.id)), [episodes]);

  const tap = useMemo(() => {
    if (!threads) return null;
    const entries = dimension === 'theme' ? threads.motifs : threads.people;
    return buildTapestry(episodes, toThreads(entries), completed);
  }, [threads, dimension, episodes, completed]);

  if (loading || !tap || !threads) {
    return (
      <div className="tapestry-wrap">
        <Skeleton />
      </div>
    );
  }

  const wovenSet = new Set(tap.wovenThreadIds);
  const entries = (dimension === 'theme' ? threads.motifs : threads.people).filter((t) => wovenSet.has(t.id));
  const epNum = (id: string) => {
    const i = episodes.findIndex((e) => e.id === id);
    return String(i + 1).padStart(2, '0');
  };
  const epTitle = (id: string) => episodes.find((e) => e.id === id)?.title.replace(/[“”"]/g, '') || id;
  const shared: Shared = { tap, entries, completed, epNum, epTitle };
  const empty = tap.discovered === 0;

  return (
    <div className="tapestry-wrap">
      <div className="tap-toolbar">
        <div className="tap-dims" role="tablist" aria-label="Weave by">
          {(['theme', 'person'] as Dimension[]).map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={dimension === d}
              className={`tap-dim ${dimension === d ? 'active' : ''}`}
              onClick={() => setDimension(d)}
            >
              {d === 'theme' ? 'Threads' : 'People'}
            </button>
          ))}
        </div>
        <div className="tap-meter" aria-label={`${tap.discovered} of ${tap.total} connections woven`}>
          <span className="tap-meter-num">{tap.discovered}</span>
          <span className="tap-meter-of">/ {tap.total} woven</span>
          <span className="tap-meter-bar" aria-hidden="true">
            <i style={{ width: `${tap.total ? (tap.discovered / tap.total) * 100 : 0}%` }} />
          </span>
        </div>
      </div>

      {empty ? <EmptyLoom completedCount={completed.size} /> : isDesktop ? <Loom {...shared} /> : <Warp {...shared} />}
    </div>
  );
}

function EmptyLoom({ completedCount }: { completedCount: number }) {
  const navigate = useNavigate();
  return (
    <div className="tap-stage tap-stage-empty">
      <svg viewBox="0 0 240 240" className="tap-empty-loom" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (-90 + i * 36) * (Math.PI / 180);
          return <circle key={i} cx={120 + 96 * Math.cos(a)} cy={120 + 96 * Math.sin(a)} r={4} className="tap-empty-node" />;
        })}
      </svg>
      <div className="tap-empty-copy">
        <h2>Nothing woven yet</h2>
        <p>
          {completedCount > 0
            ? 'Complete another episode to weave your first thread — connections appear once two experiences share a theme or a person.'
            : 'Complete an episode and it lights up here, weaving in the threads it shares with everything you discover next.'}
        </p>
        <button className="primary-btn" onClick={() => navigate('/journey')}>
          <Icon name="play" /> Continue the journey
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Desktop */

const R = 250; // ring radius
const CX = 320;
const CY = 320;
const angle = (i: number, n: number) => (-90 + (i / n) * 360) * (Math.PI / 180);
const pt = (i: number, n: number, radius = R) => [CX + radius * Math.cos(angle(i, n)), CY + radius * Math.sin(angle(i, n))] as const;

function Loom({ tap, entries, epNum, epTitle }: Shared) {
  const navigate = useNavigate();
  const n = tap.nodes.length;
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [selThread, setSelThread] = useState<string | null>(null);

  const woven = tap.edges.filter((e) => e.woven);
  const focused = hoverNode != null || selThread != null;
  const isActive = (e: (typeof woven)[number]) =>
    (hoverNode != null && (e.a === hoverNode || e.b === hoverNode)) ||
    (selThread != null && e.threadIds.includes(selThread));

  const nodeIndex = new Map(tap.nodes.map((nd) => [nd.id, nd.index] as const));

  return (
    <div className="loom">
      <div className="loom-stage">
        <svg viewBox="0 0 640 640" className="loom-svg" role="img" aria-label="Your woven tapestry of connections">
          <defs>
            <radialGradient id="loomGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" className="loom-glow-a" />
              <stop offset="70%" className="loom-glow-b" />
            </radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r={R - 20} fill="url(#loomGlow)" />

          {/* chords */}
          {woven.map((e, i) => {
            const ai = nodeIndex.get(e.a)!;
            const bi = nodeIndex.get(e.b)!;
            const [ax, ay] = pt(ai, n);
            const [bx, by] = pt(bi, n);
            // pull control points toward the centre for a woven, taut look
            const cax = ax + (CX - ax) * 0.6;
            const cay = ay + (CY - ay) * 0.6;
            const cbx = bx + (CX - bx) * 0.6;
            const cby = by + (CY - by) * 0.6;
            const active = isActive(e);
            return (
              <path
                key={`${e.a}-${e.b}`}
                d={`M ${ax} ${ay} C ${cax} ${cay} ${cbx} ${cby} ${bx} ${by}`}
                pathLength={1}
                className={`loom-chord ${active ? 'on' : ''} ${focused && !active ? 'off' : ''}`}
                style={{ animationDelay: `${Math.min(i, 24) * 45}ms` }}
              />
            );
          })}

          {/* nodes */}
          {tap.nodes.map((nd) => {
            const [x, y] = pt(nd.index, n);
            const [lx, ly] = pt(nd.index, n, R + 30);
            const hov = hoverNode === nd.id;
            return (
              <g
                key={nd.id}
                className={`loom-node ${nd.completed ? 'done' : ''} ${hov ? 'hover' : ''}`}
                onMouseEnter={() => nd.completed && setHoverNode(nd.id)}
                onMouseLeave={() => setHoverNode(null)}
                onClick={() => navigate(`/episode/${encodeURIComponent(nd.id)}`)}
                role="button"
                tabIndex={0}
                aria-label={`Episode ${epNum(nd.id)}: ${epTitle(nd.id)}`}
                onFocus={() => nd.completed && setHoverNode(nd.id)}
                onBlur={() => setHoverNode(null)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    navigate(`/episode/${encodeURIComponent(nd.id)}`);
                  }
                }}
              >
                <circle cx={x} cy={y} r={hov ? 11 : 8} className="loom-dot" />
                <text x={lx} y={ly} className="loom-label" textAnchor={lx < CX - 4 ? 'end' : lx > CX + 4 ? 'start' : 'middle'} dominantBaseline="middle">
                  {epNum(nd.id)}
                </text>
              </g>
            );
          })}
        </svg>
        {hoverNode && (
          <div className="loom-tip" role="status">
            <span>{epNum(hoverNode)}</span>
            {epTitle(hoverNode)}
          </div>
        )}
      </div>

      <aside className="loom-ledger" aria-label="Woven threads">
        <span className="eyebrow">{entries.length} threads woven</span>
        <ul>
          {entries.map((t) => (
            <li key={t.id}>
              <button
                className={`loom-thread ${selThread === t.id ? 'active' : ''}`}
                onMouseEnter={() => setSelThread(t.id)}
                onMouseLeave={() => setSelThread(null)}
                onFocus={() => setSelThread(t.id)}
                onBlur={() => setSelThread(null)}
                onClick={() => setSelThread(selThread === t.id ? null : t.id)}
              >
                <b>{t.label}</b>
                <span className="loom-thread-eps">{t.episodes.filter((id) => tap.nodes.find((nn) => nn.id === id)?.completed).map(epNum).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

/* ----------------------------------------------------------------- Mobile */

function Warp({ tap, entries, completed, epNum, epTitle }: Shared) {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);

  // For a given episode, the woven threads that pass through it and the other
  // completed episodes they connect to.
  const threadsFor = (id: string) =>
    entries
      .filter((t) => t.episodes.includes(id))
      .map((t) => ({ label: t.label, others: t.episodes.filter((o) => o !== id && completed.has(o)) }))
      .filter((t) => t.others.length > 0);

  return (
    <div className="warp">
      {tap.nodes.map((nd) => {
        const isOpen = open === nd.id;
        const woven = nd.completed ? threadsFor(nd.id) : [];
        return (
          <div key={nd.id} className={`warp-row ${nd.completed ? 'done' : 'locked'} ${isOpen ? 'open' : ''}`}>
            <button
              className="warp-head"
              disabled={!nd.completed || woven.length === 0}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : nd.id)}
            >
              <span className="warp-node" aria-hidden="true" />
              <span className="warp-num">{epNum(nd.id)}</span>
              <span className="warp-title">{epTitle(nd.id)}</span>
              <span className="warp-tally">
                {nd.completed ? (woven.length ? `${woven.length} threads` : '—') : 'Locked'}
              </span>
            </button>
            {isOpen && (
              <div className="warp-threads">
                {woven.map((t, i) => (
                  <div className="warp-thread" key={t.label} style={{ animationDelay: `${i * 50}ms` }}>
                    <b>{t.label}</b>
                    <div className="warp-strands">
                      {t.others.map((o) => (
                        <button className="warp-strand" key={o} onClick={() => navigate(`/episode/${encodeURIComponent(o)}`)}>
                          <i aria-hidden="true" />
                          {epNum(o)} · {epTitle(o)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <p className="warp-hint">Tap a lit episode to pull its threads. Complete more to weave the rest.</p>
    </div>
  );
}
