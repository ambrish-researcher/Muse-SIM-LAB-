import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { ConstructionTree } from "../construction/ConstructionTree";
import { BLUEPRINTS } from "../construction/blueprints";
import { Part, COLORS, Trace, Label3D } from "../engine/materials";
import { Ring, Panel, Cable, TaperedShell } from "../engine/hardware";
import { useData } from "../experience/data";
import { useExperience } from "../experience/store";
import { tinyTransformer, retrieveMemory } from "../simulation/advanced";
function VectorBank({ values, color }: { values: number[][]; color: string }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <Part
          key={s}
          at={[s * 0.32, 0, 0]}
          size={[0.024, 0.53, 0.3]}
          color={COLORS.titanium}
        />
      ))}
      {values.slice(0, 4).map((row, i) => (
        <group key={i} position={[0, 0.18 - i * 0.12, 0]}>
          <Part size={[0.61, 0.015, 0.31]} color="#344654" />
          {row.map((value, j) => (
            <group key={j} position={[(j - 1.5) * 0.14, 0.035, 0.08]}>
              <Part
                size={[0.08, 0.02 + Math.min(1, Math.abs(value)) * 0.07, 0.11]}
                color={value >= 0 ? color : COLORS.violet}
                active
              />
              <Part
                at={[0, -0.02, 0.11]}
                size={[0.015, 0.025, 0.05]}
                color={COLORS.gold}
              />
            </group>
          ))}
        </group>
      ))}
      {[-1, 1].map((s) => (
        <Cable
          key={s}
          points={[
            [s * 0.28, -0.24, -0.12],
            [s * 0.33, 0, -0.15],
            [s * 0.28, 0.24, -0.12],
          ]}
          color={color}
          width={1.5}
        />
      ))}
    </>
  );
}
export default function WonderModel() {
  const text = useData((s) => s.text),
    query = useData((s) => s.query),
    agent = useData((s) => s.agent);
  const facts = useData((s) => s.facts),
    memoryQuery = useData((s) => s.memoryQuery);
  const t = useMemo(() => tinyTransformer(text), [text]);
  const rows = retrieveMemory(facts, memoryQuery),
    q = Math.min(query, t.tokens.length - 1);
  const attached = useExperience((s) => s.buildAttached),
    flow = useExperience((s) => s.flow),
    complete = useExperience((s) => s.buildComplete),
    isolated = useExperience((s) => s.isolated);
  return (
    <group rotation={[0.06, -0.13, 0]}>
      <ConstructionTree
        lab="wonder"
        explode={(p) =>
          p.id === "architecture"
            ? -1
            : (BLUEPRINTS.wonder.indexOf(p) % 3) * 0.18
        }
        render={(p, index) => {
          if (p.id === "tokens" || p.id === "positions")
            return (
              <>
                {t.tokens.map((word, i) => (
                  <group
                    key={i}
                    position={[
                      (i % 4) * 0.23 - 0.25,
                      Math.floor(i / 4) * 0.19,
                      0,
                    ]}
                  >
                    <Part
                      size={[0.2, 0.13, 0.13]}
                      color={p.id === "tokens" ? COLORS.cyan : COLORS.gold}
                    />
                    <Part
                      at={[0, 0, 0.08]}
                      size={[0.11, 0.015, 0.01]}
                      color={COLORS.white}
                      active
                    />
                    <Label3D
                      at={[0, -0.075, 0.09]}
                      text={
                        p.id === "tokens" ? word : `${i} · ${t.tokenIds[i]}`
                      }
                      width={0.23}
                    />
                  </group>
                ))}
              </>
            );
          if (p.id === "embeddings" || p.id === "positional")
            return (
              <VectorBank
                values={
                  p.id === "embeddings" ? t.tokenEmbeddings : t.positional
                }
                color={p.id === "embeddings" ? COLORS.cyan : COLORS.gold}
              />
            );
          if (["query", "key", "value"].includes(p.id))
            return (
              <VectorBank
                values={p.id === "query" ? t.q : p.id === "key" ? t.k : t.v}
                color={
                  p.id === "query"
                    ? COLORS.cyan
                    : p.id === "key"
                      ? COLORS.gold
                      : COLORS.violet
                }
              />
            );
          if (p.id === "scores")
            return (
              <>
                <Part size={[0.67, 0.5, 0.04]} color="#172e3a" />
                {t.heads[0].rawScores
                  .slice(0, 4)
                  .flatMap((row, i) =>
                    row
                      .slice(0, 4)
                      .map((v, j) => (
                        <Part
                          key={`${i}${j}`}
                          at={[
                            (j - 1.5) * 0.15,
                            (1.5 - i) * 0.12,
                            0.07 +
                              (Number.isFinite(v) ? Math.abs(v) * 0.02 : 0),
                          ]}
                          size={[
                            0.11,
                            0.09,
                            Number.isFinite(v)
                              ? 0.07 + Math.abs(v) * 0.04
                              : 0.015,
                          ]}
                          color={
                            !Number.isFinite(v)
                              ? "#24333f"
                              : i === q
                                ? COLORS.gold
                                : COLORS.cyan
                          }
                          active={Number.isFinite(v)}
                        />
                      )),
                  )}
                {[-1, 1].map((s) => (
                  <Part
                    key={s}
                    at={[s * 0.35, 0, 0]}
                    size={[0.02, 0.53, 0.16]}
                    color={COLORS.titanium}
                  />
                ))}
              </>
            );
          if (p.id === "softmax")
            return (
              <>
                <group rotation={[0, 0, Math.PI / 2]}>
                  <TaperedShell
                    width={0.45}
                    height={0.64}
                    depth={0.15}
                    color="#355561"
                  />
                </group>
                {t.heads[0].weights[q].map((w, i) => (
                  <group key={i}>
                    <Cable
                      points={[
                        [-0.28, 0.12, 0.1],
                        [-0.1, 0.19 - (i % 4) * 0.12, 0.22],
                        [0.24, 0.18 - (i % 4) * 0.12, 0.12],
                      ]}
                      color={w > 0 ? COLORS.gold : "#41515d"}
                      width={1 + w * 3}
                    />
                    <Part
                      at={[0.29, 0.18 - (i % 4) * 0.12, 0.1]}
                      size={[0.045, 0.025, 0.02 + w * 0.25]}
                      color={COLORS.gold}
                      active={w > 0}
                    />
                  </group>
                ))}
              </>
            );
          if (p.id === "weighted")
            return (
              <>
                <VectorBank values={t.heads[0].output} color={COLORS.cyan} />
                <Part
                  at={[0, -0.31, 0]}
                  size={[0.64, 0.045, 0.34]}
                  color={COLORS.gold}
                />
              </>
            );
          if (p.id === "heads")
            return (
              <>
                {[-1, 1].map((s, h) => (
                  <group key={s} position={[s * 0.2, 0, 0]}>
                    <Ring
                      radius={0.17}
                      thickness={0.025}
                      color={s === 1 ? COLORS.cyan : COLORS.violet}
                    />
                    <Ring radius={0.17} thickness={0.014} at={[0, 0, -0.18]} />
                    {Array.from({ length: 8 }, (_, j) => {
                      const a = (j * Math.PI) / 4;
                      return (
                        <Part
                          key={j}
                          at={[Math.cos(a) * 0.145, Math.sin(a) * 0.145, -0.09]}
                          size={[0.025, 0.025, 0.2]}
                          color={COLORS.titanium}
                        />
                      );
                    })}
                    {t.heads[h].weights[q].slice(0, 4).map((w, j) => (
                      <Part
                        key={j}
                        at={[
                          ((j % 2) - 0.5) * 0.08,
                          (Math.floor(j / 2) - 0.5) * 0.08,
                          0,
                        ]}
                        size={[0.045, 0.045, 0.04 + w * 0.16]}
                        color={h ? COLORS.violet : COLORS.cyan}
                        active
                      />
                    ))}
                  </group>
                ))}
                <Cable
                  points={[
                    [-0.2, -0.17, 0],
                    [0, -0.3, 0],
                    [0.2, -0.17, 0],
                  ]}
                />
              </>
            );
          if (p.id === "stack")
            return (
              <>
                {Array.from({ length: 5 }, (_, i) => (
                  <group key={i} position={[0, i * 0.065, 0]}>
                    <Part
                      size={[0.7, 0.025, 0.4]}
                      color={i % 2 ? COLORS.violet : COLORS.titanium}
                    />
                    {Array.from({ length: 5 }, (_, j) => (
                      <Part
                        key={j}
                        at={[(j - 2) * 0.12, 0.025, 0.1]}
                        size={[0.065, 0.018, 0.07]}
                        color={COLORS.cyan}
                      />
                    ))}
                  </group>
                ))}
              </>
            );
          if (p.id === "projection")
            return <VectorBank values={t.projection} color={COLORS.titanium} />;
          if (p.id === "residual")
            return (
              <>
                <VectorBank values={t.residual} color={COLORS.gold} />
                {[-1, 1].map((s) => (
                  <Cable
                    key={s}
                    points={[
                      [-0.36, s * 0.26, 0],
                      [0, s * 0.34, 0.15],
                      [0.36, s * 0.26, 0],
                      [0.36, -s * 0.26, 0],
                    ]}
                    color={COLORS.gold}
                    width={2}
                  />
                ))}
              </>
            );
          if (p.id === "ffn")
            return (
              <>
                {Array.from({ length: 8 }, (_, i) => (
                  <group key={i} position={[(i - 3.5) * 0.08, 0, 0]}>
                    <Part
                      size={[
                        0.03,
                        0.22 + Math.sin((i * Math.PI) / 7) * 0.25,
                        0.3,
                      ]}
                      color={i % 2 ? COLORS.violet : COLORS.titanium}
                    />
                    {[-1, 1].map((s) => (
                      <Part
                        key={s}
                        at={[0, s * 0.12, 0.17]}
                        size={[
                          0.035,
                          0.03,
                          0.04 + Math.abs(t.ffn[q][i % 4]) * 0.09,
                        ]}
                        color={COLORS.cyan}
                        active
                      />
                    ))}
                  </group>
                ))}
                <Part
                  at={[0, -0.26, 0]}
                  size={[0.72, 0.04, 0.35]}
                  color="#344d5a"
                />
              </>
            );
          if (p.id === "memory")
            return (
              <>
                {facts.slice(0, 6).map((fact, i) => (
                  <group key={i} position={[i * 0.12 - 0.3, 0, 0]}>
                    <Panel
                      size={[0.09, 0.44, 0.22]}
                      slots={1}
                      color={
                        rows[0]?.text === fact ? COLORS.gold : COLORS.violet
                      }
                    />
                  </group>
                ))}
              </>
            );
          if (p.id === "focus" || p.id === "planner" || p.id === "tools")
            return (
              <>
                <Panel color={p.id === "tools" ? COLORS.gold : COLORS.violet} />
                {Array.from({ length: 5 }, (_, i) => (
                  <Part
                    key={i}
                    at={[(i - 2) * 0.1, 0.08, 0.1]}
                    size={[0.06, 0.07, 0.025]}
                    color={agent.step >= i ? COLORS.cyan : "#263540"}
                    active={agent.step === i}
                  />
                ))}
              </>
            );
          if (p.id === "architecture")
            return (
              <>
                {[-1, 1].map((s) => (
                  <Part
                    key={s}
                    at={[s * 3, -0.2, 0]}
                    size={[0.035, 3.65, 0.06]}
                    color={COLORS.titanium}
                  />
                ))}
                {[-1, 1].map((s) => (
                  <Part
                    key={s}
                    at={[0, s * 1.95 - 0.2, 0]}
                    size={[6.05, 0.035, 0.06]}
                    color={COLORS.titanium}
                  />
                ))}
              </>
            );
          if (p.id === "output")
            return (
              <>
                <Panel size={[0.6, 1.0, 0.18]} color={COLORS.gold} />
                {t.probabilities.map((v, i) => (
                  <Part
                    key={i}
                    at={[-0.2 + v * 0.6, 0.35 - i * 0.09, 0.15]}
                    size={[Math.max(0.02, v * 1.2), 0.035, 0.025]}
                    color={
                      t.vocabulary[i] === t.next ? COLORS.gold : COLORS.cyan
                    }
                    active
                  />
                ))}
              </>
            );
          return (
            <>
              <Panel color={index % 2 ? COLORS.cyan : COLORS.violet} />
              <Ring
                radius={0.11}
                thickness={0.013}
                at={[0, 0.06, 0.15]}
                color={COLORS.gold}
              />
            </>
          );
        }}
      />
      {/* Connections are introduced only after both endpoints have attached. */}
      {!isolated &&
        BLUEPRINTS.wonder.slice(1, attached).map((p, i) => {
          const parent = BLUEPRINTS.wonder.find((x) => x.id === p.parent)!;
          return (
            <Line
              key={p.id}
              points={[
                parent.target,
                [parent.target[0], p.target[1], -0.16],
                p.target,
              ]}
              color={i % 3 === 0 ? COLORS.gold : "#37616c"}
              lineWidth={1}
            />
          );
        })}
      {!isolated &&
        attached > 9 &&
        t.tokens.map((_, i) => {
          const w = t.heads[0].weights[q][i];
          return w > 0 ? (
            <Line
              key={i}
              points={[
                [-2.5 + i * 0.13, -1.4, 0.3],
                [-1.1, -0.8, 0.7],
                [0.4, -0.45, 0.3],
              ]}
              color={COLORS.cyan}
              lineWidth={1 + w * 5}
              transparent
              opacity={0.2 + w * 0.65}
            />
          ) : null;
        })}
      {!isolated && complete && flow && (
        <Trace
          at={[0.4, -2.05, 0.1]}
          length={5.6}
          activity={0.35 + Math.max(...t.probabilities)}
        />
      )}
    </group>
  );
}
