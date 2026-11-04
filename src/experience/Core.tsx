import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Batch, Part, Surface, Trace, COLORS } from "../engine/materials";
import { useExperience } from "./store";
export default function Core() {
  const group = useRef<THREE.Group>(null!);
  const outer = useRef<THREE.Group>(null!);
  const t = useRef(0);
  const pulse = useRef(0);
  const lattice = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i < 17; i++)
      for (let j = 0; j < 17; j++)
        for (let k = 0; k < 5; k++) {
          const x = (i - 8) * 0.16,
            y = (j - 8) * 0.16,
            z = (k - 2) * 0.24;
          if (x * x + y * y + z * z < 1.45) out.push([x, y, z]);
        }
    return out;
  }, []);
  useFrame(({ pointer }, dt) => {
    const s = useExperience.getState();
    if (s.reduced) return;
    {
      t.current += dt;
      pulse.current = Math.max(0, pulse.current - dt * 0.9);
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        pointer.x * 0.25,
        3,
        dt,
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -pointer.y * 0.15,
        3,
        dt,
      );
      outer.current.rotation.z =
        t.current * (s.phase === "GATEWAY" ? 0.65 : 0.08);
      outer.current.children.forEach((ring, i) => {
        ring.position.z = THREE.MathUtils.damp(
          ring.position.z,
          s.phase === "GATEWAY" ? (i - 1) * 2.2 : 0,
          3,
          dt,
        );
      });
      group.current.scale.setScalar(1 - pulse.current * 0.06);
    }
  });
  return (
    <group
      position={[2.1, 0.25, 0]}
      rotation={[0.15, -0.3, -0.25]}
      ref={group}
      onClick={() => {
        pulse.current = 1;
        useExperience.getState().patch({
          cameraRevision: useExperience.getState().cameraRevision + 1,
        });
      }}
    >
      <group ref={outer}>
        {[2.1, 2.55, 3.0].map((r, j) => (
          <group key={r} rotation={[j * 0.25, j * 0.2, 0]}>
            <mesh>
              <torusGeometry args={[r, 0.065, 12, 128]} />
              <Surface color={j === 1 ? "#a4aeb3" : "#5a686f"} />
            </mesh>
            {Array.from({ length: 32 }, (_, i) => {
              const a = (i / 32) * Math.PI * 2;
              return (
                <group
                  key={i}
                  position={[Math.cos(a) * r, Math.sin(a) * r, 0]}
                  rotation={[0, 0, a]}
                >
                  <Part
                    size={[0.16, 0.27, 0.15]}
                    color={i % 4 === 0 ? COLORS.gold : "#29353d"}
                  />
                  {i % 4 === 0 && (
                    <Part
                      at={[0, 0, 0.1]}
                      size={[0.035, 0.17, 0.02]}
                      color={COLORS.cyan}
                      active
                    />
                  )}
                </group>
              );
            })}
          </group>
        ))}
      </group>
      <mesh rotation={[0.3, 0.5, 0]}>
        <icosahedronGeometry args={[1.55, 2]} />
        <meshPhysicalMaterial
          color="#8fd7e4"
          transparent
          opacity={0.09}
          metalness={0.4}
          roughness={0.12}
          wireframe
        />
      </mesh>
      <Batch positions={lattice} size={0.022} />
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[(i * Math.PI) / 3, i * 0.8, 0]}>
          <mesh>
            <torusGeometry args={[1.45, 0.018, 8, 100]} />
            <meshBasicMaterial color={i === 1 ? COLORS.gold : COLORS.cyan} />
          </mesh>
          <Trace length={3.4} rotation={[0, 0, i * 0.7]} activity={0.6} />
        </group>
      ))}
      <mesh>
        <octahedronGeometry args={[0.46, 0]} />
        <Surface color={COLORS.gold} active />
      </mesh>
    </group>
  );
}
