import { useMemo, useEffect, useRef, useContext } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import * as THREE from "three";
import { useExperience } from "../experience/store";
import { SubsystemContext } from "./subsystem-context";
const boxGeometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
export const COLORS = {
  cyan: "#70e7e2",
  gold: "#e7bb75",
  violet: "#8d7ac7",
  white: "#dbe4e8",
  titanium: "#8d9aa5",
  dark: "#151e25",
  amber: "#e8a46b",
};
export function Surface({
  color = COLORS.titanium,
  kind = "metal",
  active = false,
}: {
  color?: string;
  kind?: "metal" | "glass" | "ceramic" | "dark";
  active?: boolean;
}) {
  const xray = useExperience((s) => s.xray);
  const id = useContext(SubsystemContext);
  const selected = useExperience((s) => s.selected);
  const material = useRef<THREE.MeshStandardMaterial>(null!);
  useEffect(() => {
    const instance = material.current;
    return () => instance.dispose();
  }, []);
  return (
    <meshStandardMaterial
      ref={material}
      color={color}
      metalness={kind === "metal" ? 0.85 : kind === "glass" ? 0.65 : 0.25}
      roughness={kind === "metal" ? 0.27 : kind === "glass" ? 0.12 : 0.5}
      transparent={xray || kind === "glass"}
      opacity={xray ? 0.22 : kind === "glass" ? 0.3 : 1}
      emissive={active || (id && id === selected) ? color : "#000000"}
      emissiveIntensity={active ? 0.75 : id && id === selected ? 0.12 : 0}
      depthWrite={!xray}
    />
  );
}
export function Part({
  at = [0, 0, 0],
  size = [1, 1, 1],
  color,
  kind,
  active = false,
  rotation = [0, 0, 0],
}: {
  at?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  kind?: "metal" | "glass" | "ceramic" | "dark";
  active?: boolean;
  rotation?: [number, number, number];
}) {
  return (
    <mesh
      position={at}
      rotation={rotation}
      scale={size}
      geometry={boxGeometry}
      dispose={null}
    >
      <Surface color={color} kind={kind} active={active} />
    </mesh>
  );
}
export function BoxBatch({
  positions,
  size,
  color,
  rotations,
}: {
  positions: [number, number, number][];
  size: [number, number, number];
  color: string;
  rotations?: number[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => {
    const o = new THREE.Object3D();
    positions.forEach((p, i) => {
      o.position.set(...p);
      o.rotation.set(0, 0, rotations?.[i] ?? 0);
      o.scale.set(...size);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions, size, rotations]);
  return (
    <instancedMesh
      ref={ref}
      args={[boxGeometry, undefined, positions.length]}
      dispose={null}
    >
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
    </instancedMesh>
  );
}
export function Label3D({
  at,
  text,
  color = COLORS.cyan,
  width = 2.1,
}: {
  at: [number, number, number];
  text: string;
  color?: string;
  width?: number;
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const x = c.getContext("2d")!;
    x.fillStyle = "#0b111be8";
    x.fillRect(0, 0, 512, 96);
    x.strokeStyle = color;
    x.lineWidth = 3;
    x.strokeRect(1, 1, 510, 94);
    x.fillStyle = "#eff5f7";
    x.font = "28px Arial";
    let fontSize = 28;
    while (x.measureText(text).width > 480 && fontSize > 14) {
      fontSize--;
      x.font = `${fontSize}px Arial`;
    }
    x.textBaseline = "middle";
    x.textAlign = "center";
    x.fillText(text, 256, 48);
    return new THREE.CanvasTexture(c);
  }, [text, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={at} scale={[width, width * 0.186, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}
export function Batch({
  positions,
  color = COLORS.cyan,
  size = 0.035,
}: {
  positions: [number, number, number][];
  color?: string;
  size?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => {
    const o = new THREE.Object3D();
    positions.forEach((p, i) => {
      o.position.set(...p);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]}>
      <sphereGeometry args={[size, 6, 4]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        metalness={0.5}
        roughness={0.25}
      />
    </instancedMesh>
  );
}
export function Trace({
  length = 4,
  color = COLORS.cyan,
  rotation = [0, 0, 0],
  at = [0, 0, 0],
  activity = 1,
}: {
  length?: number;
  color?: string;
  rotation?: [number, number, number];
  at?: [number, number, number];
  activity?: number;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uActivity: { value: activity },
    }),
    [color],
  );
  useFrame((_, delta) => {
    const s = useExperience.getState();
    if (!s.reduced) mat.current.uniforms.uTime.value += delta;
    mat.current.uniforms.uActivity.value = activity;
  });
  return (
    <mesh position={at} rotation={rotation}>
      <planeGeometry args={[length, 0.035]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        vertexShader={
          "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
        }
        fragmentShader={
          "varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uActivity;void main(){float pulse=pow(max(0.0,sin((vUv.x-uTime*.24)*32.0)),12.0);float edge=smoothstep(0.0,.25,vUv.x)*(1.0-smoothstep(.75,1.0,vUv.x));gl_FragColor=vec4(uColor*(.45+pulse*1.5),(.18+pulse*.8)*edge*uActivity);}"
        }
      />
    </mesh>
  );
}
export function Bolts({
  width = 3,
  depth = 3,
  y = 0,
}: {
  width?: number;
  depth?: number;
  y?: number;
}) {
  return (
    <>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh
            key={`${x}${z}`}
            position={[(x * width) / 2, y, (z * depth) / 2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.055, 0.055, 0.06, 8]} />
            <Surface color="#ccd0d4" />
          </mesh>
        )),
      )}
    </>
  );
}
