export interface SectionRailItem {
  id: string;
  label: string;
}

export interface SectionRailProps {
  sections: SectionRailItem[];
  activeId: string;
  onJump?: (id: string) => void;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * Sticky in-page navigation for the reader's sections (Opening…Summary).
 * Desktop (>=900px, see .section-rail in global.css) shows it as a vertical
 * list beside the article; below that it collapses to a compact horizontal
 * strip via CSS alone — same markup, no separate mobile branch.
 *
 * Clicking a section scrolls it into view; the active item (driven by
 * useScrollSpy in the caller) gets the highlight.
 */
export function SectionRail({ sections, activeId, onJump }: SectionRailProps) {
  if (sections.length === 0) return null;

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    onJump?.(id);
  };

  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === activeId),
  );

  return (
    <nav className="section-rail" aria-label="Sections in this episode">
      <span className="eyebrow">
        Section {activeIndex + 1} of {sections.length}
      </span>
      <ol>
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              className={section.id === activeId ? 'active' : undefined}
              aria-current={section.id === activeId ? 'true' : undefined}
              onClick={() => jumpTo(section.id)}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
