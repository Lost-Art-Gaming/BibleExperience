import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Figure, Palm, Water } from '../Diorama';
import { MAT } from '../dioramaMaterials';

const GOLDEN = new THREE.MeshStandardMaterial({ color: 0xd8b04a, roughness: 0.72, metalness: 0.02 });
const LEAF_LIGHT = new THREE.MeshStandardMaterial({ color: 0x739b4f, roughness: 0.94 });
const LEAF_DEEP = new THREE.MeshStandardMaterial({ color: 0x345d35, roughness: 0.98 });
const LEAF_MID = new THREE.MeshStandardMaterial({ color: 0x4f7f42, roughness: 0.96 });
const FLOWER_IVORY = new THREE.MeshStandardMaterial({ color: 0xf1dfb6, roughness: 0.7 });
const FLOWER_GOLD = new THREE.MeshStandardMaterial({ color: 0xe5bc62, roughness: 0.68 });
const VINE_MAT = new THREE.MeshStandardMaterial({ color: 0x426f3a, roughness: 0.95 });
const STONE_MAT = new THREE.MeshStandardMaterial({ color: 0x8d876f, roughness: 0.96 });
const STONE_LIGHT = new THREE.MeshStandardMaterial({ color: 0xb5aa88, roughness: 0.92 });
const WATER_EDGE = new THREE.MeshStandardMaterial({ color: 0x477f78, roughness: 0.28, metalness: 0.05 });

function Branch({
  from,
  to,
  radius,
  material = MAT.trunk,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  material?: THREE.Material;
}) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const length = direction.length();
  const midpoint = a.clone().add(b).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return (
    <mesh position={midpoint} quaternion={quaternion} material={material} castShadow>
      <cylinderGeometry args={[radius * 0.72, radius, length, 8]} />
    </mesh>
  );
}

function LeafCluster({ position, scale = 1, material = LEAF_MID }: { position: [number, number, number]; scale?: number; material?: THREE.Material }) {
  return (
    <group position={position} scale={scale}>
      <mesh material={material} castShadow>
        <icosahedronGeometry args={[4.6, 1]} />
      </mesh>
      <mesh position={[-2.8, -0.7, 1.2]} scale={0.78} material={material} castShadow>
        <icosahedronGeometry args={[3.6, 1]} />
      </mesh>
      <mesh position={[2.6, -0.5, -1.3]} scale={0.82} material={material} castShadow>
        <icosahedronGeometry args={[3.8, 1]} />
      </mesh>
    </group>
  );
}

function GardenTree({
  position,
  fruit,
  scale = 1,
  sacred = false,
}: {
  position: [number, number, number];
  fruit: 'gold' | 'red';
  scale?: number;
  sacred?: boolean;
}) {
  const crown = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  const fruitMat = fruit === 'gold' ? GOLDEN : MAT.fruit;
  const foliage = sacred ? LEAF_LIGHT : LEAF_MID;

  useFrame(({ clock }) => {
    if (!crown.current) return;
    const t = clock.getElapsedTime();
    crown.current.rotation.z = Math.sin(t * 0.45 + phase.current) * 0.012;
    crown.current.rotation.x = Math.cos(t * 0.38 + phase.current) * 0.009;
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 6, 0]} material={MAT.trunk} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 2.35, 12, 12]} />
      </mesh>
      <Branch from={[0, 6, 0]} to={[-5, 11, 1]} radius={0.82} />
      <Branch from={[0, 7, 0]} to={[5.5, 12, -1]} radius={0.9} />
      <Branch from={[0, 8, 0]} to={[-2.2, 13.5, -4]} radius={0.62} />
      <Branch from={[1, 8, 0]} to={[3, 14.5, 4]} radius={0.58} />
      <Branch from={[-1.4, 2, 0]} to={[-7, 1.25, 0.5]} radius={0.48} />
      <Branch from={[1.1, 2, 0]} to={[6, 1.35, -1]} radius={0.44} />
      <Branch from={[0, 2, 0]} to={[0, 1.25, 6]} radius={0.42} />
      <Branch from={[0, 2, 0]} to={[1, 1.25, -6]} radius={0.4} />

      <group ref={crown} position={[0, 12, 0]}>
        <LeafCluster position={[0, 2.3, 0]} scale={1.12} material={foliage} />
        <LeafCluster position={[-5, 0.5, 1.8]} scale={0.78} material={LEAF_DEEP} />
        <LeafCluster position={[5, 0.8, -1.8]} scale={0.82} material={LEAF_LIGHT} />
        <LeafCluster position={[-1.5, 5.2, -3.2]} scale={0.72} material={LEAF_MID} />
        <LeafCluster position={[2.2, 4.8, 3.1]} scale={0.72} material={LEAF_DEEP} />

        {[
          [-4.6, 3.0, 2.7],
          [4.3, 2.8, -2.7],
          [0.7, 5.7, -3.7],
          [-1.8, 1.1, 4.6],
          [5.5, 0.1, 1.5],
          [-5.7, 0.4, -1.1],
          [2.5, 3.7, 4.2],
          [-3.4, 4.2, -2.5],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} material={fruitMat} castShadow>
            <sphereGeometry args={[0.85 + (i % 3) * 0.12, 12, 10]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function GrassTuft({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 1.9) * 0.8, 1.1, Math.cos(i * 1.7) * 0.8]}
          rotation={[0.12 + (i % 2) * 0.12, i * 0.9, -0.2 + (i % 3) * 0.12]}
          material={i % 3 === 0 ? LEAF_LIGHT : LEAF_DEEP}
          castShadow
        >
          <coneGeometry args={[0.18, 2.8 + (i % 3) * 0.7, 4]} />
        </mesh>
      ))}
    </group>
  );
}

function Flower({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.8, 0]} material={LEAF_MID}>
        <cylinderGeometry args={[0.09, 0.12, 1.6, 5]} />
      </mesh>
      <group position={[0, 1.55, 0]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38]} rotation={[0.25, a, 0]} material={i % 2 ? FLOWER_GOLD : FLOWER_IVORY}>
              <sphereGeometry args={[0.32, 7, 6]} />
            </mesh>
          );
        })}
        <mesh material={MAT.gold}>
          <sphereGeometry args={[0.18, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}

function Rock({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <mesh position={position} rotation={[rotation * 0.15, rotation, rotation * 0.08]} scale={[scale * 1.35, scale * 0.65, scale]} material={Math.round(scale * 10) % 2 ? STONE_MAT : STONE_LIGHT} castShadow>
      <icosahedronGeometry args={[2.2, 1]} />
    </mesh>
  );
}

function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2, 0]} material={LEAF_DEEP} castShadow>
        <icosahedronGeometry args={[3.2, 1]} />
      </mesh>
      <mesh position={[-2, 1.5, 1.2]} material={LEAF_MID} castShadow>
        <icosahedronGeometry args={[2.3, 1]} />
      </mesh>
      <mesh position={[2.1, 1.35, -0.8]} material={LEAF_LIGHT} castShadow>
        <icosahedronGeometry args={[2.1, 1]} />
      </mesh>
    </group>
  );
}

function Vine({ start, end, sag = 2.5, scale = 1 }: { start: [number, number, number]; end: [number, number, number]; sag?: number; scale?: number }) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(...start),
    new THREE.Vector3((start[0] + end[0]) * 0.5, Math.min(start[1], end[1]) - sag, (start[2] + end[2]) * 0.5),
    new THREE.Vector3(...end),
  ]);
  return (
    <mesh scale={scale} material={VINE_MAT} castShadow>
      <tubeGeometry args={[curve, 16, 0.16, 5, false]} />
    </mesh>
  );
}

function River({ points, width = 4.2 }: { points: [number, number, number][]; width?: number }) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return (
    <group>
      <mesh material={WATER_EDGE} position={[0, -0.35, 0]}>
        <tubeGeometry args={[curve, 42, width * 1.18, 8, false]} />
      </mesh>
      <mesh material={MAT.water} receiveShadow>
        <tubeGeometry args={[curve, 42, width, 10, false]} />
      </mesh>
    </group>
  );
}

function Pebbles({ count, seed = 0 }: { count: number; seed?: number }) {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const a = i * 2.399 + seed;
        const r = 13 + ((i * 17 + seed * 7) % 27);
        return (
          <Rock
            key={i}
            position={[Math.cos(a) * r, 1.55 + (i % 3) * 0.08, Math.sin(a) * r * 0.78]}
            scale={0.28 + (i % 5) * 0.08}
            rotation={a}
          />
        );
      })}
    </group>
  );
}

function GardenAtmosphere() {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = 1.15 + Math.sin(clock.getElapsedTime() * 0.35) * 0.08;
  });
  return (
    <>
      <pointLight ref={light} color={0xffe0a3} intensity={1.15} distance={110} decay={2} position={[5, 28, 2]} />
      <pointLight color={0x7fb7a1} intensity={0.55} distance={90} decay={2} position={[-34, 7, 10]} />
    </>
  );
}

/**
 * Eden — a lush garden planted eastward, with a river that parts into four
 * heads and the two significant trees at its centre. Genesis 2:8-14.
 */
export default function Eden() {
  const heads: { points: [number, number, number][]; width: number }[] = [
    { width: 3.9, points: [[-28, 1.45, 0], [-40, 1.55, 5], [-52, 1.5, 9], [-66, 1.42, 12]] },
    { width: 3.6, points: [[-2, 1.48, 2], [6, 1.52, 16], [12, 1.48, 31], [20, 1.4, 48]] },
    { width: 3.8, points: [[-1, 1.5, -2], [14, 1.52, -8], [29, 1.48, -17], [47, 1.42, -27]] },
    { width: 3.5, points: [[1, 1.47, 0], [12, 1.48, 5], [28, 1.44, 4], [51, 1.4, 2]] },
  ];

  const grass: [number, number, number, number][] = [
    [-55, 27, 0.9, 0.2], [-48, -25, 1.15, 1.1], [-38, 39, 0.75, 2.2], [-29, -38, 0.9, 0.4],
    [-18, 48, 0.8, 1.7], [-8, -43, 1.0, 0.8], [3, 42, 0.9, 2.4], [17, -46, 1.1, 1.3],
    [35, 35, 0.85, 2.8], [47, -38, 1.0, 0.6], [59, 25, 0.75, 1.8], [59, -8, 0.95, 2.1],
    [-64, -4, 0.8, 0.5], [36, -4, 0.8, 1.4], [-26, 15, 0.65, 2.6], [31, 15, 0.7, 0.9],
  ];

  const flowers: [number, number, number, number][] = [
    [-43, 20, 0.8, 0.2], [-38, -19, 0.65, 1.4], [-28, 33, 0.7, 2.1], [-21, -29, 0.9, 0.8],
    [-10, 35, 0.75, 1.7], [1, -35, 0.65, 0.4], [13, 37, 0.8, 2.2], [25, -34, 0.7, 1.1],
    [40, 28, 0.65, 0.6], [47, -22, 0.85, 2.4], [55, 8, 0.7, 1.3], [-55, -10, 0.65, 2.8],
  ];

  const bushes: [number, number, number][] = [
    [-51, 11, 0.8], [-43, -7, 0.7], [-34, -27, 0.9], [-28, 26, 0.72],
    [34, 24, 0.82], [42, -11, 0.76], [50, -28, 0.95], [58, 15, 0.72],
  ];

  const rocks: [number, number, number, number][] = [
    [-38, 3, 1.3, 0.2], [-30, 8, 0.75, 1.2], [-23, 2, 1.0, 2.2],
    [28, 8, 1.2, 0.7], [35, 12, 0.8, 1.9], [45, 3, 1.1, 0.4],
    [17, 24, 0.7, 2.6], [-48, 15, 0.9, 1.6],
  ];

  return (
    <group>
      <GardenAtmosphere />

      {/* Source of the river. The four streams visibly diverge from this basin. */}
      <Water radius={11} y={1.52} segments={56} />
      <mesh position={[0, 1.0, 0]} material={MAT.water} receiveShadow>
        <cylinderGeometry args={[11.6, 12.3, 0.6, 48]} />
      </mesh>
      <Pebbles count={18} seed={4} />

      {/* Natural, winding river heads rather than straight rectangular channels. */}
      {heads.map((head, i) => <River key={i} points={head.points} width={head.width} />)}
      <River points={[[-31, 1.47, 0], [-43, 1.5, -1], [-57, 1.46, -3], [-70, 1.42, -6]]} width={4.1} />

      {/* Central rise — the visual heart of the garden. */}
      <mesh position={[14, 1.45, -6]} material={MAT.grass} receiveShadow>
        <cylinderGeometry args={[21, 24, 2.0, 36]} />
      </mesh>
      <mesh position={[14, 2.38, -6]} material={MAT.ground} receiveShadow>
        <cylinderGeometry args={[18.5, 20, 0.28, 36]} />
      </mesh>

      <GardenTree position={[8, 2.3, -4]} fruit="gold" scale={1.18} sacred />
      <GardenTree position={[22, 2.35, -12]} fruit="red" scale={1.0} sacred />

      {/* Tall canopy around the perimeter, now varied with dense broadleaf trees. */}
      {[
        [-48, 34, 1.0], [-53, -31, 0.92], [40, 39, 1.02], [51, -35, 1.05],
        [-17, 44, 0.92], [30, -43, 0.96], [-61, 7, 1.0], [58, 13, 0.94],
        [-42, -1, 0.72], [36, 2, 0.76], [-8, 50, 0.72], [4, -49, 0.75],
      ].map(([x, z, s], i) => <Palm key={i} position={[x, 0, z]} scale={s} />)}

      {bushes.map(([x, z, s], i) => <Bush key={i} position={[x, 0.2, z]} scale={s} />)}
      {grass.map(([x, z, s, r], i) => <GrassTuft key={i} position={[x, 1.15, z]} scale={s} rotation={r} />)}
      {flowers.map(([x, z, s, r], i) => <Flower key={i} position={[x, 1.25, z]} scale={s} rotation={r} />)}
      {rocks.map(([x, z, s, r], i) => <Rock key={i} position={[x, 1.65, z]} scale={s} rotation={r} />)}

      {/* Small flowering undergrowth fills the gaps between the larger silhouettes. */}
      {Array.from({ length: 36 }).map((_, i) => {
        const a = i * 2.17;
        const r = 23 + ((i * 19) % 31);
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r * 0.72;
        return <GrassTuft key={`g-${i}`} position={[x, 1.1, z]} scale={0.35 + (i % 4) * 0.08} rotation={a} />;
      })}

      {/* Vines break up the large trunks and make the garden feel old and established. */}
      <Vine start={[-48, 9, 34]} end={[-45, 2.5, 31]} sag={2.0} />
      <Vine start={[40, 10, 39]} end={[43, 2.5, 35]} sag={2.4} />
      <Vine start={[-17, 10, 44]} end={[-14, 2.5, 40]} sag={2.2} />
      <Vine start={[30, 9, -43]} end={[33, 2.5, -39]} sag={2.3} />

      {/* Adam and Eve remain small so the garden dominates the composition. */}
      <Figure position={[-6, 1.2, 14]} scale={0.95} />
      <Figure position={[-12, 1.2, 9]} scale={0.9} />
    </group>
  );
}
