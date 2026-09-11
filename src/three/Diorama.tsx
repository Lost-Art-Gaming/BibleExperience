import { useEffect, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { MAT } from './dioramaMaterials';

/**
 * The miniature-diorama stage: a layered earth cross-section carrying the
 * artifact, lit like a studio display object (warm key + cool rim, soft
 * shadows, filmic tone mapping). Every artifact scene is built on top of
 * this, so the whole collection reads as one set of models.
 */

/** Earth strata, cut away at the block's edge like a museum cross-section. */
function EarthBlock({ w, d }: { w: number; d: number }) {
  const layers = [
    { h: 6, y: -3, mat: MAT.grass },
    { h: 14, y: -13, mat: MAT.sand },
    { h: 20, y: -30, mat: MAT.soil },
    { h: 30, y: -55, mat: MAT.rock },
  ];
  return (
    <group>
      {layers.map((L, i) => (
        <mesh key={i} position={[0, L.y, 0]} material={L.mat} receiveShadow>
          <boxGeometry args={[w, L.h, d]} />
        </mesh>
      ))}
      <mesh position={[0, 0.6, 0]} material={MAT.ground} receiveShadow>
        <boxGeometry args={[w - 1, 1.2, d - 1]} />
      </mesh>
    </group>
  );
}

export function Figure({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.4, 0]} material={MAT.person} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 2.4, 8]} />
      </mesh>
      <mesh position={[0, 3.0, 0]} material={MAT.person} castShadow>
        <sphereGeometry args={[0.7, 10, 8]} />
      </mesh>
    </group>
  );
}

export function Flame({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.scale.set(
        1 + Math.sin(t * 13) * 0.06,
        1 + Math.sin(t * 11) * 0.08 + Math.sin(t * 23) * 0.05,
        1 + Math.cos(t * 17) * 0.06,
      );
      group.current.rotation.y = Math.sin(t * 3) * 0.15;
    }
    if (light.current) light.current.intensity = 2.4 + Math.sin(t * 14) * 0.5 + Math.sin(t * 29) * 0.3;
  });
  return (
    <group position={position} scale={scale}>
      <group ref={group}>
        <mesh position={[0, 2.3, 0]} material={MAT.flame}>
          <coneGeometry args={[1.9, 4.6, 12]} />
        </mesh>
        <mesh position={[0, 1.9, 0]} material={MAT.flameCore}>
          <coneGeometry args={[1.05, 3, 12]} />
        </mesh>
      </group>
      <pointLight ref={light} color={0xff8a34} distance={95} decay={2} position={[0, 4, 0]} />
    </group>
  );
}

export function Palm({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const crown = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  const amp = useRef(0.05 + Math.random() * 0.04);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (crown.current) {
      crown.current.rotation.z = Math.sin(t * 1.1 + phase.current) * amp.current;
      crown.current.rotation.x = Math.cos(t * 0.9 + phase.current) * amp.current * 0.7;
    }
  });
  const th = 9 * scale;
  return (
    <group position={position}>
      <mesh position={[0, 1.2 + th / 2, 0]} material={MAT.trunk} castShadow>
        <cylinderGeometry args={[0.5 * scale, 0.9 * scale, th, 8]} />
      </mesh>
      <group ref={crown} position={[0, 1.2 + th, 0]}>
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <mesh
              key={i}
              material={MAT.frond}
              castShadow
              position={[Math.sin(a) * 3 * scale, 0.4, Math.cos(a) * 3 * scale]}
              rotation={[0, a, Math.PI / 2.3]}
            >
              <coneGeometry args={[1.3 * scale, 8 * scale, 4]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function Water({ radius, y, segments = 40 }: { radius: number; y: number; segments?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const base = useRef<Float32Array | null>(null);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
    if (!base.current) base.current = Float32Array.from(pos.array);
    const t = clock.getElapsedTime();
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const x = base.current[ix];
      const y2 = base.current[ix + 1];
      (pos.array as Float32Array)[ix + 2] = Math.sin(x * 0.6 + t * 2.2) * 0.16 + Math.cos(y2 * 0.7 + t * 1.7) * 0.16;
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
      <circleGeometry args={[radius, segments]} />
    </mesh>
  );
}

export interface DioramaProps {
  children: ReactNode;
  width?: number;
  depth?: number;
  distance?: number;
  target?: [number, number, number];
  autoRotate?: boolean;
  resetSignal?: number;
  reducedMotion?: boolean;
  onReady?: () => void;
}

function Rig({
  distance,
  target,
  autoRotate,
  resetSignal,
}: {
  distance: number;
  target: [number, number, number];
  autoRotate: boolean;
  resetSignal: number;
}) {
  const controls = useRef<any>(null);
  useEffect(() => {
    controls.current?.reset?.();
  }, [resetSignal]);
  return (
    <OrbitControls
      ref={controls}
      target={target}
      enableDamping
      dampingFactor={0.08}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      enablePan={false}
      minDistance={distance * 0.5}
      maxDistance={distance * 2.1}
      minPolarAngle={0.22}
      maxPolarAngle={Math.PI * 0.49}
    />
  );
}

export function Diorama({
  children,
  width = 150,
  depth = 118,
  distance = 210,
  target = [0, 8, 0],
  autoRotate = false,
  resetSignal = 0,
  reducedMotion = false,
  onReady,
}: DioramaProps) {
  const S = Math.max(width, depth) * 0.9;
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ fov: 38, near: 2, far: 1500, position: [distance * 0.42, distance * 0.5, distance * 0.78] }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        onReady?.();
      }}
    >
      <hemisphereLight args={[0xdfe7ef, 0x6b5a3f, 0.55]} />
      <directionalLight
        color={0xfff2d6}
        intensity={1.55}
        position={[-120, 170, 90]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={40}
        shadow-camera-far={520}
        shadow-camera-left={-S}
        shadow-camera-right={S}
        shadow-camera-top={S}
        shadow-camera-bottom={-S}
        shadow-bias={-0.0004}
      />
      <directionalLight color={0xa9c4ff} intensity={0.4} position={[140, 60, -120]} />
      <directionalLight intensity={0.25} position={[80, 40, 140]} />

      <EarthBlock w={width} d={depth} />
      {children}

      <Rig distance={distance} target={target} autoRotate={autoRotate && !reducedMotion} resetSignal={resetSignal} />
    </Canvas>
  );
}

export default Diorama;
