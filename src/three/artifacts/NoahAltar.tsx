import * as THREE from 'three';
import { Figure, Flame, Water } from '../Diorama';
import { MAT } from '../dioramaMaterials';

const BASE = 1.2;

// The bow — seven bands, outermost red, as light rather than lit matter.
const BOW = ['#c8503a', '#d08a3c', '#d8c04a', '#5f9552', '#3f7fa8', '#4a5fa0', '#7a4f96'];

/**
 * The bow in the cloud. It is light, not matter, so it is drawn additively
 * and kept faint — a sign standing behind the altar rather than an arch
 * framing it, with its feet resting in cloud above the block's edge.
 */
function Bow() {
  return (
    <group position={[0, BASE + 5, -46]} rotation={[0, 0.18, 0]}>
      {BOW.map((c, i) => {
        const r = 33 - i * 1.1;
        return (
          <mesh key={c}>
            <torusGeometry args={[r, 0.55, 8, 80, Math.PI]} />
            <meshBasicMaterial
              color={new THREE.Color(c)}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Soft cloud forms the bow is set in. */
function Cloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[
        [0, 0, 0, 7],
        [6, -1.2, 1, 5],
        [-6.5, -1, -1, 5.4],
        [2.5, 2.2, -1.5, 4.4],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 14, 10]} />
          <meshStandardMaterial color={0xd9e2ea} roughness={1} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The altar Noah built on washed ground, and the bow set in the cloud —
 * the sign of the covenant. Genesis 8:20; 9:12-16.
 */
export default function NoahAltar() {
  // an altar of uncut stones, stacked rather than dressed
  const stones: [number, number, number, number, number, number][] = [
    [-4.5, 1.6, -3.5, 6.5, 3.2, 6.0],
    [2.6, 1.7, -3.8, 6.8, 3.4, 6.2],
    [-4.0, 1.6, 3.4, 6.2, 3.2, 6.4],
    [3.0, 1.5, 3.2, 6.6, 3.0, 6.0],
    [-2.4, 4.7, -1.6, 6.0, 3.0, 5.6],
    [3.2, 4.8, 1.8, 5.8, 3.2, 5.8],
    [-2.8, 4.6, 2.6, 5.4, 2.8, 5.2],
    [0.4, 7.4, 0.2, 9.5, 2.6, 9.0],
  ];

  return (
    <group>
      {/* the altar */}
      <group position={[0, BASE, 0]} scale={1.35}>
        {stones.map(([x, y, z, w, h, d], i) => (
          <mesh
            key={i}
            position={[x, y, z]}
            rotation={[0, (i * 0.37) % 0.6, 0]}
            material={i % 3 === 0 ? MAT.stone : MAT.stoneDk}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[w, h, d]} />
          </mesh>
        ))}
      </group>
      <Flame position={[0, BASE + 11.9, 0]} scale={1.15} />

      {/* the bow, set in the cloud */}
      <Bow />
      <Cloud position={[-33, BASE + 5, -46]} scale={0.8} />
      <Cloud position={[33, BASE + 5, -46]} scale={0.74} />
      <Cloud position={[2, BASE + 40, -50]} scale={0.58} />

      {/* water still standing on the drying ground */}
      <group position={[-44, 0, 30]}>
        <Water radius={14} y={1.55} />
      </group>
      <group position={[48, 0, -22]}>
        <Water radius={11} y={1.55} />
      </group>
      <group position={[18, 0, 46]}>
        <Water radius={9} y={1.55} />
      </group>

      {/* silt and wrack left by the waters — drifts, not a ring of stones */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.4;
        const r = 34 + ((i * 23) % 26);
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, 1.32, Math.sin(a) * r * 0.82]}
            rotation={[0, (i * 0.7) % 3, 0]}
            scale={[1.25 + ((i * 7) % 5) / 8, 0.12, 0.8]}
            material={MAT.soil}
            receiveShadow
          >
            <sphereGeometry args={[2.2 + ((i * 11) % 7) / 5, 10, 6]} />
          </mesh>
        );
      })}

      {/* Noah and his household, before the altar */}
      {[
        [-15, 18],
        [-8, 22],
        [9, 21],
        [16, 16],
        [1, 25],
      ].map(([x, z], i) => (
        <Figure key={i} position={[x, BASE, z]} scale={1.2} />
      ))}
    </group>
  );
}
