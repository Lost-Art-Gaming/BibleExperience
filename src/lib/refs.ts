// Extracts the scripture references an episode section's own HTML actually
// names — the `<span class="ref" data-ref="…">Label</span>` markup already
// embedded in the content. This is the ONLY source for the "Connections in
// this episode" panel: there is no cross-reference dataset anywhere in the
// repo, so nothing beyond what the episode text itself cites is ever shown.
export interface EpisodeRef {
  ref: string;
  label: string;
}

/**
 * Parses `<span class="ref" data-ref="X">Label</span>` spans out of a
 * section's HTML and returns `{ ref, label }` pairs, deduped by `ref` (first
 * occurrence wins).
 */
export function extractRefs(html: string): EpisodeRef[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const seen = new Set<string>();
  const results: EpisodeRef[] = [];

  doc.querySelectorAll('span.ref[data-ref]').forEach((el) => {
    const ref = el.getAttribute('data-ref')?.trim();
    const label = el.textContent?.trim();
    if (!ref || !label || seen.has(ref)) return;
    seen.add(ref);
    results.push({ ref, label });
  });

  return results;
}
