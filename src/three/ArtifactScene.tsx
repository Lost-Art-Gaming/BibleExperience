import { Diorama } from './Diorama';
import Eden from './artifacts/Eden';
import Ark from './artifacts/Ark';
import Babel from './artifacts/Babel';
import NoahAltar from './artifacts/NoahAltar';

/** Per-artifact block footprint and camera framing. */
const FRAMING: Record<string, { width: number; depth: number; distance: number; target: [number, number, number] }> = {
  eden: { width: 150, depth: 118, distance: 200, target: [6, 6, 0] },
  ark: { width: 186, depth: 124, distance: 232, target: [0, 10, 0] },
  'noah-altar': { width: 150, depth: 118, distance: 156, target: [0, 14, 0] },
  babel: { width: 150, depth: 132, distance: 215, target: [0, 22, 0] },
};

const SCENES: Record<string, (props: { cutaway?: boolean }) => JSX.Element> = {
  eden: () => <Eden />,
  ark: ({ cutaway }) => <Ark cutaway={cutaway} />,
  'noah-altar': () => <NoahAltar />,
  babel: () => <Babel />,
};

export interface ArtifactSceneProps {
  id: string;
  cutaway?: boolean;
  autoRotate?: boolean;
  resetSignal?: number;
  reducedMotion?: boolean;
  onReady?: () => void;
}

/**
 * Renders one artifact's miniature on the shared diorama stage. This whole
 * module is lazy-loaded, so three.js only arrives when a model is opened.
 */
export default function ArtifactScene({ id, cutaway, autoRotate, resetSignal, reducedMotion, onReady }: ArtifactSceneProps) {
  const frame = FRAMING[id] ?? FRAMING.eden;
  const Scene = SCENES[id];
  if (!Scene) return null;
  return (
    <Diorama
      width={frame.width}
      depth={frame.depth}
      distance={frame.distance}
      target={frame.target}
      autoRotate={autoRotate}
      resetSignal={resetSignal}
      reducedMotion={reducedMotion}
      onReady={onReady}
    >
      <Scene cutaway={cutaway} />
    </Diorama>
  );
}
