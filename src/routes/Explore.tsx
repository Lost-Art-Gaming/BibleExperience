import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CitationText } from '../components/CitationText';
import { Icon } from '../components/Icon';
import { Skeleton } from '../components/Skeleton';
import { useEpisodes } from '../hooks/useEpisodes';
import { isEpisodeUnlocked } from '../lib/progress';
import { cleanTitle } from '../lib/storage';
import { GEO_POINTS } from '../three/geoPoints';

// Code-split three.js: the relief map (and all of three/@react-three) loads
// only when the Explore route is visited, keeping it out of the main bundle.
const ReliefMap = lazy(() => import('../three/ReliefMap'));

const GEOGRAPHY_IMG = `${import.meta.env.BASE_URL}assets/explore-geography.jpg`;

/** Detect WebGL availability without leaking a live context. */
function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2')),
    );
  } catch {
    return false;
  }
}

/**
 * Catches any runtime failure from the lazy 3D scene (e.g. WebGL context
 * creation failing on a machine that claims support) and shows the static
 * fallback instead of crashing the route.
 */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SceneSkeleton() {
  return (
    <div className="scene-loading" aria-hidden="true">
      <div className="skeleton-lines">
        <Skeleton style={{ width: '60%' }} />
        <Skeleton style={{ width: '85%' }} />
        <Skeleton style={{ width: '45%' }} />
      </div>
    </div>
  );
}

export default function Explore() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const navigate = useNavigate();
  const { episodes } = useEpisodes();

  // WebGL support is fixed for the session; check once.
  const webglOK = useMemo(() => hasWebGL(), []);

  const active = GEO_POINTS.find((point) => point.id === activeId);
  const activeEp = active?.episode ? episodes.find((e) => e.id === active.episode) : undefined;
  const epUnlocked = active?.episode ? isEpisodeUnlocked(active.episode, episodes) : false;

  const handleReset = () => {
    setActiveId(null);
    setAutoRotate(false);
    setResetSignal((n) => n + 1);
  };

  const fallback = (
    <div
      className="three-fallback"
      style={{ backgroundImage: `linear-gradient(rgba(3,8,13,0.35),rgba(3,8,13,0.65)), url(${GEOGRAPHY_IMG})` }}
    >
      <p>Interactive 3D map unavailable on this device — explore the waypoints below.</p>
    </div>
  );

  return (
    <>
      <section className="page-intro compact">
        <span className="eyebrow">BIBLICAL GEOGRAPHY</span>
        <h1>Walk the Genesis journey.</h1>
        <p>
          Trace the route from Eden to Ararat, Babel, Ur, Haran and Canaan—the geography behind the first movement of
          Jehovah’s purpose.
        </p>
      </section>

      <section className="scene-card">
        {webglOK ? (
          <SceneBoundary fallback={fallback}>
            <Suspense fallback={<SceneSkeleton />}>
              <ReliefMap
                activeId={activeId}
                onSelect={setActiveId}
                autoRotate={autoRotate}
                resetSignal={resetSignal}
              />
            </Suspense>
          </SceneBoundary>
        ) : (
          fallback
        )}

        <div className="scene-copy">
          <span className="eyebrow">GENESIS ROUTE</span>
          <h2>Eden → Ararat → Babel → Ur → Haran → Canaan</h2>
          <div id="sceneDetail" className="scene-detail">
            {active ? (
              <>
                <p>
                  <CitationText text={active.description} />
                </p>
                {activeEp &&
                  (epUnlocked ? (
                    <button className="scene-ep-link" onClick={() => navigate(`/episode/${encodeURIComponent(activeEp.id)}`)}>
                      <Icon name="play" /> Read “{cleanTitle(activeEp.title)}”
                    </button>
                  ) : (
                    <span className="scene-ep-locked">Sealed — reach “{cleanTitle(activeEp.title)}” in your journey to read it.</span>
                  ))}
              </>
            ) : (
              <p>Select a waypoint to see why it matters — and step into the episode where its story is told.</p>
            )}
          </div>
        </div>

        {webglOK && (
          <div className="scene-actions">
            <button type="button" onClick={handleReset}>
              Reset
            </button>
            <button type="button" onClick={() => setAutoRotate((value) => !value)}>
              {autoRotate ? 'Stop rotation' : 'Auto rotate'}
            </button>
          </div>
        )}
      </section>

      <section className="location-list">
        {GEO_POINTS.map((point, index) => (
          <button
            key={point.id}
            data-location={point.id}
            aria-label={`Focus ${point.name}`}
            aria-pressed={activeId === point.id}
            className={activeId === point.id ? 'active' : undefined}
            onClick={() => setActiveId(point.id)}
          >
            <b>{point.name}</b>
            <small>{point.description}</small>
            <span>{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </section>
    </>
  );
}
