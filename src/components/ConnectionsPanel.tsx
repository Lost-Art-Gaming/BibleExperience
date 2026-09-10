import { extractRefs, type EpisodeRef } from '../lib/refs';
import type { EpisodeSection } from '../lib/types';

export interface ConnectionsPanelProps {
  episodeId: string;
  sections: EpisodeSection[];
}

/**
 * "Connections in this episode" — the honest replacement for the aspirational
 * `.threadHost` "Tapestry" placeholder. There is no cross-reference dataset
 * anywhere in this app: this panel lists ONLY the scripture passages the
 * episode's own text actually names (via its `<span class="ref">` spans),
 * deduped across all of the episode's sections. Nothing is invented.
 *
 * Shaped as `{ episodeId, refs: EpisodeRef[] }` so that if a real
 * `{from,to,note}[]` cross-reference dataset is supplied later, a fuller
 * Tapestry graph can render here with no structural change to the caller.
 */
export function ConnectionsPanel({ episodeId, sections }: ConnectionsPanelProps) {
  const refs = dedupeRefs(sections.flatMap((section) => extractRefs(section.html)));

  if (refs.length === 0) {
    return (
      <div className="connections connections-empty" data-ep={episodeId}>
        <span className="eyebrow">Connections</span>
        <p>This episode doesn&rsquo;t cite any other passages by reference.</p>
      </div>
    );
  }

  return (
    <div className="connections" data-ep={episodeId}>
      <span className="eyebrow">Connections in this episode</span>
      <h3>Passages this episode cites</h3>
      <ul>
        {refs.map((item) => (
          <li key={item.ref} className="thread-row">
            <b>{item.label}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function dedupeRefs(refs: EpisodeRef[]): EpisodeRef[] {
  const seen = new Set<string>();
  const result: EpisodeRef[] = [];
  for (const item of refs) {
    if (seen.has(item.ref)) continue;
    seen.add(item.ref);
    result.push(item);
  }
  return result;
}
