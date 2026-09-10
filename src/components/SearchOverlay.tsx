import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { useEpisodes } from '../hooks/useEpisodes';
import { loadEpisode } from '../lib/content';
import { SEARCH_OPEN_EVENT } from '../lib/search';
import { cleanTitle } from '../lib/storage';
import type { EpisodeData, EpisodeMeta } from '../lib/types';

interface SearchMatch {
  meta: EpisodeMeta;
  snippet: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}

function bodyOf(data: EpisodeData | undefined): string {
  return data ? data.sections.map((section) => stripHtml(section.html)).join(' ') : '';
}

/**
 * Search overlay, rendered once at Shell level (so it's reachable from
 * every route). Ports the legacy openSearch/updateSearchResults/closeSearch
 * behavior: opened via the SEARCH_OPEN_EVENT dispatched by TopBar's
 * #searchBtn, searches episode title/subtitle/label plus body text (the
 * section HTML with tags stripped, loaded on demand since only metadata is
 * available up front), a focus trap while open, Escape to close, and focus
 * restored to #searchBtn on close.
 */
export function SearchOverlay() {
  const { episodes } = useEpisodes();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dataMap, setDataMap] = useState<Map<string, EpisodeData>>(new Map());
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener(SEARCH_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(SEARCH_OPEN_EVENT, handleOpen);
  }, []);

  // Load every episode's full content (mostly already cached by
  // EpisodesProvider's prefetch) so body text is searchable, same corpus
  // the legacy updateSearchResults searched over state.episodeData.
  useEffect(() => {
    if (!open || episodes.length === 0) return;
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        episodes.map(async (meta): Promise<[string, EpisodeData] | null> => {
          try {
            const data = await loadEpisode(meta.id, meta.file);
            return [meta.id, data];
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      setDataMap((prev) => {
        const next = new Map(prev);
        entries.forEach((entry) => {
          if (entry) next.set(entry[0], entry[1]);
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [open, episodes]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
    document.getElementById('searchBtn')?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'),
      ).filter((node) => node.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [open]);

  const matches = useMemo<SearchMatch[]>(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return episodes
      .filter((episode) => {
        const body = bodyOf(dataMap.get(episode.id));
        const haystack = `${episode.title} ${episode.subtitle} ${episode.label} ${body}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 8)
      .map((episode) => {
        const body = bodyOf(dataMap.get(episode.id));
        const haystack = `${episode.title} ${episode.subtitle} ${body}`.toLowerCase();
        const at = haystack.indexOf(normalized);
        const snippet =
          at >= 0
            ? body.replace(/\s+/g, ' ').trim().slice(Math.max(0, at - 45), at + normalized.length + 70)
            : episode.subtitle;
        return { meta: episode, snippet };
      });
  }, [query, episodes, dataMap]);

  if (!open) return null;

  const handleSelect = (id: string) => {
    close();
    navigate(`/episode/${encodeURIComponent(id)}`);
  };

  return (
    <div
      className="search-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="search-panel" role="dialog" aria-modal="true" aria-labelledby="searchTitle" ref={panelRef}>
        <button className="close-search" aria-label="Close search" onClick={close}>
          ×
        </button>
        <span className="eyebrow">SEARCH THE EXPERIENCE</span>
        <h2 id="searchTitle">Find an episode</h2>
        <input
          id="searchInput"
          autoComplete="off"
          placeholder="Try “Eden”, “Noah”, “covenant”…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          ref={inputRef}
        />
        <div id="searchResults">
          {!query.trim() ? (
            <p className="search-hint">Search titles, descriptions and the text inside each episode.</p>
          ) : matches.length ? (
            matches.map((match) => (
              <button key={match.meta.id} data-result={match.meta.id} onClick={() => handleSelect(match.meta.id)}>
                <small>{match.meta.label}</small>
                <b>{cleanTitle(match.meta.title)}</b>
                <p>{match.snippet}</p>
                <Icon name="arrow" />
              </button>
            ))
          ) : (
            <p className="no-results">No experiences found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
