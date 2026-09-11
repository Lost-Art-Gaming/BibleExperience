import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { Skeleton } from '../components/Skeleton';
import { useEpisodes } from '../hooks/useEpisodes';
import { loadEpisode } from '../lib/content';
import { cleanTitle } from '../lib/storage';
import { parseRef, verseUrl } from '../lib/verseLink';
import type { EpisodeData, EpisodeMeta } from '../lib/types';

interface InsightResult {
  meta: EpisodeMeta;
  snippet: string;
  refs: string[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/g, '“')
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function episodeText(data: EpisodeData): string {
  return data.sections.map((section) => stripHtml(section.html)).join(' ');
}

function episodeRefs(data: EpisodeData): string[] {
  const refs = new Set<string>();
  data.sections.forEach((section) => {
    const pattern = /data-ref=["']([^"']+)["']/g;
    for (const match of section.html.matchAll(pattern)) {
      if (parseRef(match[1])) refs.add(match[1]);
    }
  });
  return [...refs];
}

function makeSnippet(text: string, query: string): string {
  const normalizedText = text.toLowerCase();
  const at = normalizedText.indexOf(query.toLowerCase());
  if (at < 0) return text.slice(0, 180);
  const start = Math.max(0, at - 75);
  const end = Math.min(text.length, at + query.length + 105);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

export default function VerseInsights() {
  const { episodes } = useEpisodes();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [dataMap, setDataMap] = useState<Map<string, EpisodeData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!episodes.length) return;
    let cancelled = false;
    setLoading(true);

    Promise.all(
      episodes.map(async (meta): Promise<[string, EpisodeData] | null> => {
        try {
          return [meta.id, await loadEpisode(meta.id, meta.file)];
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setDataMap(new Map(entries.filter((entry): entry is [string, EpisodeData] => Boolean(entry))));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [episodes]);

  const popular = useMemo(() => {
    const counts = new Map<string, number>();
    dataMap.forEach((data) => episodeRefs(data).forEach((code) => counts.set(code, (counts.get(code) ?? 0) + 1)));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([code]) => code);
  }, [dataMap]);

  const results = useMemo<InsightResult[]>(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return episodes
      .map((meta) => {
        const data = dataMap.get(meta.id);
        if (!data) return null;
        const text = episodeText(data);
        const refs = episodeRefs(data);
        const matchingRefs = refs.filter((code) => parseRef(code)?.label.toLowerCase().includes(normalized));
        const textMatch = text.toLowerCase().includes(normalized);
        if (!matchingRefs.length && !textMatch) return null;
        return {
          meta,
          snippet: textMatch
            ? makeSnippet(text, normalized)
            : `Scripture connection: ${parseRef(matchingRefs[0])?.label ?? matchingRefs[0]}`,
          refs: matchingRefs.length ? matchingRefs.slice(0, 5) : refs.slice(0, 5),
        };
      })
      .filter((result): result is InsightResult => Boolean(result))
      .slice(0, 10);
  }, [query, episodes, dataMap]);

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">VERSE INSIGHTS</span>
        <h1>Study the text in context.</h1>
        <p>Find where a Scripture reference appears in the experience, then follow it to the New World Translation.</p>
      </section>

      <section
        className="content-section"
        aria-label="Verse Insights search"
        style={{ marginBottom: 32 }}
      >
        <label htmlFor="insightsInput" style={{ display: 'block', marginBottom: 10, color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>
          Search Scripture or a subject
        </label>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0 14px', border: '1px solid var(--line)', borderRadius: 4, background: 'var(--surface)' }}
        >
          <Icon name="search" />
          <input
            id="insightsInput"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “Genesis 3:15”, “covenant”, or “Noah”…"
            autoComplete="off"
            style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'var(--text)' }}
          />
          {query && (
            <button
              aria-label="Clear search"
              onClick={() => setQuery('')}
              style={{ border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }} aria-label="Suggested references">
          {popular.map((code) => (
            <button key={code} className="ep-chip" onClick={() => setQuery(parseRef(code)?.label ?? code)}>
              {parseRef(code)?.label ?? code}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <section className="index-list" aria-label="Loading verse insights">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </section>
      ) : query.trim() ? (
        <section className="index-list" aria-label="Verse Insights results">
          {results.map((result, index) => (
            <Reveal key={result.meta.id} delay={Math.min(index, 6) * 40}>
              <article className="index-item index-insight">
                <div className="index-head">
                  <div>
                    <span className="eyebrow">{result.meta.label}</span>
                    <b>{cleanTitle(result.meta.title)}</b>
                  </div>
                  <button className="secondary-btn" onClick={() => navigate(`/episode/${encodeURIComponent(result.meta.id)}`)}>
                    Read context <Icon name="arrow" />
                  </button>
                </div>
                <p className="index-detail">{result.snippet}</p>
                <div className="index-eps">
                  {result.refs.map((code) => {
                    const parsed = parseRef(code);
                    return parsed ? (
                      <a className="ep-chip cite-link" key={code} href={verseUrl(code) ?? '#'} target="_blank" rel="noopener noreferrer">
                        {parsed.label} <Icon name="arrow" />
                      </a>
                    ) : null;
                  })}
                </div>
              </article>
            </Reveal>
          ))}
          {results.length === 0 && <div className="empty-state">No matching Scripture or experience content found.</div>}
        </section>
      ) : (
        <section className="content-section" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Icon name="spark" />
          <h2>Start with a reference or a theme.</h2>
          <p style={{ maxWidth: 620, margin: '0 auto', color: 'var(--muted)' }}>
            Verse Insights searches the authored experience content and exposes its Scripture references without bundling copyrighted Bible text.
          </p>
        </section>
      )}
    </>
  );
}
