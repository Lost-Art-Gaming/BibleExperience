import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { CitationText } from './CitationText';
import { Skeleton } from './Skeleton';
import type { Artifact } from '../lib/artifacts';

const ArtifactScene = lazy(() => import('../three/ArtifactScene'));

/** Detect WebGL without leaking a live context. */
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

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** On a narrow stage the legend would cover the model, so it starts closed. */
function isNarrow(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(max-width: 620px)').matches === true;
}

/** Keeps a WebGL failure from taking the page down with it. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface ArtifactStageProps {
  artifact: Artifact;
  /** Compact framing for the in-episode embed. */
  compact?: boolean;
}

/**
 * A miniature diorama presented as a display object: title plate, the
 * scripture it is built from, a legend of its parts, and the controls to
 * turn it, reset it, and open it up.
 */
export function ArtifactStage({ artifact, compact = false }: ArtifactStageProps) {
  const webglOK = useMemo(() => hasWebGL(), []);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [autoRotate, setAutoRotate] = useState(!reduced);
  const [cutaway, setCutaway] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [legendOpen, setLegendOpen] = useState(() => !compact && !isNarrow());
  const [sceneReady, setSceneReady] = useState(false);
  const isExactEden = artifact.id === 'eden';

  const fallback = (
    <div className="diorama-fallback">
      <p>
        This model needs 3D graphics, which this device doesn’t offer. The parts of {artifact.name} are listed below.
      </p>
    </div>
  );

  return (
    <figure className={`diorama${compact ? ' diorama-compact' : ''}`} data-artifact={artifact.id}>
      <div className="diorama-stage">
        {isExactEden ? (
          <iframe
            src="/garden-of-eden.html"
            title="The Garden of Eden — miniature diorama"
            loading="eager"
            allow="fullscreen"
            style={{ width: '100%', height: '100%', border: 0, display: 'block', background: 'transparent' }}
          />
        ) : (
          <>
            <div hidden={webglOK && sceneReady} aria-hidden={webglOK && sceneReady}>
              {fallback}
            </div>

            {webglOK ? (
              <SceneBoundary fallback={fallback}>
                <Suspense fallback={<div className="diorama-loading"><Skeleton /></div>}>
                  <ArtifactScene
                    id={artifact.id}
                    cutaway={cutaway}
                    autoRotate={autoRotate}
                    resetSignal={resetSignal}
                    reducedMotion={reduced}
                    onReady={() => setSceneReady(true)}
                  />
                </Suspense>
              </SceneBoundary>
            ) : null}

            <div className="diorama-plate">
              <h3>{artifact.name}</h3>
              <p>{artifact.blurb}</p>
            </div>

            {webglOK && (
              <div className="diorama-controls">
                {artifact.cutaway && (
                  <button type="button" aria-pressed={cutaway} onClick={() => setCutaway((v) => !v)}>
                    {cutaway ? `${artifact.cutaway} on` : `${artifact.cutaway} off`}
                  </button>
                )}
                <button type="button" aria-pressed={autoRotate} onClick={() => setAutoRotate((v) => !v)}>
                  {autoRotate ? 'Stop turning' : 'Turn'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetSignal((n) => n + 1);
                    setCutaway(false);
                  }}
                >
                  Reset view
                </button>
              </div>
            )}

            <aside className={`diorama-legend${legendOpen ? '' : ' closed'}`}>
              <button className="diorama-legend-head" onClick={() => setLegendOpen((v) => !v)} aria-expanded={legendOpen}>
                <span>Its parts</span>
                <i aria-hidden="true">▾</i>
              </button>
              <p className="diorama-cite">
                <CitationText text={artifact.citation} />
              </p>
              <ul>
                {artifact.legend.map((item) => (
                  <li key={item.label}>
                    <span className="sw" style={{ background: item.color }} />
                    <span>
                      <b>{item.label}</b> <span className="dim">{item.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </>
        )}
      </div>

      {!isExactEden && (
        <figcaption className="diorama-caption">
          Built to the proportions of <CitationText text={artifact.citation} /> · drag to turn · scroll to zoom
        </figcaption>
      )}
    </figure>
  );
}
