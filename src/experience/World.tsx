import { lazy, Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import gsap from "gsap";
import { BLUEPRINTS } from "../construction/blueprints";
import { constructionClock, useExperience } from "./store";
import Core from "./Core";
import type { LabId } from "../simulation";
const Wonder = lazy(() => import("../labs/WonderModel")),
  Chip = lazy(() => import("../labs/ChipModel")),
  Robot = lazy(() => import("../labs/RobotModel"));
const LAB_Z = -32;
function visiblyMounted(object: THREE.Object3D) {
  let p: THREE.Object3D | null = object;
  while (p) {
    if (!p.visible) return false;
    p = p.parent;
  }
  return true;
}
function CameraDirector() {
  const { camera, size, scene } = useThree();
  const phase = useExperience((s) => s.phase),
    transition = useExperience((s) => s.transition),
    lab = useExperience((s) => s.lab),
    free = useExperience((s) => s.free);
  const revision = useExperience((s) => s.cameraRevision),
    active = useExperience((s) => s.buildActive),
    count = useExperience((s) => s.buildCount),
    reduced = useExperience((s) => s.reduced);
  const aim = useRef(new THREE.Vector3(1, 0, 0));
  const scroll = useRef(0),
    arc = useRef(0);
  useEffect(() => {
    const wheel = (e: WheelEvent) => {
      const s = useExperience.getState();
      if (s.phase === "INTRO" && !s.reduced)
        scroll.current = THREE.MathUtils.clamp(
          scroll.current + e.deltaY * 0.001,
          0,
          1,
        );
    };
    window.addEventListener("wheel", wheel, { passive: true });
    return () => window.removeEventListener("wheel", wheel);
  }, []);
  useEffect(() => {
    const s = useExperience.getState(),
      mobile = size.width < 760;
    if (free && s.cameraAction === "orbit") return;
    const at = new THREE.Vector3(0, 0.6, 11),
      target = new THREE.Vector3(1, 0, 0);
    const overview = () => {
      const robotWorld = lab === "robot" && (count >= 27 || s.buildComplete);
      const view: [number, number, number] =
        lab === "wonder"
          ? [1.4, 2.1, 10.8]
          : lab === "chip"
            ? [5.4, 5, 7]
            : robotWorld
              ? [6.7, 5.1, 8.1]
              : [2.7, 1.7, 4.3];
      at.set(...view);
      target.set(0, lab === "robot" ? -0.4 : -0.2, 0);
      if (lab === "chip" && s.rackView) {
        at.set(8, 5.6, 14);
        target.set(0, 1, -3.5);
      }
    };
    if (phase === "GATEWAY" || phase === "EXIT_TRANSITION") {
      at.set(0, 0.4, 12);
      target.set(0, 0, -3);
    } else if (lab) {
      overview();
      if (
        phase === "CONSTRUCTION" &&
        count > 0 &&
        count < BLUEPRINTS[lab].length &&
        count % 5 !== 0
      ) {
        const p = BLUEPRINTS[lab][active];
        if (
          (lab !== "robot" || active < 26) &&
          !(lab === "chip" && s.rackView)
        ) {
          target.set(...p.target);
          if (lab === "robot") target.y -= 1.35;
          const distance = lab === "wonder" ? 4.4 : lab === "chip" ? 5.1 : 2.8;
          const direction = new THREE.Vector3(
            lab === "chip" ? 0.9 : 0.38,
            lab === "chip" ? 0.9 : 0.25,
            1,
          ).normalize();
          at.copy(target).addScaledVector(direction, distance);
        }
      }
      if (s.cameraAction === "focus" && s.selected) {
        const box = new THREE.Box3();
        scene.updateMatrixWorld();
        scene.traverse((o) => {
          if (o.userData.componentId === s.selected)
            o.traverse((child) => {
              if ((child as THREE.Mesh).isMesh && visiblyMounted(child))
                box.expandByObject(child);
            });
        });
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3()),
            extent = box.getSize(new THREE.Vector3());
          target.copy(center);
          target.z -= LAB_Z;
          at.copy(target).addScaledVector(
            new THREE.Vector3(0.65, 0.4, 1).normalize(),
            Math.max(1, Math.max(...extent.toArray()) * 2.4),
          );
        }
      }
      if (s.cameraAction === "in" || s.cameraAction === "out") {
        target.copy(aim.current);
        target.z -= LAB_Z;
        at.copy(camera.position);
        at.z -= LAB_Z;
        at.sub(target)
          .multiplyScalar(s.cameraAction === "in" ? 0.78 : 1.25)
          .add(target);
      }
      if (s.cameraAction === "left" || s.cameraAction === "right") {
        target.copy(aim.current);
        target.z -= LAB_Z;
        at.copy(camera.position);
        at.z -= LAB_Z;
        at.sub(target)
          .applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            s.cameraAction === "left" ? -0.3 : 0.3,
          )
          .add(target);
      }
      if (mobile) {
        at.sub(target).multiplyScalar(1.3).add(target);
        target.y -= 0.7;
      }
      at.z += LAB_Z;
      target.z += LAB_Z;
    }
    const timeline = gsap.timeline();
    timeline
      .to(
        camera.position,
        {
          x: at.x,
          y: at.y,
          z: at.z,
          duration: reduced ? 0.15 : phase === "SCENE_PREPARING" ? 1.8 : 1.05,
          ease: "power3.inOut",
        },
        0,
      )
      .to(
        aim.current,
        {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: reduced ? 0.15 : 1.05,
          ease: "power2.inOut",
        },
        0,
      )
      .call(() => {
        const now = useExperience.getState();
        if (now.phase === "SCENE_PREPARING")
          now.patch({ phase: "CONSTRUCTION" });
        if (now.phase === "EXIT_TRANSITION")
          now.patch({ phase: "GATEWAY", lab: null });
      });
    return () => {
      timeline.kill();
    };
  }, [
    camera,
    scene,
    size.width,
    transition,
    revision,
    active,
    count,
    phase,
    lab,
    reduced,
    free,
  ]);
  useFrame((_, dt) => {
    if (phase === "INTRO" && !reduced) {
      arc.current = THREE.MathUtils.damp(arc.current, scroll.current, 4, dt);
      if (arc.current > 0.001)
        camera.position.set(
          Math.sin(arc.current * 0.5) * 8,
          0.6 + arc.current * 1.4,
          11 - arc.current * 2.5,
        );
    }
    if (!free) camera.lookAt(aim.current);
  });
  return (
    <OrbitControls
      enabled={free}
      target={aim.current}
      enableDamping
      dampingFactor={0.07}
      minDistance={0.6}
      maxDistance={35}
      onStart={() => useExperience.getState().patch({ cameraAction: "orbit" })}
    />
  );
}
declare global {
  interface Window {
    __MUSE_METRICS__?: {
      frameMs: number;
      drawCalls: number;
      triangles: number;
      geometries: number;
    };
    __MUSE_SCENE__?: {
      lab: LabId | null;
      phase: string;
      introduced: number;
      attached: number;
      components: {
        id: string;
        name: string;
        attached: boolean;
        position: number[];
      }[];
      cameraPosition: number[];
      cells?: { col: number; row: number; x: number; y: number }[];
    };
  }
}
function ModelReady() {
  useEffect(() => {
    useExperience.getState().patch({ modelReady: true });
  }, []);
  return null;
}
function ClockAndDiagnostics() {
  const { gl, scene, camera, size, setDpr } = useThree(),
    frames = useRef<number[]>([]),
    sample = useRef(0);
  useFrame((_, dt) => {
    const s = useExperience.getState();
    if (s.phase === "CONSTRUCTION" && s.modelReady && !document.hidden) {
      constructionClock.elapsed += Math.min(dt, 0.1);
      s.advanceBuild();
    }
    if (dt < 0.25 && !document.hidden) {
      frames.current.push(dt * 1000);
      if (frames.current.length > 120) frames.current.shift();
    }
    sample.current += dt;
    if (sample.current > 0.25) {
      sample.current = 0;
      const parts: NonNullable<Window["__MUSE_SCENE__"]>["components"] = [];
      scene.updateMatrixWorld();
      scene.traverse((o) => {
        if (o.userData.constructionPart) {
          let visible = true;
          let p: THREE.Object3D | null = o;
          while (p) {
            if (!p.visible) visible = false;
            p = p.parent;
          }
          if (visible)
            parts.push({
              id: o.userData.componentId,
              name: o.userData.componentName,
              attached: o.userData.attached,
              position: o.getWorldPosition(new THREE.Vector3()).toArray(),
            });
        }
      });
      const cells =
        s.lab === "robot" && s.buildCount >= 27
          ? Array.from({ length: 64 }, (_, i) => {
              const col = i % 8,
                row = Math.floor(i / 8),
                p = new THREE.Vector3(
                  (col - 3.5) * 0.7,
                  -1.38,
                  LAB_Z + (row - 3.5) * 0.7,
                ).project(camera);
              return {
                col,
                row,
                x: ((p.x + 1) * size.width) / 2,
                y: ((1 - p.y) * size.height) / 2,
              };
            })
          : undefined;
      window.__MUSE_SCENE__ = {
        lab: s.lab,
        phase: s.phase,
        introduced: s.buildCount,
        attached: s.buildAttached,
        components: parts,
        cells,
        cameraPosition: camera.position.toArray(),
      };
      window.__MUSE_METRICS__ = {
        frameMs:
          frames.current.reduce((a, b) => a + b, 0) /
          Math.max(1, frames.current.length),
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
      };
      if (
        s.quality === "balanced" &&
        frames.current.length >= 90 &&
        window.__MUSE_METRICS__.frameMs > 35 &&
        gl.getPixelRatio() > 1
      )
        setDpr(1);
    }
  });
  return null;
}
function Recovery() {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement,
      lost = (e: Event) => {
        e.preventDefault();
        document.getElementById("webgl-status")?.removeAttribute("hidden");
      };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  return null;
}
function AbstractField() {
  const group = useRef<THREE.Group>(null!);
  useFrame(({ pointer }, dt) => {
    if (useExperience.getState().reduced) return;
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      pointer.x * 0.15,
      3,
      dt,
    );
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      -pointer.y * 0.1,
      3,
      dt,
    );
  });
  return (
    <group ref={group} position={[-2.1, -0.25, -5]}>
      <Core />
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          position={[2.1, 0.25, -i * 0.65]}
          rotation={[i * 0.1, i * 0.08, 0]}
        >
          <torusGeometry args={[3.7 + i * 0.12, 0.008, 6, 96]} />
          <meshBasicMaterial color={i % 3 === 0 ? "#a48a60" : "#284552"} />
        </mesh>
      ))}
    </group>
  );
}
function Content() {
  const lab = useExperience((s) => s.lab),
    phase = useExperience((s) => s.phase),
    quality = useExperience((s) => s.quality),
    generation = useExperience((s) => s.buildRevision);
  useEffect(() => {
    const s = useExperience.getState();
    if (!s.ready) {
      s.patch({ ready: true, phase: "INTRO" });
      const route = location.hash.slice(1);
      if (["wonder", "chip", "robot"].includes(route)) s.launch(route as LabId);
      else if (route === "gateway") s.enter();
    }
  }, []);
  return (
    <>
      <color attach="background" args={["#080c10"]} />
      <fog attach="fog" args={["#080c10", 24, 70]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 8, 7]} intensity={3} color="#e4edf3" />
      <directionalLight position={[-6, 3, -3]} intensity={2} color="#69bdcf" />
      <pointLight
        position={[3, 4, -28]}
        intensity={80}
        distance={20}
        color="#c8dcf0"
      />
      <pointLight
        position={[-4, 1, -34]}
        intensity={30}
        distance={14}
        color="#af9678"
      />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={3} position={[0, 5, -4]} scale={[12, 3, 1]} />
        <Lightformer
          intensity={2}
          color="#a8d2e1"
          position={[-5, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 4, 1]}
        />
      </Environment>
      {(phase === "INTRO" || phase === "LOADING") && <Core />}
      {(phase === "GATEWAY" || phase === "EXIT_TRANSITION") && (
        <AbstractField />
      )}
      {lab && (
        <group
          key={`${lab}-${generation}`}
          position={[0, 0, LAB_Z]}
          name="lab-stage"
        >
          <Suspense fallback={null}>
            {lab === "wonder" ? (
              <Wonder />
            ) : lab === "chip" ? (
              <Chip />
            ) : (
              <Robot />
            )}
            <ModelReady />
          </Suspense>
        </group>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, -18]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#0f1a22"
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>
      {quality === "high" && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.3} luminanceThreshold={1.15} mipmapBlur />
        </EffectComposer>
      )}
      <CameraDirector />
      <ClockAndDiagnostics />
      <Recovery />
    </>
  );
}
export default function World() {
  const quality = useExperience((s) => s.quality);
  return (
    <div className="world">
      <Canvas
        dpr={quality === "low" ? 1 : quality === "high" ? [1, 2] : [1, 1.35]}
        camera={{ position: [0, 0.6, 11], fov: 42, near: 0.05, far: 150 }}
        gl={{
          antialias: quality !== "low",
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <Content />
        </Suspense>
      </Canvas>
    </div>
  );
}
