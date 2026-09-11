import { Figure } from '../Diorama';
import { MAT } from '../dioramaMaterials';

const BASE = 1.2;
const TIERS = 6;
const TIER_H = 7;

/**
 * The Tower of Babel — brick baked with fire, tar for mortar, rising in
 * receding stages on the plain of Shinar, its summit unfinished.
 * Genesis 11:3-4.
 */
export default function Babel() {
  const tiers = Array.from({ length: TIERS }).map((_, i) => {
    const size = 78 - i * 10;
    const y = BASE + i * TIER_H + TIER_H / 2;
    return { size, y, i };
  });

  // the ramp climbs the south face to the fifth stage
  const rampTop = BASE + 4 * TIER_H;
  const z0 = 52;
  const z1 = 18;
  const dz = z0 - z1;
  const angle = Math.atan2(rampTop - BASE, dz);
  const rampLen = Math.hypot(dz, rampTop - BASE);

  return (
    <group>
      {tiers.map(({ size, y, i }) => (
        <group key={i}>
          <mesh position={[0, y, 0]} material={i % 2 ? MAT.brickDk : MAT.brick} castShadow receiveShadow>
            <boxGeometry args={[size, TIER_H, size]} />
          </mesh>
          {/* tar for mortar — a dark course capping each stage */}
          <mesh position={[0, y + TIER_H / 2 + 0.3, 0]} material={MAT.bitumen} castShadow>
            <boxGeometry args={[size + 1.2, 0.7, size + 1.2]} />
          </mesh>
        </group>
      ))}

      {/* the ramp */}
      <mesh
        position={[0, (BASE + rampTop) / 2, (z0 + z1) / 2]}
        rotation={[-angle, 0, 0]}
        material={MAT.brickDk}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[13, 2, rampLen]} />
      </mesh>

      {/* unfinished summit — scaffolding where the work stopped */}
      <group position={[0, BASE + TIERS * TIER_H, 0]}>
        <mesh position={[0, 2, 0]} material={MAT.brick} castShadow>
          <boxGeometry args={[20, 4, 20]} />
        </mesh>
        {[
          [-8, -8],
          [8, -8],
          [-8, 8],
          [8, 8],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 7, z]} material={MAT.cedar} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 12, 6]} />
          </mesh>
        ))}
        {[4, 9, 12.5].map((y, i) => (
          <mesh key={i} position={[0, y + 4, 0]} material={MAT.cedar} castShadow>
            <boxGeometry args={[19, 0.6, 1.1]} />
          </mesh>
        ))}
      </group>

      {/* the builders — on the ramp and at the foot of the work */}
      {[
        [0, 44],
        [-5, 36],
        [4, 28],
      ].map(([x, z], i) => {
        const t = (z0 - z) / dz;
        return <Figure key={`r${i}`} position={[x, BASE + (rampTop - BASE) * t + 1.4, z]} />;
      })}
      {[
        [-46, 40],
        [44, 38],
        [-52, -30],
        [50, -36],
        [-30, 52],
        [26, -50],
      ].map(([x, z], i) => (
        <Figure key={`g${i}`} position={[x, BASE, z]} />
      ))}

      {/* stacks of brick, drying on the plain */}
      {[
        [-58, 22],
        [56, 18],
        [-42, -48],
        [40, 50],
      ].map(([x, z], i) => (
        <group key={i} position={[x, BASE, z]}>
          {[0, 1.3, 2.6].map((y, j) => (
            <mesh key={j} position={[0, y + 0.65, 0]} material={MAT.brick} castShadow>
              <boxGeometry args={[7, 1.1, 5]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
