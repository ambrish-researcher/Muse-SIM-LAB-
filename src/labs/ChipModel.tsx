import { useMemo } from "react";
import { ConstructionTree } from "../construction/ConstructionTree";
import { Part, Surface, COLORS, Trace, BoxBatch } from "../engine/materials";
import { GridChips, Ring, Cable, Panel } from "../engine/hardware";
import { useData } from "../experience/data";
import { useExperience } from "../experience/store";
import { tiledMultiply } from "../simulation/advanced";
import type { Vector } from "../construction/blueprints";
const grid = (n: number, step: number, y: number): Vector[] =>
  Array.from({ length: n * n }, (_, i) => [
    ((i % n) - (n - 1) / 2) * step,
    y,
    (Math.floor(i / n) - (n - 1) / 2) * step,
  ]);
export default function ChipModel() {
  const rackView = useExperience((s) => s.rackView);
  const a = useData((s) => s.matrixA),
    b = useData((s) => s.matrixB),
    tile = useData((s) => s.tile),
    op = useData((s) => s.op),
    workload = useData((s) => s.workload);
  const result = useMemo(() => tiledMultiply(a, b, tile), [a, b, tile]),
    active = result.operations[op];
  const heat = useExperience((s) => s.heat),
    flow = useExperience((s) => s.flow),
    attached = useExperience((s) => s.buildAttached);
  return (
    <group rotation={[0.16, 0, 0]}>
      <ConstructionTree
        lab="chip"
        explode={(p) =>
          p.id === "thermal"
            ? 1.25
            : p.id === "protective"
              ? 1.7
              : p.id.includes("regions")
                ? 0.5
                : p.id === "memory"
                  ? 0.35
                  : p.id === "rack"
                    ? -0.8
                    : 0
        }
        render={(p) => {
          if (p.id === "foundation")
            return (
              <>
                <Part size={[3.8, 0.17, 3.5]} color="#29353d" />
                {[-1, 1].flatMap((x) =>
                  [-1, 1].map((z) => (
                    <group
                      key={`${x}${z}`}
                      position={[x * 1.72, 0.14, z * 1.57]}
                    >
                      <Ring
                        radius={0.09}
                        thickness={0.025}
                        rotation={[-Math.PI / 2, 0, 0]}
                      />
                      <Part size={[0.025, 0.18, 0.025]} color={COLORS.gold} />
                    </group>
                  )),
                )}
              </>
            );
          if (p.id === "substrate")
            return (
              <>
                <Part size={[3.3, 0.22, 2.95]} color="#174746" />
                {Array.from({ length: 5 }, (_, i) => (
                  <Part
                    key={i}
                    at={[0, -0.08 + i * 0.035, 0]}
                    size={[3.32, 0.01, 2.97]}
                    color={i % 2 ? "#294e50" : COLORS.gold}
                  />
                ))}
              </>
            );
          if (p.id === "routes")
            return (
              <>
                {Array.from({ length: 20 }, (_, i) => (
                  <Cable
                    key={i}
                    points={[
                      [-1.55, 0.01, (i - 10) * 0.13],
                      [-0.9, 0.01, (i - 10) * 0.13],
                      [-0.5, 0.01, (i - 10) * 0.08],
                      [1.55, 0.01, (i - 10) * 0.08],
                    ]}
                    color={i % 4 === 0 ? COLORS.gold : "#408d83"}
                    width={i % 4 === 0 ? 2 : 1}
                  />
                ))}
              </>
            );
          if (p.id === "die1" || p.id === "die2")
            return (
              <>
                <Part size={[1.27, 0.16, 1.7]} color="#282334" />
                <Part
                  at={[0, 0.09, 0]}
                  size={[1.19, 0.015, 1.63]}
                  color="#43536a"
                />
                <GridChips
                  rows={12}
                  cols={8}
                  spacing={0.12}
                  at={[0, 0.11, 0]}
                  color="#34405b"
                />
              </>
            );
          if (p.id === "regions1" || p.id === "regions2")
            return (
              <>
                <GridChips
                  rows={8}
                  cols={6}
                  spacing={0.17}
                  color={heat ? "#c4854d" : "#6d7a8d"}
                />
                {[-1, 1].map((s) => (
                  <Part
                    key={s}
                    at={[s * 0.52, 0.03, 0]}
                    size={[0.035, 0.045, 1.38]}
                    color={COLORS.gold}
                  />
                ))}
              </>
            );
          if (p.id === "interconnect")
            return (
              <>
                {Array.from({ length: 16 }, (_, i) => (
                  <Part
                    key={i}
                    at={[0, i * 0.002, (i - 7.5) * 0.09]}
                    size={[0.37, 0.025, 0.03]}
                    color={COLORS.gold}
                  />
                ))}
              </>
            );
          if (p.id === "pes")
            return (
              <>
                {[-1, 1].map((s, n) => (
                  <group key={s} position={[s * 0.78, 0, 0]}>
                    <GridChips
                      rows={8}
                      cols={6}
                      spacing={0.17}
                      color={
                        heat && workload === "compute"
                          ? COLORS.amber
                          : COLORS.titanium
                      }
                    />
                    {active && (
                      <Part
                        at={[
                          ((active.col % 6) - 2.5) * 0.17,
                          0.035,
                          ((active.row % 8) - 3.5) * 0.17,
                        ]}
                        size={[0.13, 0.035, 0.13]}
                        color={n === active.k % 2 ? COLORS.gold : COLORS.cyan}
                        active
                      />
                    )}
                  </group>
                ))}
              </>
            );
          if (p.id === "arithmetic")
            return (
              <>
                {[-1, 1].map((s) => (
                  <group key={s} position={[s * 0.78, 0, 0]}>
                    {Array.from({ length: 4 }, (_, i) => (
                      <Part
                        key={i}
                        at={[(i - 1.5) * 0.23, 0.01, 0.68]}
                        size={[0.16, 0.06, 0.12]}
                        color={active?.k === i ? COLORS.gold : COLORS.violet}
                        active={active?.k === i}
                      />
                    ))}
                  </group>
                ))}
              </>
            );
          if (p.id === "memory")
            return (
              <>
                {[-1, 1].flatMap((x) =>
                  [-1, 0, 1].map((z) => (
                    <group
                      key={`${x}${z}`}
                      position={[x * 1.45, 0, z * 0.76 - 1.3]}
                    >
                      {Array.from({ length: 7 }, (_, i) => (
                        <Part
                          key={i}
                          at={[0, i * 0.045, 0]}
                          size={[0.42, 0.035, 0.58]}
                          color={i % 2 ? "#556a7d" : "#364450"}
                        />
                      ))}
                      <Part
                        at={[0, 0.33, 0]}
                        size={[0.45, 0.04, 0.6]}
                        color={
                          heat && workload === "memory"
                            ? COLORS.amber
                            : COLORS.titanium
                        }
                      />
                    </group>
                  )),
                )}
              </>
            );
          if (p.id === "buffers")
            return (
              <>
                {Array.from({ length: 8 }, (_, i) => (
                  <group key={i} position={[(i - 3.5) * 0.3, 0, 0]}>
                    <Part
                      size={[0.24, 0.09, 0.21]}
                      color={
                        active && i % 2 === active.k % 2
                          ? COLORS.cyan
                          : "#48515f"
                      }
                    />
                    {[-1, 1].map((s) => (
                      <Part
                        key={s}
                        at={[0, 0, s * 0.13]}
                        size={[0.21, 0.025, 0.055]}
                        color={COLORS.gold}
                      />
                    ))}
                  </group>
                ))}
              </>
            );
          if (p.id === "packageio")
            return (
              <BoxBatch
                positions={grid(16, 0.18, 0)}
                size={[0.075, 0.06, 0.075]}
                color={COLORS.gold}
              />
            );
          if (p.id === "thermal")
            return (
              <>
                <Part size={[2.5, 0.1, 2.1]} color="#a4adb1" />
                {Array.from({ length: 21 }, (_, i) => (
                  <Part
                    key={i}
                    at={[(i - 10) * 0.115, 0.24, 0]}
                    size={[0.028, 0.4, 2]}
                    color={heat ? "#8b6951" : "#73838f"}
                  />
                ))}
              </>
            );
          if (p.id === "protective")
            return (
              <>
                {[-1, 1].flatMap((x) =>
                  [-1, 1].map((z) => (
                    <group key={`${x}${z}`} position={[x * 1.36, 0, z * 1.2]}>
                      <Part size={[0.18, 0.2, 0.4]} color={COLORS.titanium} />
                      <mesh position={[0, 0.13, 0]}>
                        <cylinderGeometry args={[0.055, 0.055, 0.09, 6]} />
                        <Surface color={COLORS.gold} />
                      </mesh>
                    </group>
                  )),
                )}
              </>
            );
          if (p.id === "package")
            return (
              <>
                {[-1, 1].map((s) => (
                  <group key={s}>
                    <Part
                      at={[s * 1.68, 0, 0]}
                      size={[0.045, 0.07, 2.95]}
                      color={COLORS.gold}
                    />
                    <Part
                      at={[0, 0, s * 1.48]}
                      size={[3.38, 0.07, 0.045]}
                      color={COLORS.gold}
                    />
                  </group>
                ))}
              </>
            );
          if (p.id === "exploded")
            return (
              <>
                {[-1, 1].flatMap((x) =>
                  [-1, 1].map((z) => (
                    <Part
                      key={`${x}${z}`}
                      at={[x * 1.7, 0, z * 1.5]}
                      size={[0.018, 1.8, 0.018]}
                      color="#607785"
                    />
                  )),
                )}
              </>
            );
          if (p.id === "rack")
            return (
              <>
                <Part size={[5, 0.12, 4.3]} color="#1d383e" />
                {[-1, 1].map((s) => (
                  <group key={s}>
                    <Part
                      at={[s * 2.4, -0.12, 0]}
                      size={[0.14, 0.42, 4.6]}
                      color={COLORS.titanium}
                    />
                    {Array.from({ length: 9 }, (_, i) => (
                      <Part
                        key={i}
                        at={[s * 2.4, 0.14, (i - 4) * 0.47]}
                        size={[0.055, 0.025, 0.12]}
                        color={COLORS.gold}
                      />
                    ))}
                  </group>
                ))}
                {[-1, 1].map((s) => (
                  <Part
                    key={s}
                    at={[0, -0.04, s * 2.1]}
                    size={[4.9, 0.24, 0.12]}
                    color="#3c4a57"
                  />
                ))}
                <GridChips
                  rows={2}
                  cols={12}
                  spacing={0.2}
                  at={[0, 0.1, -1.85]}
                />
                <group
                  visible={rackView}
                  name="rack-infrastructure"
                  position={[0, 0, -5]}
                >
                  {[-1, 1].map((side) => (
                    <group key={side} position={[side * 1.6, 1.8, 0]}>
                      {[-1, 1].flatMap((x) =>
                        [-1, 1].map((z) => (
                          <Part
                            key={`${x}${z}`}
                            at={[x * 1.2, 0, z * 0.65]}
                            size={[0.09, 5.1, 0.09]}
                            color={COLORS.titanium}
                          />
                        )),
                      )}
                      {[-1, 1].map((y) => (
                        <Part
                          key={y}
                          at={[0, y * 2.5, 0]}
                          size={[2.5, 0.13, 1.4]}
                          color="#64757f"
                        />
                      ))}
                      <Part
                        at={[0, 0, -0.65]}
                        size={[2.3, 4.9, 0.08]}
                        color="#243841"
                      />
                      <group name="rack-blades">
                        <BoxBatch
                          positions={Array.from(
                            { length: 36 },
                            (_, i) =>
                              [
                                ((i % 2) - 0.5) * 1.16,
                                (Math.floor(i / 2) - 8.5) * 0.24,
                                0.03,
                              ] as Vector,
                          )}
                          size={[1.02, 0.07, 1.12]}
                          color="#56717e"
                        />
                      </group>
                      <BoxBatch
                        positions={Array.from(
                          { length: 36 },
                          (_, i) =>
                            [
                              ((i % 2) - 0.5) * 1.16,
                              (Math.floor(i / 2) - 8.5) * 0.24 + 0.05,
                              0.03,
                            ] as Vector,
                        )}
                        size={[0.9, 0.018, 0.95]}
                        color="#2c655f"
                      />
                      <BoxBatch
                        positions={Array.from(
                          { length: 36 },
                          (_, i) =>
                            [
                              ((i % 2) - 0.5) * 1.16,
                              (Math.floor(i / 2) - 8.5) * 0.24 + 0.08,
                              0.62,
                            ] as Vector,
                        )}
                        size={[0.14, 0.035, 0.035]}
                        color={COLORS.gold}
                      />
                      {[-1, 1].map((x) => (
                        <Cable
                          key={x}
                          points={[
                            [x * 1.05, -2.3, 0.72],
                            [x * 1.05, 2.3, 0.72],
                          ]}
                          color={COLORS.cyan}
                          width={2}
                        />
                      ))}
                      {[0, 1, 2, 3].map((i) => (
                        <group
                          key={i}
                          position={[(i - 1.5) * 0.52, 2.22, 0.68]}
                        >
                          <Ring radius={0.18} thickness={0.025} />
                          {Array.from({ length: 5 }, (_, j) => (
                            <Part
                              key={j}
                              at={[
                                Math.cos(j * 1.256) * 0.08,
                                Math.sin(j * 1.256) * 0.08,
                                0,
                              ]}
                              size={[0.14, 0.04, 0.02]}
                              rotation={[0, 0, j * 1.256]}
                              color="#657b87"
                            />
                          ))}
                        </group>
                      ))}
                    </group>
                  ))}
                  <Cable
                    points={[
                      [-2.6, -0.5, 0.9],
                      [-2.6, -0.75, 2],
                      [2.6, -0.75, 2],
                      [2.6, -0.5, 0.9],
                    ]}
                    color={COLORS.gold}
                    width={2}
                  />
                </group>
              </>
            );
          if (p.id === "software")
            return (
              <>
                {[0, 1, 2].map((i) => (
                  <group
                    key={i}
                    position={[(i - 1) * 1.05, 0, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                  >
                    <Panel
                      size={[0.85, 0.44, 0.12]}
                      color={i === active?.k % 3 ? COLORS.gold : COLORS.violet}
                    />
                  </group>
                ))}
                <Cable
                  points={[
                    [-1.1, 0.1, 0],
                    [0, 0.1, -0.4],
                    [1.1, 0.1, 0],
                  ]}
                />
              </>
            );
          return (
            <group rotation={[0, -Math.PI / 2, 0]}>
              <Panel size={[1, 0.7, 0.12]} color={COLORS.cyan} />
              {active && (
                <Ring at={[0, 0, 0.13]} radius={0.18} color={COLORS.gold} />
              )}
            </group>
          );
        }}
      />
      {attached > 8 && flow && (
        <Trace
          at={[0, 0.28, 0]}
          length={3.2}
          rotation={[-Math.PI / 2, 0, 0]}
          activity={active?.sum ? Math.min(1, Math.abs(active.sum) / 20) : 0.2}
        />
      )}
    </group>
  );
}
