import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BLUEPRINTS,
  INITIAL_HOLD,
  stageDuration,
  type Vector,
} from "../construction/blueprints";
import { constructionClock, useExperience } from "../experience/store";
import { SubsystemContext } from "./subsystem-context";
import { Label3D } from "./materials";

/** Future parts are not mounted. Empty joint transforms may pre-exist. */
export function Subsystem({
  id,
  at = [0, 0, 0],
  children,
  order = 0,
  explode = 0,
}: {
  id: string;
  at?: Vector;
  children: ReactNode;
  order?: number;
  explode?: number;
}) {
  const lab = useExperience((s) => s.lab)!;
  const index = BLUEPRINTS[lab].findIndex((p) => p.id === id);
  const introduced = useExperience((s) => s.buildCount > index);
  return introduced ? (
    <AttachedPart id={id} index={index} at={at} order={order} explode={explode}>
      {children}
    </AttachedPart>
  ) : null;
}
function AttachedPart({
  id,
  index,
  at,
  children,
  order,
  explode,
}: {
  id: string;
  index: number;
  at: Vector;
  children: ReactNode;
  order: number;
  explode: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  const labelAnchor = useRef<THREE.Group>(null!);
  const isolated = useExperience((s) => s.isolated),
    selected = useExperience((s) => s.selected);
  const showLabel = useExperience(
    (s) => s.selected === id && (s.phase === "CONSTRUCTION" || s.labels),
  );
  const lab = useExperience((s) => s.lab)!;
  const part = BLUEPRINTS[lab][index];
  useFrame(({ camera, size }) => {
    const s = useExperience.getState(),
      duration = stageDuration(s.reduced);
    const raw =
      (constructionClock.elapsed - INITIAL_HOLD - index * duration) / duration;
    const t = s.buildComplete
      ? 1
      : THREE.MathUtils.clamp((raw - order * 0.14) / 0.83, 0, 1);
    const align = s.reduced ? 1 : 1 - Math.pow(1 - t, 3);
    const direction = index % 2 === 0 ? 1 : -1;
    const robotSpread = lab === "robot" && index < 25 ? s.explode : 0;
    const armOrLeg =
      /hip-|thighs|knees|shins|ankles|feet|shoulders|upperarms|elbows|forearms|wrists|palms|fingers|thumbs/.test(
        id,
      );
    ref.current.position.set(
      at[0] +
        direction * (1 - align) * 1.7 +
        (armOrLeg ? (order > 0.4 ? 1 : -1) * robotSpread * 0.3 : 0),
      at[1] +
        (1 - align) * 1.25 +
        s.explode * explode +
        (id === "head" || id === "neck" || id === "sensors"
          ? robotSpread * 0.55
          : 0),
      at[2] +
        (1 - align) * 0.8 +
        (id === "shell"
          ? robotSpread * 0.45
          : id === "wiring" || id === "actuators"
            ? -robotSpread * 0.35
            : 0),
    );
    ref.current.rotation.set(
      (1 - align) * 0.45,
      (1 - align) * direction * 0.7,
      (1 - align) * direction * 0.3,
    );
    if (labelAnchor.current) {
      const anchor = labelAnchor.current;
      anchor.position.set(0, s.phase === "CONSTRUCTION" ? 0.5 : 0.3, 0.25);
      anchor.updateWorldMatrix(true, false);
      const world = anchor.getWorldPosition(new THREE.Vector3());
      const projected = world.clone().project(camera);
      const depth = -world.applyMatrix4(camera.matrixWorldInverse).z;
      if (s.phase === "CONSTRUCTION" && depth > 0) {
        // Keep the name readable while its component enters outside the view.
        // Only the label moves; the model and cinematic camera are untouched.
        const halfWidth = (1.05 * camera.projectionMatrix.elements[0]) / depth;
        const halfHeight =
          (0.1953 * camera.projectionMatrix.elements[5]) / depth;
        const horizontal = Math.max(0, 1 - halfWidth - 24 / size.width);
        const vertical = Math.max(0, 1 - halfHeight - 240 / size.height);
        const panel = document
          .querySelector('aside[aria-label="Lab controls and explanation"]')
          ?.getBoundingClientRect();
        const left =
          panel && panel.width < size.width / 2
            ? Math.min(
                horizontal,
                (2 * (panel.right + 12)) / size.width - 1 + halfWidth,
              )
            : -horizontal;
        projected.x = THREE.MathUtils.clamp(projected.x, left, horizontal);
        projected.y = THREE.MathUtils.clamp(projected.y, -vertical, vertical);
        anchor.position.copy(
          ref.current.worldToLocal(projected.unproject(camera)),
        );
      }
    }
    ref.current.userData = {
      componentId: id,
      componentName: part.name,
      attached: t >= 1,
      constructionPart: true,
    };
  });
  return (
    <group
      ref={ref}
      name={`component:${id}`}
      visible={!isolated || selected === id}
      onClick={(e) => {
        e.stopPropagation();
        useExperience.getState().patch({ selected: id });
      }}
    >
      <SubsystemContext.Provider value={id}>
        {children}
      </SubsystemContext.Provider>
      {showLabel && order === 0 && (
        <group ref={labelAnchor}>
          <Label3D at={[0, 0, 0]} text={part.name} />
        </group>
      )}
    </group>
  );
}
