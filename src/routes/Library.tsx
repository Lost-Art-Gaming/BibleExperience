import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { FALLBACKS, HOME_ART, OVERLAYS } from '../lib/art';

const STUDY_CARDS: Array<[string, string, string, string?]> = [
  ['spark', 'The Tapestry', 'The connections you’ve woven', '/tapestry'],
  ['journey', 'People of Genesis', 'Who’s who, and where they appear', '/people'],
  ['library', 'Themes & Threads', 'The ideas that connect the books', '/themes'],
  ['search', 'Verse Insights', 'Study the text in context', '/insights'],
];

function quoteCardStyle(): CSSProperties {
  const asset = HOME_ART['.quote-card'];
  const overlay = OVERLAYS['.quote-card'];
  const fallback = FALLBACKS[4 % FALLBACKS.length];
  return {
    backgroundImage: [overlay, asset ? `url(${asset})` : null, fallback].filter(Boolean).join(', '),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

export default function Library() {
  const navigate = useNavigate();

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">THE LIBRARY</span>
        <h1>Discover more.</h1>
        <p>Explore the people, themes, threads and Scripture connections that deepen the experiences.</p>
      </section>

      <div className="library-grid">
        {STUDY_CARDS.map(([iconName, title, copy, route]) =>
          route ? (
            <button className="library-card" key={title} onClick={() => navigate(route)}>
              <span>
                <Icon name={iconName} />
              </span>
              <b>{title}</b>
              <small>{copy}</small>
              <em className="index-open">
                Open <Icon name="arrow" />
              </em>
            </button>
          ) : (
            <article className="library-card disabled" aria-disabled="true" key={title}>
              <span>
                <Icon name={iconName} />
              </span>
              <b>{title}</b>
              <small>{copy}</small>
              <em>Coming soon</em>
            </article>
          ),
        )}
      </div>

      <section className="quote-card" style={quoteCardStyle()}>
        <span className="eyebrow">THE CENTRAL THREAD</span>
        <blockquote>&#8220;You are worthy, Jehovah our God, to receive the glory and the honor and the power.&#8221;</blockquote>
        <cite>Revelation 4:11 · New World Translation</cite>
      </section>
    </>
  );
}
