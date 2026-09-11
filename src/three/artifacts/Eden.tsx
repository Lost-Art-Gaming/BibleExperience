import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAT } from '../dioramaMaterials';

const LEAF_LIGHT = new THREE.MeshStandardMaterial({ color: 0x5c9a40, roughness: 0.92 });
const LEAF_MID = new THREE.MeshStandardMaterial({ color: 0x4d8a38, roughness: 0.94 });
const LEAF_DEEP = new THREE.MeshStandardMaterial({ color: 0x2f6320, roughness: 0.97 });
const LEAF_GOLD = new THREE.MeshStandardMaterial({ color: 0x7e9947, roughness: 0.92 });
const LEAF_BLUEGREEN = new THREE.MeshStandardMaterial({ color: 0x4f8570, roughness: 0.94 });
const BARK = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.94 });
const BARK_LIGHT = new THREE.MeshStandardMaterial({ color: 0x7d5a34, roughness: 0.92 });
const FLOWER_IVORY = new THREE.MeshStandardMaterial({ color: 0xf0f0e6, roughness: 0.55 });
const FLOWER_PEACH = new THREE.MeshStandardMaterial({ color: 0xffb58d, roughness: 0.56 });
const FLOWER_GOLD = new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.54 });
const FLOWER_LILAC = new THREE.MeshStandardMaterial({ color: 0xb46cff, roughness: 0.58 });
const VINE = new THREE.MeshStandardMaterial({ color: 0x3f7a2c, roughness: 0.94 });
const WATER_EDGE = new THREE.MeshStandardMaterial({ color: 0x34768b, roughness: 0.3, metalness: 0.03 });
const WATER = new THREE.MeshStandardMaterial({ color: 0x3f97c4, roughness: 0.13, metalness: 0.15, emissive: 0x0e3550, emissiveIntensity: 0.24, transparent: true, opacity: 0.94 });
const WATER_GLEAM = new THREE.MeshBasicMaterial({ color: 0xc6efff, transparent: true, opacity: 0.18, depthWrite: false });
const MIST = new THREE.MeshBasicMaterial({ color: 0xe0f5ee, transparent: true, opacity: 0.06, depthWrite: false });
const GOLD = new THREE.MeshStandardMaterial({ color: 0xffcf4d, roughness: 0.28, metalness: 0.32, emissive: 0x8d5c0b, emissiveIntensity: 0.28 });

function Branch({ from, to, radius, material = BARK }: { from: [number, number, number]; to: [number, number, number]; radius: number; material?: THREE.Material }) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const d = b.clone().sub(a);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return <mesh position={mid} quaternion={q} material={material} castShadow receiveShadow><cylinderGeometry args={[radius * 0.72, radius, a.distanceTo(b), 8]} /></mesh>;
}

function Canopy({ position, scale = 1, material = LEAF_MID }: { position: [number, number, number]; scale?: number; material?: THREE.Material }) {
  return <group position={position} scale={scale}>
    <mesh material={material} castShadow><dodecahedronGeometry args={[4.8, 1]} /></mesh>
    <mesh position={[-3.5, -1.1, 1.5]} material={material} castShadow><icosahedronGeometry args={[3.7, 1]} /></mesh>
    <mesh position={[3.2, -1, -1.7]} material={material} castShadow><icosahedronGeometry args={[3.9, 1]} /></mesh>
    <mesh position={[0.6, 3.25, 2]} scale={0.68} material={material} castShadow><icosahedronGeometry args={[3.5, 1]} /></mesh>
  </group>;
}

function Tree({ position, scale = 1, sacred = false, fruit = false }: { position: [number, number, number]; scale?: number; sacred?: boolean; fruit?: boolean }) {
  const crown = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  useFrame(({ clock }) => {
    if (!crown.current) return;
    const t = clock.getElapsedTime();
    crown.current.rotation.z = Math.sin(t * 0.42 + phase.current) * 0.014;
    crown.current.rotation.x = Math.cos(t * 0.33 + phase.current) * 0.01;
  });
  const foliage = sacred ? LEAF_GOLD : LEAF_MID;
  const fruitPositions: [number, number, number][] = [[-4.8, 2.5, 2.6], [4.4, 2.6, -2.5], [0.8, 5.8, -3.5], [-2.1, 1.0, 4.5], [5.1, -0.1, 1.7], [-5.6, 0.2, -1.3], [2.4, 3.8, 4.1], [-3.4, 4.2, -2.3]];
  return <group position={position} scale={scale}>
    <mesh position={[0, 6, 0]} material={BARK_LIGHT} castShadow receiveShadow><cylinderGeometry args={[1.55, 2.7, 12, 12]} /></mesh>
    <Branch from={[0, 6, 0]} to={[-5.7, 11.5, 1]} radius={0.9} material={BARK_LIGHT} />
    <Branch from={[0, 7, 0]} to={[6, 12.2, -1]} radius={0.95} />
    <Branch from={[-0.2, 8, 0]} to={[-2.6, 14.2, -4.6]} radius={0.66} />
    <Branch from={[0.8, 8, 0]} to={[3.7, 14.7, 4.1]} radius={0.64} material={BARK_LIGHT} />
    <group ref={crown} position={[0, 12, 0]}>
      <Canopy position={[0, 2, 0]} scale={1.17} material={foliage} />
      <Canopy position={[-5.2, 0.3, 1.7]} scale={0.83} material={LEAF_DEEP} />
      <Canopy position={[5, 0.75, -1.7]} scale={0.85} material={LEAF_LIGHT} />
      <Canopy position={[-2, 5.3, -3]} scale={0.77} material={LEAF_MID} />
      <Canopy position={[2.5, 5, 3]} scale={0.75} material={LEAF_DEEP} />
      <Canopy position={[0, -1.5, 3.6]} scale={0.59} material={LEAF_BLUEGREEN} />
      {fruit && fruitPositions.map((p, i) => <group key={i} position={p}><mesh material={sacred ? GOLD : MAT.fruit} castShadow><sphereGeometry args={[0.88, 10, 8]} /></mesh><mesh position={[0, 0.8, 0]} material={LEAF_DEEP}><coneGeometry args={[0.22, 0.7, 5]} /></mesh></group>)}
    </group>
  </group>;
}

function Palm({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  const crown = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  useFrame(({ clock }) => { if (crown.current) { const t = clock.getElapsedTime(); crown.current.rotation.z = Math.sin(t * 0.45 + phase.current) * 0.028; crown.current.rotation.x = Math.cos(t * 0.34 + phase.current) * 0.018; } });
  return <group position={position} rotation={[0, rotation, 0]} scale={scale}>
    <mesh position={[0, 6.6, 0]} material={BARK_LIGHT} castShadow><cylinderGeometry args={[0.48, 1.04, 11.2, 10]} /></mesh>
    <group ref={crown} position={[0, 12.25, 0]}>{Array.from({ length: 12 }).map((_, i) => { const a = (i / 12) * Math.PI * 2; return <mesh key={i} position={[Math.sin(a) * 3.3, -0.1, Math.cos(a) * 3.3]} rotation={[0.5, a, 0.03]} material={i % 4 === 0 ? LEAF_LIGHT : LEAF_DEEP} castShadow><coneGeometry args={[0.72, 8.2, 5]} /></mesh>; })}</group>
  </group>;
}

function Fern({ position, scale = 1, rotation = 0, material = LEAF_DEEP }: { position: [number, number, number]; scale?: number; rotation?: number; material?: THREE.Material }) {
  return <group position={position} scale={scale} rotation={[0, rotation, 0]}>{Array.from({ length: 11 }).map((_, i) => { const a = (i / 11) * Math.PI * 2; const len = 4.5 - Math.abs(i - 5) * 0.18; return <mesh key={i} position={[Math.sin(a) * len * 0.44, len * 0.17, Math.cos(a) * len * 0.44]} rotation={[0.8, a, 0.08]} material={material} castShadow><coneGeometry args={[0.44, len, 5]} /></mesh>; })}</group>;
}

function Grass({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return <group position={position} scale={scale} rotation={[0, rotation, 0]}>{Array.from({ length: 10 }).map((_, i) => <mesh key={i} position={[Math.sin(i * 1.7) * 0.72, 1, Math.cos(i * 1.35) * 0.65]} rotation={[0.14 + (i % 3) * 0.06, i * 0.72, -0.14 + (i % 2) * 0.12]} material={i % 4 === 0 ? LEAF_LIGHT : i % 3 === 0 ? LEAF_MID : LEAF_DEEP} castShadow><coneGeometry args={[0.14, 2.8 + (i % 4) * 0.52, 4]} /></mesh>)}</group>;
}

function Flower({ position, scale = 1, rotation = 0, petal = FLOWER_IVORY }: { position: [number, number, number]; scale?: number; rotation?: number; petal?: THREE.Material }) {
  return <group position={position} scale={scale} rotation={[0, rotation, 0]}><mesh position={[0, 0.84, 0]} material={LEAF_MID}><cylinderGeometry args={[0.06, 0.1, 1.7, 5]} /></mesh><group position={[0, 1.7, 0]}>{Array.from({ length: 6 }).map((_, i) => { const a = (i / 6) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.33, 0, Math.sin(a) * 0.33]} scale={[1, 0.6, 1]} material={petal}><sphereGeometry args={[0.3, 7, 6]} /></mesh>; })}<mesh material={GOLD}><sphereGeometry args={[0.17, 8, 6]} /></mesh></group></group>;
}

function Shrub({ position, scale = 1, variant = 0 }: { position: [number, number, number]; scale?: number; variant?: number }) {
  const p = [LEAF_MID, LEAF_DEEP, LEAF_GOLD, LEAF_BLUEGREEN];
  return <group position={position} scale={scale}><mesh position={[0, 2.2, 0]} material={p[variant % p.length]} castShadow><dodecahedronGeometry args={[3.4, 1]} /></mesh><mesh position={[-2.1, 1.4, 1.35]} material={LEAF_LIGHT} castShadow><icosahedronGeometry args={[2.4, 1]} /></mesh><mesh position={[2.2, 1.45, -1.05]} material={LEAF_DEEP} castShadow><icosahedronGeometry args={[2.3, 1]} /></mesh><mesh position={[0.3, 3.35, 1]} scale={0.72} material={LEAF_GOLD} castShadow><icosahedronGeometry args={[2.1, 1]} /></mesh></group>;
}

function Rock({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return <mesh position={position} scale={[scale * 1.35, scale * 0.68, scale]} rotation={[rotation * 0.12, rotation, rotation * 0.08]} material={LEAF_GOLD} castShadow receiveShadow><icosahedronGeometry args={[2.2, 1]} /></mesh>;
}

function useRibbonGeometry(points: [number, number, number][], width: number, yOffset = 0) {
  return useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const segments = 56;
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const p = curve.getPoint(t);
      const tangent = curve.getTangent(t).setY(0).normalize();
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const w = width * (0.94 + Math.sin(t * Math.PI) * 0.08);
      vertices.push(p.x + side.x * w, p.y + yOffset, p.z + side.z * w, p.x - side.x * w, p.y + yOffset, p.z - side.z * w);
      if (i < segments) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [points, width, yOffset]);
}

function River({ points, width }: { points: [number, number, number][]; width: number }) {
  const bank = useRibbonGeometry(points, width + 1.1, -0.25);
  const water = useRibbonGeometry(points, width, 0.03);
  const gleam = useRibbonGeometry(points, width * 0.36, 0.14);
  return <group><mesh geometry={bank} material={WATER_EDGE} receiveShadow /><mesh geometry={water} material={WATER} receiveShadow /><mesh geometry={gleam} material={WATER_GLEAM} /></group>;
}

function Vine({ start, end, sag = 2.2 }: { start: [number, number, number]; end: [number, number, number]; sag?: number }) {
  const mid: [number, number, number] = [(start[0] + end[0]) * 0.5, Math.min(start[1], end[1]) - sag, (start[2] + end[2]) * 0.5];
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(...start), new THREE.Vector3(...mid), new THREE.Vector3(...end)]);
  return <mesh material={VINE} castShadow><tubeGeometry args={[curve, 18, 0.13, 5, false]} /></mesh>;
}

function MistOrb({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return <mesh position={position} scale={scale} material={MIST}><sphereGeometry args={[4.2, 14, 10]} /></mesh>;
}

function Animal({ position, color, scale = 1, long = 4 }: { position: [number, number, number]; color: number; scale?: number; long?: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.9 }), [color]);
  return <group position={position} scale={scale}>
    <mesh position={[0, 3.1, 0]} rotation={[0, 0, Math.PI / 2]} material={mat} castShadow><cylinderGeometry args={[1.15, 1.15, long, 10]} /></mesh>
    <mesh position={[long / 2 + 0.6, 3.8, 0]} material={mat} castShadow><sphereGeometry args={[1.05, 10, 8]} /></mesh>
    {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}-${sz}`} position={[sx * long / 3, 1.55, sz * 0.82]} material={mat} castShadow><cylinderGeometry args={[0.3, 0.28, 2.7, 7]} /></mesh>))}
  </group>;
}

function People() {
  const skin = [0xd0a074, 0xe0b58a];
  return <group>{[[-5, 1.28, 13.5, 0.92], [-11, 1.28, 9.2, 0.86]].map(([x, y, z, s], i) => <group key={i} position={[x, y, z]} scale={s}>
    <mesh position={[0, 1.55, 0]} material={new THREE.MeshStandardMaterial({ color: skin[i], roughness: 0.86 })} castShadow><cylinderGeometry args={[0.62, 0.78, 3, 8]} /></mesh>
    <mesh position={[0, 3.65, 0]} material={new THREE.MeshStandardMaterial({ color: skin[i], roughness: 0.86 })} castShadow><sphereGeometry args={[0.86, 12, 10]} /></mesh>
    <mesh position={[0, 2.2, 0]} material={LEAF_MID} castShadow><sphereGeometry args={[0.8, 8, 6]} /></mesh>
  </group>)}</group>;
}

export default function Eden() {
  const rivers: { points: [number, number, number][]; width: number }[] = [
    { width: 4.0, points: [[-25, 1.5, 0], [-36, 1.56, 5], [-49, 1.52, 11], [-65, 1.45, 14]] },
    { width: 3.75, points: [[-1, 1.52, 2], [6, 1.58, 15], [13, 1.53, 30], [21, 1.46, 49]] },
    { width: 4.0, points: [[-1, 1.53, -2], [13, 1.57, -8], [28, 1.53, -17], [47, 1.45, -28]] },
    { width: 3.72, points: [[1, 1.54, 0], [12, 1.56, 6], [28, 1.51, 5], [54, 1.44, 3]] },
  ];
  const palms: [number, number, number, number][] = [[-58, 40, 0.9, 0.2], [-56, -37, 0.84, -0.5], [42, 40, 0.96, 1], [55, -38, 0.94, 2.1], [-29, 47, 0.77, 0.6], [18, -47, 0.8, -0.5], [-64, 7, 0.83, 1.5], [62, 17, 0.78, -0.8]];
  const trees: [number, number, number, number][] = [[-44, 29, 0.68, 0], [-46, -28, 0.72, 1], [41, 29, 0.7, 2], [47, -25, 0.75, 0], [-18, 41, 0.66, 2], [29, -40, 0.67, 1], [-60, -8, 0.58, 0], [60, -8, 0.61, 2], [-33, 7, 0.56, 1], [39, 7, 0.54, 2]];
  const shrubs: [number, number, number, number][] = [[-51, 13, 0.86, 0], [-46, -10, 0.78, 1], [-36, -30, 0.84, 2], [-31, 24, 0.72, 3], [34, 22, 0.8, 0], [44, -11, 0.74, 1], [51, -30, 0.88, 2], [57, 13, 0.7, 3], [-10, 30, 0.64, 1], [19, 32, 0.68, 2], [26, -28, 0.66, 0]];
  const ferns: [number, number, number, number, number][] = [[-54, 24, 0.72, 0.4, 0], [-50, -20, 0.8, 1.1, 1], [-37, 34, 0.6, 2.4, 0], [-25, -36, 0.74, 0.2, 2], [-9, 40, 0.62, 1.7, 1], [5, -39, 0.68, 2.7, 0], [17, 40, 0.66, 0.9, 2], [34, -35, 0.72, 1.8, 1], [46, 25, 0.66, 2.3, 0], [55, -17, 0.74, 0.4, 1], [-59, 1, 0.58, 1.4, 0], [58, 5, 0.62, 2.1, 2]];
  const flowers: [number, number, number, number, number][] = [[-43, 20, 0.68, 0.2, 0], [-40, -18, 0.72, 1.4, 1], [-30, 31, 0.6, 2.1, 2], [-23, -29, 0.74, 0.8, 3], [-8, 34, 0.68, 1.7, 0], [1, -31, 0.6, 0.4, 2], [13, 35, 0.72, 2.2, 1], [27, -34, 0.64, 1.1, 3], [39, 26, 0.6, 0.6, 0], [48, -20, 0.74, 2.4, 1], [54, 8, 0.62, 1.3, 2], [-54, -8, 0.62, 2.8, 3], [31, 16, 0.56, 0.1, 0], [-16, 16, 0.58, 1.3, 1]];
  const grass: [number, number, number, number][] = [[-58, 29, 0.88, 0.2], [-50, -28, 1.02, 1.1], [-39, 38, 0.72, 2.2], [-28, -40, 0.94, 0.4], [-16, 45, 0.78, 1.7], [-7, -44, 0.92, 0.8], [4, 43, 0.8, 2.4], [15, -45, 0.98, 1.3], [33, 37, 0.82, 2.8], [48, -39, 0.92, 0.6], [59, 23, 0.72, 1.8], [59, -4, 0.9, 2.1], [-64, -2, 0.76, 0.5], [37, -3, 0.78, 1.4], [-25, 12, 0.64, 2.6], [30, 13, 0.67, 0.9]];
  const rocks: [number, number, number, number][] = [[-39, 4, 1.2, 0.2], [-31, 8, 0.74, 1.2], [-23, 3, 0.98, 2.2], [27, 8, 1.16, 0.7], [36, 11, 0.8, 1.9], [45, 3, 1.02, 0.4], [18, 24, 0.7, 2.6], [-49, 15, 0.88, 1.6], [-18, -3, 0.56, 0.2], [8, 21, 0.64, 1.4], [41, -3, 0.6, 2.4], [-45, -4, 0.64, 0.8]];
  const flowerMats = [FLOWER_IVORY, FLOWER_PEACH, FLOWER_GOLD, FLOWER_LILAC];

  return <group>
    <pointLight color={0xffd38b} intensity={1.15} distance={150} position={[0, 35, 0]} />
    <pointLight color={0x8fd1ad} intensity={0.42} distance={120} position={[-40, 12, 8]} />

    <mesh position={[0, 1.0, 0]} material={WATER_EDGE} receiveShadow><cylinderGeometry args={[12.8, 13.6, 0.9, 52]} /></mesh>
    <mesh position={[0, 1.62, 0]} material={WATER} receiveShadow><circleGeometry args={[11.9, 72]} /></mesh>
    <mesh position={[0, 1.77, 0]} material={WATER_GLEAM}><ringGeometry args={[7, 10.2, 64]} /></mesh>
    {rivers.map((river, i) => <River key={i} points={river.points} width={river.width} />)}
    <MistOrb position={[-1, 5.5, 0]} scale={1.75} />
    <MistOrb position={[-4.5, 4.25, 0.8]} scale={1.1} />
    <MistOrb position={[4.4, 4.25, -0.8]} scale={1.0} />

    <mesh position={[14, 1.5, -6]} material={LEAF_DEEP} receiveShadow scale={[1.9, 0.15, 1.55]}><sphereGeometry args={[12.8, 24, 10]} /></mesh>
    <mesh position={[14, 2.25, -6]} material={MAT.ground} receiveShadow scale={[1.6, 0.05, 1.25]}><sphereGeometry args={[12.8, 22, 8]} /></mesh>
    <Tree position={[8, 2.2, -4]} scale={1.2} sacred fruit />
    <Tree position={[22, 2.25, -12]} scale={1.0} sacred fruit />

    {trees.map(([x, z, s, r], i) => <group key={`t-${i}`} rotation={[0, r, 0]}><Tree position={[x, 0, z]} scale={s} /></group>)}
    {palms.map(([x, z, s, r], i) => <Palm key={`p-${i}`} position={[x, 0, z]} scale={s} rotation={r} />)}
    {shrubs.map(([x, z, s, variant], i) => <Shrub key={`s-${i}`} position={[x, 0.15, z]} scale={s} variant={variant} />)}
    {ferns.map(([x, z, s, r, variant], i) => <Fern key={`f-${i}`} position={[x, 1.12, z]} scale={s} rotation={r} material={variant % 2 ? LEAF_DEEP : LEAF_MID} />)}
    {grass.map(([x, z, s, r], i) => <Grass key={`g-${i}`} position={[x, 1.05, z]} scale={s} rotation={r} />)}
    {flowers.map(([x, z, s, r, p], i) => <Flower key={`fl-${i}`} position={[x, 1.13, z]} scale={s} rotation={r} petal={flowerMats[p]} />)}
    {rocks.map(([x, z, s, r], i) => <Rock key={`r-${i}`} position={[x, 1.52, z]} scale={s} rotation={r} />)}
    {Array.from({ length: 62 }).map((_, i) => { const a = i * 2.19; const r = 19 + ((i * 19) % 35); const x = Math.cos(a) * r; const z = Math.sin(a) * r * 0.72; return <group key={`u-${i}`}><Grass position={[x, 1.03, z]} scale={0.28 + (i % 5) * 0.06} rotation={a} />{i % 4 === 0 && <Flower position={[x + 1, 1.12, z - 0.9]} scale={0.35 + (i % 2) * 0.08} petal={flowerMats[i % flowerMats.length]} />}</group>; })}

    <Vine start={[-57, 10, 40]} end={[-53, 2.8, 35]} sag={2.5} />
    <Vine start={[-44, 11, 29]} end={[-40, 2.8, 24]} sag={2} />
    <Vine start={[42, 11, 40]} end={[47, 2.8, 34]} sag={2.8} />
    <Vine start={[-18, 10, 41]} end={[-13, 2.8, 37]} sag={2.1} />
    <Vine start={[29, 11, -40]} end={[34, 2.8, -34]} sag={2.5} />
    <Vine start={[52, 10, -30]} end={[55, 2.6, -25]} sag={2.2} />

    <People />
    <Animal position={[-30, 0, 26]} color={0xc79a52} scale={1.12} long={4.4} />
    <Animal position={[-36, 0, -26]} color={0xb07a46} scale={0.9} long={3.6} />
    <Animal position={[34, 0, -30]} color={0x9a9a9a} scale={1.35} long={5.1} />
    <Animal position={[12, 0, 34]} color={0xd8cabc} scale={0.5} long={1.6} />
    <Animal position={[-14, 0, -34]} color={0xf0ece2} scale={0.58} long={2.2} />
  </group>;
}
