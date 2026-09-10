import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState, type ElementRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { buildTerrain, sampleHeight } from './terrain';
import { GEO_POINTS } from './geoPoints';

export interface ReliefMapProps {
  /** Currently focused waypoint id, or null for the default overview. */
  activeId: string | null;
  /** Fired when a marker is clicked in the scene. */
  onSelect: (id: string) => void;
  /** Whether the camera slowly auto-rotates. */
  autoRotate: boolean;
  /** Bump this number to reset the camera/controls to their starting pose. */
  resetSignal: number;
}

const SEA_COLOR = new THREE.Color('#12313a');
const LAND_COLOR = new THREE.Color('#1b2a2f');
const PEAK_COLOR = new THREE.Color('#b98f4e');
const MARKER_COLOR = new THREE.Color('#e4b75e');

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** Height (world Y) at which a marker's base should sit on the terrain. */
function surfaceY(x: number, z: number): number {
  return sampleHeight(x, z);
}

/**
 * Terrain mesh: the raised-relief geometry tinted by height via vertex colors
 * (deep teal sea → muted land → warm gold peaks) and lit by the scene lights.
 */
function Terrain() {
  const geometry = useMemo(() => {
    const geo = buildTerrain();
    const position = geo.getAttribute('position') as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const h = position.getY(i);
      if (h < 0.05) {
        // Sea basin → low land.
        const t = THREE.MathUtils.clamp((h + 1.6) / 1.65, 0, 1);
        tmp.copy(SEA_COLOR).lerp(LAND_COLOR, t);
      } else {
        // Land → gold peaks.
        const t = THREE.MathUtils.clamp(h / 2.4, 0, 1);
        tmp.copy(LAND_COLOR).lerp(PEAK_COLOR, t);
      }
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Dispose the generated geometry when the mesh unmounts.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0.04} />
    </mesh>
  );
}

/**
 * A single glowing gold waypoint marker with a floating label. Scales up and
 * glows brighter when it is the active selection.
 */
function Marker({
  id,
  name,
  x,
  z,
  active,
  onSelect,
}: {
  id: string;
  name: string;
  x: number;
  z: number;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const base = surfaceY(x, z);
  const scale = active ? 1.4 : 1;
  return (
    <group position={[x, base, z]}>
      <mesh
        position={[0, 0.45, 0]}
        scale={scale}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
        }}
      >
        <coneGeometry args={[0.26, 0.72, 20]} />
        <meshStandardMaterial
          color={MARKER_COLOR}
          emissive={MARKER_COLOR}
          emissiveIntensity={active ? 1.4 : 0.7}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
      <Html
        position={[0, 1.1, 0]}
        center
        distanceFactor={16}
        occlude={false}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <span
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: active ? '#f0cf91' : '#e4b75e',
            textShadow: '0 1px 6px rgba(3,8,13,0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
      </Html>
    </group>
  );
}

/** Densely interpolate the waypoint polyline for a smooth animated draw-in. */
function useRoutePoints(): THREE.Vector3[] {
  return useMemo(() => {
    const points: THREE.Vector3[] = [];
    const perSegment = 18;
    for (let i = 0; i < GEO_POINTS.length - 1; i++) {
      const a = GEO_POINTS[i].position;
      const b = GEO_POINTS[i + 1].position;
      const steps = i === GEO_POINTS.length - 2 ? perSegment : perSegment - 1;
      for (let s = 0; s <= steps; s++) {
        const t = s / perSegment;
        const x = a[0] + (b[0] - a[0]) * t;
        const z = a[2] + (b[2] - a[2]) * t;
        // Float the line slightly above the surface so it reads clearly.
        points.push(new THREE.Vector3(x, surfaceY(x, z) + 0.18, z));
      }
    }
    return points;
  }, []);
}

/**
 * The gold route line. Animates its draw-in from Eden → Canaan on mount by
 * growing the number of visible points. When reduced motion is preferred, the
 * full route appears instantly.
 */
function AnimatedRoute({ reduced }: { reduced: boolean }) {
  const points = useRoutePoints();
  const [count, setCount] = useState(reduced ? points.length : 2);
  const startRef = useRef<number | null>(null);

  useFrame((state) => {
    if (reduced || count >= points.length) return;
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startRef.current;
    const progress = Math.min(1, elapsed / 1.7);
    const n = Math.max(2, Math.min(points.length, Math.floor(2 + progress * (points.length - 2))));
    if (n !== count) setCount(n);
  });

  const visible = useMemo(() => points.slice(0, count), [points, count]);

  return <Line points={visible} color="#e4b75e" lineWidth={2.6} transparent opacity={0.95} />;
}

/**
 * OrbitControls plus focus/reset behaviour. The camera target eases toward the
 * active waypoint (or the map centre) and `reset()` restores the start pose.
 */
function ControlsRig({
  activeId,
  autoRotate,
  resetSignal,
}: {
  activeId: string | null;
  autoRotate: boolean;
  resetSignal: number;
}) {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const target = useMemo(() => new THREE.Vector3(0, 0, 1.4), []);

  useEffect(() => {
    if (resetSignal > 0) controls.current?.reset();
  }, [resetSignal]);

  useEffect(() => {
    const point = GEO_POINTS.find((g) => g.id === activeId);
    if (point) {
      const [x, , z] = point.position;
      target.set(x, surfaceY(x, z) + 0.3, z);
    } else {
      target.set(0, 0, 1.4);
    }
  }, [activeId, target]);

  useFrame(() => {
    const controlsInstance = controls.current;
    if (!controlsInstance) return;
    controlsInstance.target.lerp(target, 0.08);
    controlsInstance.update();
  });

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      autoRotate={autoRotate}
      autoRotateSpeed={0.6}
      minDistance={10}
      maxDistance={30}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI * 0.46}
    />
  );
}

/**
 * Premium stylized raised-relief map of the ancient Near East with the Genesis
 * route drawn as an animated glowing path and gold waypoint markers. Rendered
 * inside a single R3F `<Canvas>`; three.js is code-split via React.lazy at the
 * Explore route.
 */
export default function ReliefMap({ activeId, onSelect, autoRotate, resetSignal }: ReliefMapProps) {
  const reduced = prefersReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [12, 9, 14], fov: 42, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x071018, 0);
        scene.fog = new THREE.Fog(0x071018, 24, 55);
      }}
    >
      <hemisphereLight args={[0xb6c6ce, 0x09121a, 1.4]} />
      <directionalLight color={0xf2d28d} intensity={2.1} position={[8, 14, 4]} />
      <ambientLight intensity={0.15} />

      <Terrain />
      <AnimatedRoute reduced={reduced} />

      {GEO_POINTS.map((point) => (
        <Marker
          key={point.id}
          id={point.id}
          name={point.name}
          x={point.position[0]}
          z={point.position[2]}
          active={activeId === point.id}
          onSelect={onSelect}
        />
      ))}

      <ControlsRig activeId={activeId} autoRotate={autoRotate} resetSignal={resetSignal} />
    </Canvas>
  );
}
