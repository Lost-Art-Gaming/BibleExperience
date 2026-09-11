import { Figure, Palm, Water } from '../Diorama';
import { MAT } from '../dioramaMaterials';

/** A garden tree — trunk, layered canopy, and fruit. */
function Tree({
  position,
  fruit,
  scale = 1,
}: {
  position: [number, number, number];
  fruit: 'gold' | 'red';
  scale?: number;
}) {
  const fruitMat = fruit === 'gold' ? MAT.gold : MAT.fruit;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 6, 0]} material={MAT.trunk} castShadow>
        <cylinderGeometry args={[1.1, 1.8, 12, 10]} />
      </mesh>
      <mesh position={[0, 13, 0]} material={MAT.leaf} castShadow>
        <sphereGeometry args={[7, 16, 12]} />
      </mesh>
      <mesh position={[-3.5, 10.5, 2.5]} material={MAT.leaf} castShadow>
        <sphereGeometry args={[4.4, 14, 10]} />
      </mesh>
      <mesh position={[4, 11, -2]} material={MAT.leaf} castShadow>
        <sphereGeometry args={[4, 14, 10]} />
      </mesh>
      {[
        [3.6, 13.5, 3.2],
        [-4.2, 14, -1.6],
        [1.2, 16.5, -3.4],
        [-2, 10.5, 5.2],
        [5.4, 9.8, 1.2],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} material={fruitMat} castShadow>
          <sphereGeometry args={[1.2, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

/** A channel of water cut into the ground. */
function Channel({
  length,
  rotation,
  position,
}: {
  length: number;
  rotation: number;
  position: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} material={MAT.water} receiveShadow>
      <boxGeometry args={[length, 0.5, 5.5]} />
    </mesh>
  );
}

/**
 * Eden — a garden planted eastward, the river parting into four heads, and
 * the two trees at its centre. Genesis 2:8-14.
 */
export default function Eden() {
  // four heads radiating from the source pool
  const heads: { rot: number; len: number }[] = [
    { rot: 0.35, len: 58 },
    { rot: 1.25, len: 50 },
    { rot: 2.35, len: 54 },
    { rot: -0.85, len: 46 },
  ];

  return (
    <group>
      {/* the source pool at the garden's heart */}
      <Water radius={11} y={1.52} />
      <mesh position={[0, 1.0, 0]} material={MAT.water} receiveShadow>
        <cylinderGeometry args={[11.6, 11.6, 0.6, 40]} />
      </mesh>

      {/* the river rising in Eden, and the four heads it parts into */}
      <Channel length={46} rotation={0} position={[-34, 1.0, 0]} />
      {heads.map((h, i) => (
        <Channel
          key={i}
          length={h.len}
          rotation={h.rot}
          position={[Math.cos(h.rot) * (h.len / 2 + 7), 1.0, -Math.sin(h.rot) * (h.len / 2 + 7)]}
        />
      ))}

      {/* a low rise at the centre, carrying the two trees */}
      <mesh position={[14, 1.4, -6]} material={MAT.grass} receiveShadow>
        <cylinderGeometry args={[19, 21, 1.6, 28]} />
      </mesh>
      <Tree position={[8, 2.2, -4]} fruit="gold" scale={1.15} />
      <Tree position={[22, 2.2, -12]} fruit="red" scale={0.95} />

      {/* the wider garden — every tree pleasing to the sight */}
      {[
        [-46, 34, 1.05],
        [-52, -30, 0.95],
        [40, 40, 1.0],
        [52, -34, 1.1],
        [-18, 44, 0.9],
        [30, -44, 0.95],
        [-60, 6, 1.0],
        [58, 12, 0.9],
      ].map(([x, z, s], i) => (
        <Palm key={i} position={[x, 0, z]} scale={s} />
      ))}

      {Array.from({ length: 30 }).map((_, i) => {
        const a = (i / 30) * Math.PI * 2;
        const r = 30 + ((i * 37) % 28);
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, 1.7, Math.sin(a) * r * 0.8]}
            scale={[1, 0.7, 1]}
            material={MAT.leaf}
            castShadow
          >
            <sphereGeometry args={[1.5 + ((i * 13) % 10) / 8, 8, 6]} />
          </mesh>
        );
      })}

      <Figure position={[-6, 1.2, 14]} />
      <Figure position={[-12, 1.2, 9]} />
    </group>
  );
}
