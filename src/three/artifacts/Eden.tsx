import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Figure } from '../Diorama';
import { MAT } from '../dioramaMaterials';

const LEAF_LIGHT = new THREE.MeshStandardMaterial({ color: 0x82ad61, roughness: 0.96 });
const LEAF_MID = new THREE.MeshStandardMaterial({ color: 0x4d8648, roughness: 0.97 });
const LEAF_DEEP = new THREE.MeshStandardMaterial({ color: 0x245d3a, roughness: 0.99 });
const LEAF_GOLD = new THREE.MeshStandardMaterial({ color: 0x9cac58, roughness: 0.94 });
const LEAF_BLUEGREEN = new THREE.MeshStandardMaterial({ color: 0x5f8f7b, roughness: 0.96 });
const BARK_LIGHT = new THREE.MeshStandardMaterial({ color: 0x9d7344, roughness: 0.94 });
const BARK_DARK = new THREE.MeshStandardMaterial({ color: 0x69452a, roughness: 0.98 });
const FLOWER_IVORY = new THREE.MeshStandardMaterial({ color: 0xf7efd9, roughness: 0.58 });
const FLOWER_PEACH = new THREE.MeshStandardMaterial({ color: 0xf0bd99, roughness: 0.6 });
const FLOWER_GOLD = new THREE.MeshStandardMaterial({ color: 0xe5c35f, roughness: 0.6 });
const FLOWER_LILAC = new THREE.MeshStandardMaterial({ color: 0xb9afd2, roughness: 0.64 });
const VINE_MAT = new THREE.MeshStandardMaterial({ color: 0x3b713e, roughness: 0.97 });
const VINE_LIGHT = new THREE.MeshStandardMaterial({ color: 0x6f9852, roughness: 0.93 });
const STONE_MAT = new THREE.MeshStandardMaterial({ color: 0x938a72, roughness: 0.98 });
const STONE_LIGHT = new THREE.MeshStandardMaterial({ color: 0xc5b995, roughness: 0.9 });
const STONE_MOSS = new THREE.MeshStandardMaterial({ color: 0x687d51, roughness: 0.98 });
const WATER_EDGE = new THREE.MeshStandardMaterial({ color: 0x356d66, roughness: 0.38, metalness: 0.02 });
const WATER_SURFACE = new THREE.MeshStandardMaterial({
  color: 0x5a9991,
  roughness: 0.1,
  metalness: 0.06,
  transparent: true,
  opacity: 0.86,
});
const WATER_GLEAM = new THREE.MeshBasicMaterial({ color: 0xbadfd1, transparent: true, opacity: 0.16, depthWrite: false });
const MIST = new THREE.MeshBasicMaterial({ color: 0xc9e6d3, transparent: true, opacity: 0.055, depthWrite: false });
const GOLDEN = new THREE.MeshStandardMaterial({ color: 0xd9b34d, roughness: 0.7, metalness: 0.02 });

function Branch({
  from,
  to,
  radius,
  material = MAT.trunk,
  radialSegments = 8,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  material?: THREE.Material;
  radialSegments?: number;
}) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const length = direction.length();
  const midpoint = a.clone().add(b).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return (
    <mesh position={midpoint} quaternion={quaternion} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[radius * 0.68, radius, length, radialSegments]} />
    </mesh>
  );
}

function CanopyCluster({ position, scale = 1, material = LEAF_MID }: { position: [number, number, number]; scale?: number; material?: THREE.Material }) {
  return (
    <group position={position} scale={scale}>
      <mesh material={material} castShadow>
        <dodecahedronGeometry args={[4.9, 1]} />
      </mesh>
      <mesh position={[-3.6, -1.2, 1.5]} rotation={[0.12, 0.48, 0.04]} material={material} castShadow>
        <icosahedronGeometry args={[3.8, 1]} />
      </mesh>
      <mesh position={[3.2, -1.0, -1.7]} rotation={[-0.08, -0.35, 0.1]} material={material} castShadow>
        <icosahedronGeometry args={[4.0, 1]} />
      </mesh>
      <mesh position={[0.7, 3.4, 2.1]} scale={0.68} material={material} castShadow>
        <icosahedronGeometry args={[3.7, 1]} />
      </mesh>
    </group>
  );
}

function RootSystem({ scale = 1 }: { scale?: number }) {
  const roots: [[number, number, number], [number, number, number], number][] = [
    [[-1.4, 2.0, 0], [-8.0, 1.15, 0.5], 0.63],
    [[1.4, 2.0, 0], [8.0, 1.2, -0.8], 0.59],
    [[0, 2.0, 1.1], [-1.7, 1.15, 7.2], 0.5],
    [[0, 2.0, -1.1], [1.5, 1.15, -6.8], 0.46],
    [[-1.0, 2.0, 0.5], [-5.7, 1.2, 4.4], 0.42],
    [[1.1, 2.0, -0.5], [5.6, 1.2, -4.4], 0.43],
  ];
  return (
    <group scale={scale}>
      {roots.map(([from, to, radius], i) => (
        <Branch key={i} from={from} to={to} radius={radius} material={BARK_DARK} />
      ))}
    </group>
  );
}

function Fruit({ position, scale = 1, golden = false }: { position: [number, number, number]; scale?: number; golden?: boolean }) {
  return (
    <group position={position} scale={scale}>
      <mesh material={golden ? GOLDEN : MAT.fruit} castShadow>
        <sphereGeometry args={[0.82, 12, 10]} />
      </mesh>
      <mesh position={[0.05, 0.88, 0]} rotation={[0.2, 0, -0.15]} material={LEAF_DEEP}>
        <coneGeometry args={[0.22, 0.75, 5]} />
      </mesh>
    </group>
  );
}

function GardenTree({
  position,
  scale = 1,
  sacred = false,
  fruit = true,
}: {
  position: [number, number, number];
  scale?: number;
  sacred?: boolean;
  fruit?: boolean;
}) {
  const crown = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  const foliage = sacred ? LEAF_GOLD : LEAF_MID;
  const fruitPositions: [number, number, number][] = [
    [-4.8, 2.5, 2.6], [4.4, 2.6, -2.5], [0.8, 5.8, -3.5], [-2.1, 1.0, 4.5],
    [5.1, -0.1, 1.7], [-5.6, 0.2, -1.3], [2.4, 3.8, 4.1], [-3.4, 4.2, -2.3],
  ];

  useFrame(({ clock }) => {
    if (!crown.current) return;
    const t = clock.getElapsedTime();
    crown.current.rotation.z = Math.sin(t * 0.42 + phase.current) * 0.012;
    crown.current.rotation.x = Math.cos(t * 0.33 + phase.current) * 0.009;
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 6, 0]} material={BARK_LIGHT} castShadow receiveShadow>
        <cylinderGeometry args={[1.55, 2.8, 12, 12]} />
      </mesh>
      <RootSystem />
      <Branch from={[0, 6, 0]} to={[-5.7, 11.5, 1.0]} radius={0.94} material={BARK_LIGHT} />
      <Branch from={[0, 7, 0]} to={[6.0, 12.2, -1.0]} radius={0.97} material={MAT.trunk} />
      <Branch from={[-0.2, 8, 0]} to={[-2.6, 14.2, -4.6]} radius={0.69} material={MAT.trunk} />
      <Branch from={[0.8, 8, 0]} to={[3.7, 14.7, 4.1]} radius={0.65} material={BARK_LIGHT} />
      <Branch from={[-4.9, 11.1, 0.9]} to={[-8.4, 14.5, 2.7]} radius={0.43} material={MAT.trunk} />
      <Branch from={[5.0, 11.5, -0.7]} to={[8.6, 14.8, -2.5]} radius={0.42} material={MAT.trunk} />
      <group ref={crown} position={[0, 12, 0]}>
        <CanopyCluster position={[0, 2.0, 0]} scale={1.17} material={foliage} />
        <CanopyCluster position={[-5.2, 0.3, 1.7]} scale={0.83} material={LEAF_DEEP} />
        <CanopyCluster position={[5.0, 0.75, -1.7]} scale={0.85} material={LEAF_LIGHT} />
        <CanopyCluster position={[-2.0, 5.3, -3.0]} scale={0.77} material={LEAF_MID} />
        <CanopyCluster position={[2.5, 5.0, 3.0]} scale={0.75} material={LEAF_DEEP} />
        <CanopyCluster position={[0.0, -1.5, 3.6]} scale={0.59} material={LEAF_BLUEGREEN} />
        {fruit && fruitPositions.map((p, i) => <Fruit key={i} position={p} scale={0.82 + (i % 3) * 0.1} golden={sacred} />)}
      </group>
    </group>
  );
}

function Palm({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  const crown = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  useFrame(({ clock }) => {
    if (crown.current) {
      const t = clock.getElapsedTime();
      crown.current.rotation.z = Math.sin(t * 0.45 + phase.current) * 0.025;
      crown.current.rotation.x = Math.cos(t * 0.34 + phase.current) * 0.017;
    }
  });
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 6.6, 0]} material={BARK_LIGHT} castShadow>
        <cylinderGeometry args={[0.48, 1.04, 11.2, 10]} />
      </mesh>
      <group ref={crown} position={[0, 12.25, 0]}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <mesh position={[0, -0.1, 3.35]} rotation={[0.55, 0, 0.03]} material={i % 4 === 0 ? LEAF_LIGHT : LEAF_DEEP} castShadow>
                <coneGeometry args={[0.72, 8.1, 5]} />
              </mesh>
              <mesh position={[0, 0.18, 1.2]} rotation={[0.36, 0, 0]} material={LEAF_MID} castShadow>
                <coneGeometry args={[0.92, 3.4, 5]} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function Fern({ position, scale = 1, rotation = 0, material = LEAF_DEEP }: { position: [number, number, number]; scale?: number; rotation?: number; material?: THREE.Material }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {Array.from({ length: 11 }).map((_, i) => {
        const a = (i / 11) * Math.PI * 2;
        const length = 4.6 - Math.abs(i - 5) * 0.18;
        return (
          <mesh key={i} position={[Math.sin(a) * length * 0.44, length * 0.17, Math.cos(a) * length * 0.44]} rotation={[0.8, a, 0.08]} material={material} castShadow>
            <coneGeometry args={[0.45, length, 5]} />
          </mesh>
        );
      })}
    </group>
  );
}

function GrassTuft({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[Math.sin(i * 1.7) * 0.72, 1.0, Math.cos(i * 1.35) * 0.65]} rotation={[0.14 + (i % 3) * 0.06, i * 0.72, -0.14 + (i % 2) * 0.12]} material={i % 4 === 0 ? LEAF_LIGHT : i % 3 === 0 ? LEAF_MID : LEAF_DEEP} castShadow>
          <coneGeometry args={[0.14, 2.8 + (i % 4) * 0.52, 4]} />
        </mesh>
      ))}
    </group>
  );
}

function Flower({ position, scale = 1, rotation = 0, petal = FLOWER_IVORY }: { position: [number, number, number]; scale?: number; rotation?: number; petal?: THREE.Material }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.84, 0]} material={LEAF_MID}>
        <cylinderGeometry args={[0.065, 0.1, 1.7, 5]} />
      </mesh>
      <group position={[0, 1.7, 0]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <mesh key={i} position={[Math.cos(a) * 0.33, 0, Math.sin(a) * 0.33]} scale={[1, 0.6, 1]} material={petal}><sphereGeometry args={[0.3, 7, 6]} /></mesh>;
        })}
        <mesh material={GOLDEN}><sphereGeometry args={[0.17, 8, 6]} /></mesh>
      </group>
    </group>
  );
}

function Shrub({ position, scale = 1, variant = 0 }: { position: [number, number, number]; scale?: number; variant?: number }) {
  const palette = [LEAF_MID, LEAF_DEEP, LEAF_GOLD, LEAF_BLUEGREEN];
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.2, 0]} material={palette[variant % palette.length]} castShadow>
        <dodecahedronGeometry args={[3.5, 1]} />
      </mesh>
      <mesh position={[-2.1, 1.4, 1.35]} material={LEAF_LIGHT} castShadow><icosahedronGeometry args={[2.45, 1]} /></mesh>
      <mesh position={[2.2, 1.45, -1.05]} material={LEAF_DEEP} castShadow><icosahedronGeometry args={[2.35, 1]} /></mesh>
      <mesh position={[0.3, 3.35, 1.0]} scale={0.72} material={LEAF_GOLD} castShadow><icosahedronGeometry args={[2.15, 1]} /></mesh>
    </group>
  );
}

function Rock({ position, scale = 1, rotation = 0, material }: { position: [number, number, number]; scale?: number; rotation?: number; material?: THREE.Material }) {
  return (
    <mesh position={position} rotation={[rotation * 0.12, rotation, rotation * 0.08]} scale={[scale * 1.35, scale * 0.68, scale]} material={material ?? (Math.round(scale * 10) % 3 === 0 ? STONE_MOSS : Math.round(scale * 10) % 2 ? STONE_MAT : STONE_LIGHT)} castShadow receiveShadow>
      <icosahedronGeometry args={[2.2, 1]} />
    </mesh>
  );
}

function Vine({ start, end, sag = 2.2, material = VINE_MAT }: { start: [number, number, number]; end: [number, number, number]; sag?: number; material?: THREE.Material }) {
  const mid: [number, number, number] = [(start[0] + end[0]) * 0.5, Math.min(start[1], end[1]) - sag, (start[2] + end[2]) * 0.5];
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...start), new THREE.Vector3(...mid), new THREE.Vector3(...end)]);
  return <mesh material={material} castShadow><tubeGeometry args={[curve, 18, 0.13, 5, false]} /></mesh>;
}

function RibbonGeometry({ points, width, yOffset = 0 }: { points: [number, number, number][]; width: number; yOffset?: number }) {
  return useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const segments = 54;
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).setY(0).normalize();
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const w = width * (0.9 + Math.sin(t * Math.PI) * 0.1);
      vertices.push(point.x + side.x * w, point.y + yOffset, point.z + side.z * w);
      vertices.push(point.x - side.x * w, point.y + yOffset, point.z - side.z * w);
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, [points, width, yOffset]);
}

function River({ points, width }: { points: [number, number, number][]; width: number }) {
  const bank = RibbonGeometry({ points, width: width + 1.15, yOffset: -0.28 });
  const water = RibbonGeometry({ points, width, yOffset: 0.02 });
  return (
    <group>
      <mesh geometry={bank} material={WATER_EDGE} receiveShadow />
      <mesh geometry={water} material={WATER_SURFACE} receiveShadow />
      <mesh geometry={RibbonGeometry({ points, width: width * 0.42, yOffset: 0.16 })} material={WATER_GLEAM} />
    </group>
  );
}

function Pebbles({ count, seed = 0 }: { count: number; seed?: number }) {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const a = i * 2.399 + seed;
        const r = 13 + ((i * 17 + seed * 7) % 28);
        return <Rock key={i} position={[Math.cos(a) * r, 1.42 + (i % 4) * 0.07, Math.sin(a) * r * 0.7]} scale={0.22 + (i % 5) * 0.07} rotation={a} />;
      })}
    </group>
  );
}

function MeadowPatch({ position, scale = [1, 0.08, 1] as [number, number, number], material = LEAF_LIGHT }: { position: [number, number, number]; scale?: [number, number, number]; material?: THREE.Material }) {
  return <mesh position={position} scale={scale} material={material} receiveShadow><sphereGeometry args={[12.5, 20, 8]} /></mesh>;
}

function MistOrb({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <mesh position={position} scale={scale} material={MIST}><sphereGeometry args={[4.2, 14, 10]} /></mesh>;
}

function GardenAtmosphere() {
  const key = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (key.current) key.current.intensity = 1.28 + Math.sin(clock.getElapsedTime() * 0.25) * 0.06;
  });
  return (
    <>
      <pointLight ref={key} color={0xffe5b0} intensity={1.28} distance={125} decay={2} position={[6, 32, -3]} />
      <pointLight color={0x8fd1ad} intensity={0.72} distance={110} decay={2} position={[-34, 9, 9]} />
      <pointLight color={0xe2c97d} intensity={0.3} distance={88} decay={2} position={[36, 11, -30]} />
    </>
  );
}

function FlyingBird({ position, scale = 1, phase = 0 }: { position: [number, number, number]; scale?: number; phase?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.22 + phase;
    ref.current.position.set(position[0] + Math.cos(t) * 2.4, position[1] + Math.sin(t) * 0.9, position[2] + Math.sin(t * 0.7) * 1.5);
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[-0.78, 0, 0]} rotation={[0, 0, -0.33]} material={LEAF_DEEP}><coneGeometry args={[0.08, 1.45, 4]} /></mesh>
      <mesh position={[0.78, 0, 0]} rotation={[0, 0, 0.33]} material={LEAF_DEEP}><coneGeometry args={[0.08, 1.45, 4]} /></mesh>
    </group>
  );
}

export default function Eden() {
  const rivers: { points: [number, number, number][]; width: number }[] = [
    { width: 4.0, points: [[-25, 1.5, 0], [-36, 1.56, 5], [-49, 1.52, 11], [-65, 1.45, 14]] },
    { width: 3.75, points: [[-1, 1.52, 2], [6, 1.58, 15], [13, 1.53, 30], [21, 1.46, 49]] },
    { width: 4.0, points: [[-1, 1.53, -2], [13, 1.57, -8], [28, 1.53, -17], [47, 1.45, -28]] },
    { width: 3.72, points: [[1, 1.54, 0], [12, 1.56, 6], [28, 1.51, 5], [54, 1.44, 3]] },
  ];

  const palms: [number, number, number, number][] = [
    [-58, 40, 0.9, 0.2], [-56, -37, 0.84, -0.5], [42, 40, 0.96, 1.0], [55, -38, 0.94, 2.1],
    [-29, 47, 0.77, 0.6], [18, -47, 0.8, -0.5], [-64, 7, 0.83, 1.5], [62, 17, 0.78, -0.8],
  ];

  const perimeterTrees: [number, number, number, number][] = [
    [-44, 29, 0.68, 0], [-46, -28, 0.72, 1], [41, 29, 0.7, 2], [47, -25, 0.75, 0],
    [-18, 41, 0.66, 2], [29, -40, 0.67, 1], [-60, -8, 0.58, 0], [60, -8, 0.61, 2],
    [-33, 7, 0.56, 1], [39, 7, 0.54, 2],
  ];

  const shrubs: [number, number, number, number][] = [
    [-51, 13, 0.86, 0], [-46, -10, 0.78, 1], [-36, -30, 0.84, 2], [-31, 24, 0.72, 3],
    [34, 22, 0.8, 0], [44, -11, 0.74, 1], [51, -30, 0.88, 2], [57, 13, 0.7, 3],
    [-10, 30, 0.64, 1], [19, 32, 0.68, 2], [26, -28, 0.66, 0],
  ];

  const ferns: [number, number, number, number, number][] = [
    [-54, 24, 0.72, 0.4, 0], [-50, -20, 0.8, 1.1, 1], [-37, 34, 0.6, 2.4, 0], [-25, -36, 0.74, 0.2, 2],
    [-9, 40, 0.62, 1.7, 1], [5, -39, 0.68, 2.7, 0], [17, 40, 0.66, 0.9, 2], [34, -35, 0.72, 1.8, 1],
    [46, 25, 0.66, 2.3, 0], [55, -17, 0.74, 0.4, 1], [-59, 1, 0.58, 1.4, 0], [58, 5, 0.62, 2.1, 2],
  ];

  const flowers: [number, number, number, number, number][] = [
    [-43, 20, 0.68, 0.2, 0], [-40, -18, 0.72, 1.4, 1], [-30, 31, 0.6, 2.1, 2], [-23, -29, 0.74, 0.8, 3],
    [-8, 34, 0.68, 1.7, 0], [1, -31, 0.6, 0.4, 2], [13, 35, 0.72, 2.2, 1], [27, -34, 0.64, 1.1, 3],
    [39, 26, 0.6, 0.6, 0], [48, -20, 0.74, 2.4, 1], [54, 8, 0.62, 1.3, 2], [-54, -8, 0.62, 2.8, 3],
    [31, 16, 0.56, 0.1, 0], [-16, 16, 0.58, 1.3, 1],
  ];

  const grass: [number, number, number, number][] = [
    [-58, 29, 0.88, 0.2], [-50, -28, 1.02, 1.1], [-39, 38, 0.72, 2.2], [-28, -40, 0.94, 0.4],
    [-16, 45, 0.78, 1.7], [-7, -44, 0.92, 0.8], [4, 43, 0.8, 2.4], [15, -45, 0.98, 1.3],
    [33, 37, 0.82, 2.8], [48, -39, 0.92, 0.6], [59, 23, 0.72, 1.8], [59, -4, 0.9, 2.1],
    [-64, -2, 0.76, 0.5], [37, -3, 0.78, 1.4], [-25, 12, 0.64, 2.6], [30, 13, 0.67, 0.9],
  ];

  const rocks: [number, number, number, number][] = [
    [-39, 4, 1.2, 0.2], [-31, 8, 0.74, 1.2], [-23, 3, 0.98, 2.2], [27, 8, 1.16, 0.7],
    [36, 11, 0.8, 1.9], [45, 3, 1.02, 0.4], [18, 24, 0.7, 2.6], [-49, 15, 0.88, 1.6],
    [-18, -3, 0.56, 0.2], [8, 21, 0.64, 1.4], [41, -3, 0.6, 2.4], [-45, -4, 0.64, 0.8],
  ];

  const meadows: [number, number, number, number, number][] = [
    [-43, 20, 1.05, 0.85, 0], [-35, -17, 0.92, 1.2, 1], [-17, 30, 0.9, 0.5, 2], [-2, 27, 0.84, 1.1, 3],
    [12, -29, 0.92, 2.2, 0], [27, 25, 0.94, 0.8, 1], [44, -17, 0.9, 1.5, 2], [52, 9, 0.84, 2.4, 0],
    [-53, 2, 0.86, 0.6, 1], [0, -13, 0.75, 1.9, 2], [36, 6, 0.72, 1.0, 3], [-30, 8, 0.7, 2.5, 0],
  ];
  const flowerMats = [FLOWER_IVORY, FLOWER_PEACH, FLOWER_GOLD, FLOWER_LILAC];

  return (
    <group>
      <GardenAtmosphere />

      {/* Broad irregular meadow shelves. These keep the ground richly green without flattening it. */}
      <MeadowPatch position={[-22, 0.82, 22]} scale={[2.55, 0.08, 1.65]} material={LEAF_LIGHT} />
      <MeadowPatch position={[34, 0.76, 16]} scale={[2.2, 0.07, 1.4]} material={LEAF_MID} />
      <MeadowPatch position={[-38, 0.77, -19]} scale={[2.3, 0.08, 1.5]} material={LEAF_BLUEGREEN} />
      <MeadowPatch position={[21, 0.78, -27]} scale={[2.35, 0.07, 1.55]} material={LEAF_LIGHT} />

      {/* Source basin and the river described as four heads. */}
      <mesh position={[0, 1.0, 0]} material={WATER_EDGE} receiveShadow>
        <cylinderGeometry args={[12.8, 13.6, 0.9, 52]} />
      </mesh>
      <mesh position={[0, 1.62, 0]} material={WATER_SURFACE} receiveShadow>
        <circleGeometry args={[11.9, 72]} />
      </mesh>
      <mesh position={[0, 1.77, 0]} material={WATER_GLEAM}>
        <ringGeometry args={[7.0, 10.2, 64]} />
      </mesh>
      {rivers.map((river, i) => <River key={i} points={river.points} width={river.width} />)}
      <Pebbles count={34} seed={8} />
      <MistOrb position={[-1, 5.5, 0]} scale={1.75} />
      <MistOrb position={[-4.5, 4.25, 0.8]} scale={1.1} />
      <MistOrb position={[4.4, 4.25, -0.8]} scale={1.0} />

      {/* The garden's visual heart: a living mound rather than a flat pedestal. */}
      <mesh position={[14, 1.5, -6]} material={LEAF_DEEP} receiveShadow scale={[1.9, 0.15, 1.55]}>
        <sphereGeometry args={[12.8, 24, 10]} />
      </mesh>
      <mesh position={[14, 2.25, -6]} material={MAT.ground} receiveShadow scale={[1.6, 0.05, 1.25]}>
        <sphereGeometry args={[12.8, 22, 8]} />
      </mesh>
      <GardenTree position={[8, 2.2, -4]} scale={1.2} sacred />
      <GardenTree position={[22, 2.25, -12]} scale={1.0} sacred />

      {/* Layered canopy gives the perimeter the feeling of a genuine paradise, not a sparse game map. */}
      {perimeterTrees.map(([x, z, s, r], i) => <group key={`t-${i}`} rotation={[0, r, 0]}><GardenTree position={[x, 0, z]} scale={s} fruit={false} /></group>)}
      {palms.map(([x, z, s, r], i) => <Palm key={`p-${i}`} position={[x, 0, z]} scale={s} rotation={r} />)}
      {shrubs.map(([x, z, s, variant], i) => <Shrub key={`s-${i}`} position={[x, 0.16, z]} scale={s} variant={variant} />)}
      {meadows.map(([x, z, s, r, variant], i) => <MeadowPatch key={`m-${i}`} position={[x, 0.7, z]} scale={[s * 1.55, 0.07, s]} material={variant % 3 === 0 ? LEAF_LIGHT : variant % 3 === 1 ? LEAF_MID : LEAF_GOLD} />)}

      {ferns.map(([x, z, s, r, variant], i) => <Fern key={`f-${i}`} position={[x, 1.16, z]} scale={s} rotation={r} material={variant % 2 ? LEAF_DEEP : LEAF_MID} />)}
      {grass.map(([x, z, s, r], i) => <GrassTuft key={`g-${i}`} position={[x, 1.08, z]} scale={s} rotation={r} />)}
      {flowers.map(([x, z, s, r, p], i) => <Flower key={`fl-${i}`} position={[x, 1.16, z]} scale={s} rotation={r} petal={flowerMats[p]} />)}
      {rocks.map(([x, z, s, r], i) => <Rock key={`r-${i}`} position={[x, 1.55, z]} scale={s} rotation={r} />)}

      {/* Secondary ground cover makes the whole scene read as fertile and cared for by nature. */}
      {Array.from({ length: 62 }).map((_, i) => {
        const a = i * 2.19;
        const r = 19 + ((i * 19) % 35);
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r * 0.72;
        return (
          <group key={`u-${i}`}>
            <GrassTuft position={[x, 1.05, z]} scale={0.28 + (i % 5) * 0.06} rotation={a} />
            {i % 4 === 0 && <Flower position={[x + 1.0, 1.15, z - 0.9]} scale={0.35 + (i % 2) * 0.08} rotation={a * 0.7} petal={flowerMats[i % flowerMats.length]} />}
          </group>
        );
      })}

      {/* Vines and roots soften the transition between tree layers. */}
      <Vine start={[-57, 10, 40]} end={[-53, 2.8, 35]} sag={2.5} />
      <Vine start={[-44, 11, 29]} end={[-40, 2.8, 24]} sag={2.0} material={VINE_LIGHT} />
      <Vine start={[42, 11, 40]} end={[47, 2.8, 34]} sag={2.8} />
      <Vine start={[-18, 10, 41]} end={[-13, 2.8, 37]} sag={2.1} />
      <Vine start={[29, 11, -40]} end={[34, 2.8, -34]} sag={2.5} material={VINE_LIGHT} />
      <Vine start={[52, 10, -30]} end={[55, 2.6, -25]} sag={2.2} />

      <FlyingBird position={[-24, 34, -12]} scale={0.9} phase={0.3} />
      <FlyingBird position={[16, 39, 14]} scale={0.72} phase={1.8} />
      <FlyingBird position={[38, 32, -3]} scale={0.78} phase={3.2} />

      {/* Human scale remains secondary to the abundance of the garden. */}
      <Figure position={[-6, 1.28, 14]} scale={0.92} />
      <Figure position={[-12, 1.28, 9]} scale={0.86} />
    </group>
  );
}
