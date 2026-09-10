import { useNavigate } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { useEpisodes } from '../hooks/useEpisodes';

export default function Timeline() {
  const navigate = useNavigate();
  const { timeline } = useEpisodes();

  return (
    <>
      <section className="page-intro">
        <span className="eyebrow">CHRONOLOGY</span>
        <h1>The road through Genesis</h1>
        <p>Explore the sequence of events and distinguish anchored dates from approximate or undated placements.</p>
      </section>

      <div className="legend">
        <span>
          <i className="anchor" />
          Anchor
        </span>
        <span>
          <i className="derived" />
          Derived
        </span>
        <span>
          <i className="approx" />
          Approx.
        </span>
        <span>
          <i className="undated" />
          Undated
        </span>
      </div>

      <section className="timeline-list">
        {timeline.map((item, index) => (
          <Reveal key={`${item.ep ?? item.what}-${index}`} delay={Math.min(index, 6) * 60}>
            <button
              className={`timeline-item ${item.kind}`}
              data-episode={item.ep ?? ''}
              disabled={!item.ep}
              aria-disabled={!item.ep}
              onClick={item.ep ? () => navigate(`/episode/${encodeURIComponent(item.ep!)}`) : undefined}
            >
              <span className="timeline-dot" />
              <span className="timeline-line" />
              <div className="timeline-copy">
                <small>{item.when}</small>
                <h3>{item.what}</h3>
                <p>{item.note}</p>
              </div>
              <strong>{String(index + 1).padStart(2, '0')}</strong>
            </button>
          </Reveal>
        ))}
      </section>
    </>
  );
}
