import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { Part, Surface, COLORS, BoxBatch } from "./materials";
import type { Vector } from "../construction/blueprints";
export function Ring({
  radius = 0.15,
  thickness = 0.025,
  color = COLORS.titanium,
  at = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  radius?: number;
  thickness?: number;
  color?: string;
  at?: Vector;
  rotation?: Vector;
}) {
  return (
    <mesh position={at} rotation={rotation}>
      <torusGeometry args={[radius, thickness, 8, 40]} />
      <Surface color={color} />
    </mesh>
  );
}
export function Bearing({
  radius = 0.11,
  width = 0.12,
}: {
  radius?: number;
  width?: number;
}) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[radius, radius, width, 24]} />
        <Surface color="#303b45" />
      </mesh>
      {[-1, 1].map((s) => (
        <group
          key={s}
          position={[0, s * width * 0.52, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <Ring radius={radius * 0.84} thickness={0.016} />
          <Ring radius={radius * 0.51} thickness={0.012} color={COLORS.gold} />
        </group>
      ))}
      <mesh>
        <cylinderGeometry
          args={[radius * 0.32, radius * 0.32, width * 1.18, 12]}
        />
        <Surface color={COLORS.titanium} />
      </mesh>
    </group>
  );
}
export function GridChips({
  rows = 6,
  cols = 6,
  spacing = 0.08,
  color = COLORS.titanium,
  at = [0, 0, 0],
}: {
  rows?: number;
  cols?: number;
  spacing?: number;
  color?: string;
  at?: Vector;
}) {
  const positions = useMemo(
    () =>
      Array.from(
        { length: rows * cols },
        (_, i) =>
          [
            ((i % cols) - (cols - 1) / 2) * spacing,
            0,
            (Math.floor(i / cols) - (rows - 1) / 2) * spacing,
          ] as Vector,
      ),
    [rows, cols, spacing],
  );
  return (
    <group position={at}>
      <BoxBatch
        positions={positions}
        size={[spacing * 0.65, 0.035, spacing * 0.65]}
        color={color}
      />
    </group>
  );
}
export function Panel({
  size = [0.65, 0.46, 0.14],
  color = COLORS.titanium,
  slots = 6,
}: {
  size?: Vector;
  color?: string;
  slots?: number;
}) {
  return (
    <>
      <Part size={size} color="#142731" />
      <Part
        at={[0, 0, size[2] / 2 + 0.008]}
        size={[size[0] * 0.88, size[1] * 0.8, 0.018]}
        color={color}
        kind="glass"
      />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((y) => (
          <mesh
            key={`${x}${y}`}
            position={[
              x * size[0] * 0.42,
              y * size[1] * 0.39,
              size[2] / 2 + 0.02,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.016, 0.016, 0.016, 6]} />
            <Surface color={COLORS.gold} />
          </mesh>
        )),
      )}
      {Array.from({ length: slots }, (_, i) => (
        <Part
          key={i}
          at={[
            (i - (slots - 1) / 2) * size[0] * 0.11,
            -size[1] * 0.25,
            size[2] / 2 + 0.025,
          ]}
          size={[0.024, size[1] * 0.2, 0.015]}
          color={i % 3 === 0 ? COLORS.gold : color}
          active
        />
      ))}
    </>
  );
}
export function Cable({
  points,
  color = COLORS.gold,
  width = 1,
}: {
  points: Vector[];
  color?: string;
  width?: number;
}) {
  return <Line points={points} color={color} lineWidth={width} />;
}
export function TaperedShell({
  width = 0.5,
  height = 0.5,
  depth = 0.24,
  color = COLORS.white,
}: {
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
}) {
  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-width * 0.35, -height / 2);
    s.lineTo(width * 0.35, -height / 2);
    s.lineTo(width / 2, height * 0.25);
    s.lineTo(width * 0.32, height / 2);
    s.lineTo(-width * 0.32, height / 2);
    s.lineTo(-width / 2, height * 0.25);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 2,
      steps: 1,
    });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  }, [width, height, depth]);
  return (
    <mesh geometry={geometry}>
      <Surface color={color} kind="ceramic" />
    </mesh>
  );
}
