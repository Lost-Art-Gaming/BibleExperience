import { useNavigate } from 'react-router-dom';
import { CitationText } from '../components/CitationText';
import { Reveal } from '../components/Reveal';
import { useEpisodes } from '../hooks/useEpisodes';

type Kind = 'anchor' | 'derived' | 'approx' | 'undated';

// How each date is known — the methodology the chronology is built on.
const METHOD: Record<Kind, { label: string; how: string }> = {
  anchor: { label: 'Anchor', how: 'Explicitly stated or directly countable in Scripture.' },
  derived: { label: 'Derived', how: 'Calculated from the genealogies and lifespans given in the text.' },
  approx: { label: 'Approx.', how: 'A reasoned estimate — the account implies a span, not a point.' },
  undated: { label: 'Undated', how: 'No time is given; placed by narrative sequence, not by a date.' },
};
const ORDER: Kind[] = ['anchor', 'derived', 'approx', 'undated'];

export default function Timeline() {
  const navigate = useNavigate();
  const { timeline } = useEpisodes();

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">CHRONOLOGY</span>
        <h1>The road through Genesis</h1>
        <p>
          Every placement below carries how it is known — an anchored date, a figure derived from Scripture, an
          estimate, or an undated event set only by sequence. The reasoning, and the verses behind it, travel with each.
        </p>
      </section>

      <section className="chrono-method" aria-label="How these dates are known">
        {ORDER.map((kind) => (
          <div className="chrono-method-row" key={kind}>
            <i className={kind} />
            <b>{METHOD[kind].label}</b>
            <span>{METHOD[kind].how}</span>
          </div>
        ))}
      </section>

      <section className="timeline-list">
        {timeline.map((item, index) => {
          const kind = item.kind as Kind;
          return (
            <Reveal key={`${item.ep ?? item.what}-${index}`} delay={Math.min(index, 6) * 60}>
              <div
                className={`timeline-item ${kind}${item.ep ? ' has-ep' : ''}`}
                data-episode={item.ep ?? ''}
                onClick={item.ep ? () => navigate(`/episode/${encodeURIComponent(item.ep!)}`) : undefined}
              >
                <span className="timeline-dot" />
                <span className="timeline-line" />
                <div className="timeline-copy">
                  <div className="timeline-top">
                    <small>
                      <CitationText text={item.when} />
                    </small>
                    <span className={`timeline-kind ${kind}`} title={METHOD[kind].how}>
                      {METHOD[kind].label}
                    </span>
                  </div>
                  {item.ep ? (
                    <h3>
                      <button
                        className="timeline-what"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/episode/${encodeURIComponent(item.ep!)}`);
                        }}
                      >
                        {item.what}
                      </button>
                    </h3>
                  ) : (
                    <h3>{item.what}</h3>
                  )}
                  <p>
                    <CitationText text={item.note} />
                  </p>
                </div>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
              </div>
            </Reveal>
          );
        })}
      </section>
    </>
  );
}
