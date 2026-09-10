// Minimal event bus for opening the search overlay, same pattern as
// lib/toast.ts: the TopBar's #searchBtn dispatches a DOM CustomEvent that
// the always-mounted <SearchOverlay/> host (rendered at Shell level, so it
// reaches every route) listens for. No React context/provider plumbing
// needed to reach it from TopBar.
export const SEARCH_OPEN_EVENT = 'be-search-open';

export function openSearch(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SEARCH_OPEN_EVENT));
}
