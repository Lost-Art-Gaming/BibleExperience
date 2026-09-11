import { Fragment } from 'react';
import { splitCitations } from '../lib/verseLink';

/**
 * Renders text with any plain-text scripture citation ("Genesis 2:7",
 * "Hebrews 4") turned into a link to the passage in the NWT online reader.
 * Link clicks stop propagation so they don't also trigger an enclosing
 * card's click handler.
 */
export function CitationText({ text }: { text: string }) {
  return (
    <>
      {splitCitations(text).map((part, i) =>
        part.url ? (
          <a
            key={i}
            className="cite-link"
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {part.text}
          </a>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
