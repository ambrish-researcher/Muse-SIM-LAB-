import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { Subsystem } from "../engine/Subsystem";
import { Part, COLORS, Trace, Surface } from "../engine/materials";
import {
  Bearing,
  Ring,
  Cable,
  TaperedShell,
  GridChips,
} from "../engine/hardware";
import { useExperience } from "../experience/store";
import { useData } from "../experience/data";
import {
  solveFabrik,
  planSearch,
  editObstacle,
  type V3,
} from "../simulation/advanced";
import type { Vector } from "../construction/blueprints";
const down = new THREE.Vector3(0, -1, 0);
function Strut({
  length = 0.36,
  width = 0.12,
}: {
  length?: number;
  width?: number;
}) {
  return (
    <group position={[0, -length / 2, 0]}>
      {[-1, 1].map((s) => (
        <Part
          key={s}
          at={[s * width * 0.4, 0, 0]}
          size={[0.027, length * 0.86, width * 0.7]}
          color={COLORS.titanium}
        />
      ))}
      <Part
        size={[width * 0.46, length * 0.65, width * 0.55]}
        color="#26343f"
      />
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry
          args={[width * 0.19, width * 0.19, length * 0.66, 16]}
        />
        <Surface color="#667982" />
      </mesh>
      <Cable
        points={[
          [width * 0.55, length * 0.4, 0],
          [width * 0.62, 0, 0.015],
          [width * 0.55, -length * 0.4, 0],
        ]}
        width={1.5}
        color={COLORS.gold}
      />
    </group>
  );
}
function Finger({
  closed,
  segment = 0,
  order = 0,
}: {
  closed: boolean;
  segment?: number;
  order?: number;
}) {
  const length = segment === 2 ? 0.03 : 0.044;
  return (
    <group rotation={[closed ? 0.75 : 0.08, 0, 0]}>
      <Subsystem id="fingers" order={(order + segment) / 8}>
        <Part
          at={[0, -length / 2, 0]}
          size={[0.022, length * 0.9, 0.027]}
          color={segment === 1 ? "#647984" : COLORS.white}
        />
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.028, 10]} />
          <Surface color={COLORS.gold} />
        </mesh>
        <Part
          at={[0, -length * 0.55, 0.015]}
          size={[0.014, length * 0.5, 0.009]}
          color="#26333c"
        />
      </Subsystem>
      {segment < 2 && (
        <group position={[0, -length, 0]}>
          <Finger closed={closed} segment={segment + 1} order={order} />
        </group>
      )}
    </group>
  );
}
function Hand({ closed, order }: { closed: boolean; order: number }) {
  return (
    <>
      <Subsystem id="palms" order={order}>
        <Part
          at={[0, 0.04, 0]}
          size={[0.145, 0.14, 0.065]}
          color={COLORS.titanium}
        />
        <Part
          at={[0, 0.04, 0.038]}
          size={[0.11, 0.09, 0.014]}
          color="#23313a"
        />
        {[-1, 1].map((s) => (
          <Part
            key={s}
            at={[s * 0.06, 0.04, 0]}
            size={[0.014, 0.12, 0.08]}
            color={COLORS.white}
          />
        ))}
      </Subsystem>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[(i - 1.5) * 0.032, -0.025, 0]}>
          <Finger closed={closed} order={i + order} />
        </group>
      ))}
      <group
        position={[-0.09, 0.06, 0.015]}
        rotation={[closed ? 0.9 : 0.1, 0, -0.8]}
      >
        <Subsystem id="thumbs" order={order}>
          <Bearing radius={0.025} width={0.03} />
          <Part
            at={[0, -0.025, 0]}
            size={[0.027, 0.05, 0.03]}
            color={COLORS.white}
          />
        </Subsystem>
        <group position={[0, -0.05, 0]} rotation={[closed ? 0.7 : 0.15, 0, 0]}>
          <Subsystem id="thumbs" order={1}>
            <Part
              at={[0, -0.025, 0]}
              size={[0.025, 0.05, 0.028]}
              color={COLORS.titanium}
            />
          </Subsystem>
        </group>
      </group>
      <Subsystem id="grasp" order={order}>
        <Ring
          radius={0.07}
          thickness={0.004}
          at={[0, -0.04, 0.025]}
          color={closed ? COLORS.gold : COLORS.cyan}
        />
      </Subsystem>
    </>
  );
}
function Leg({
  side,
  jointRef,
}: {
  side: number;
  jointRef: RefObject<THREE.Group>;
}) {
  const knee = useRef<THREE.Group>(null!);
  useFrame(() => {
    knee.current.rotation.x = Math.max(0, -jointRef.current.rotation.x) * 1.5;
  });
  return (
    <group ref={jointRef} position={[side * 0.19, 1.03, 0]}>
      <Subsystem id={side === 1 ? "hip-right" : "hip-left"}>
        <Bearing radius={0.12} width={0.19} />
        <Part at={[0, 0.04, 0]} size={[0.16, 0.12, 0.2]} color="#536471" />
      </Subsystem>
      <Subsystem id="thighs" order={side === 1 ? 1 : 0}>
        <Strut length={0.4} width={0.17} />
      </Subsystem>
      <Subsystem id="shell" at={[0, -0.19, 0.085]} order={side === 1 ? 1 : 0}>
        <TaperedShell
          width={0.17}
          height={0.27}
          depth={0.045}
          color={COLORS.titanium}
        />
      </Subsystem>
      <group ref={knee} position={[0, -0.4, 0]}>
        <Subsystem id="knees" order={side === 1 ? 1 : 0}>
          <Bearing radius={0.095} width={0.18} />
          <Part
            at={[0, 0, 0.095]}
            size={[0.14, 0.16, 0.06]}
            color={COLORS.white}
          />
        </Subsystem>
        <Subsystem id="shins" order={side === 1 ? 1 : 0}>
          <Strut length={0.41} width={0.13} />
        </Subsystem>
        <Subsystem id="shell" at={[0, -0.19, 0.06]} order={side === 1 ? 1 : 0}>
          <TaperedShell
            width={0.115}
            height={0.29}
            depth={0.03}
            color={COLORS.white}
          />
        </Subsystem>
        <group position={[0, -0.41, 0]}>
          <Subsystem id="ankles" order={side === 1 ? 1 : 0}>
            <Bearing radius={0.06} width={0.14} />
            <Part
              at={[0, -0.04, 0]}
              size={[0.11, 0.07, 0.13]}
              color="#35454e"
            />
          </Subsystem>
          <Subsystem id="feet" at={[0, -0.08, 0.08]} order={side === 1 ? 1 : 0}>
            <Part size={[0.2, 0.08, 0.37]} color="#647681" />
            <Part
              at={[0, -0.04, 0.005]}
              size={[0.21, 0.026, 0.38]}
              color="#19242c"
            />
            {[-1, 1].map((s) => (
              <Part
                key={s}
                at={[s * 0.072, 0.047, 0.03]}
                size={[0.025, 0.015, 0.22]}
                color={COLORS.gold}
              />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <Part
                key={i}
                at={[0, -0.057, (i - 3) * 0.05]}
                size={[0.19, 0.009, 0.015]}
                color="#45545c"
              />
            ))}
          </Subsystem>
        </group>
      </group>
    </group>
  );
}
function Arm({
  side,
  target,
  closed,
}: {
  side: number;
  target: V3;
  closed: boolean;
}) {
  const joint = useData((s) => s.joint),
    elbow = useData((s) => s.elbow);
  const solved = useMemo(
    () =>
      solveFabrik(
        [
          [0.43, 1.47, 0],
          [0.43, 1.08, 0],
          [0.43, 0.7, 0],
        ],
        target,
      ),
    [target],
  );
  const upper = new THREE.Quaternion().setFromUnitVectors(
    down,
    new THREE.Vector3(...solved.points[1])
      .sub(new THREE.Vector3(...solved.points[0]))
      .normalize(),
  );
  const lower = new THREE.Quaternion().setFromUnitVectors(
    down,
    new THREE.Vector3(...solved.points[2])
      .sub(new THREE.Vector3(...solved.points[1]))
      .normalize(),
  );
  const localLower = upper.clone().invert().multiply(lower),
    right = side === 1,
    order = right ? 1 : 0;
  return (
    <group
      position={[side * 0.43, 1.47, 0]}
      quaternion={right ? upper : undefined}
      rotation={right ? undefined : [THREE.MathUtils.degToRad(joint), 0, -0.12]}
    >
      <Subsystem id="shoulders" order={order}>
        <Bearing radius={0.115} width={0.2} />
        <Ring
          radius={0.13}
          thickness={0.015}
          rotation={[0, Math.PI / 2, 0]}
          color={COLORS.titanium}
        />
      </Subsystem>
      <Subsystem id="upperarms" order={order}>
        <Strut length={0.39} width={0.13} />
      </Subsystem>
      <Subsystem id="shell" at={[side * 0.025, -0.18, 0.075]} order={order}>
        <TaperedShell
          width={0.14}
          height={0.23}
          depth={0.035}
          color={COLORS.white}
        />
      </Subsystem>
      <Subsystem id="calibration" order={order}>
        <Ring
          radius={0.14}
          thickness={0.005}
          rotation={[0, Math.PI / 2, 0]}
          color={COLORS.gold}
        />
      </Subsystem>
      <group
        position={[0, -0.39, 0]}
        quaternion={right ? localLower : undefined}
        rotation={right ? undefined : [-THREE.MathUtils.degToRad(elbow), 0, 0]}
      >
        <Subsystem id="elbows" order={order}>
          <Bearing radius={0.075} width={0.14} />
        </Subsystem>
        <Subsystem id="forearms" order={order}>
          <Strut length={0.38} width={0.12} />
        </Subsystem>
        <Subsystem id="wiring" order={order}>
          <Cable
            points={[
              [0.08, -0.03, 0],
              [0.09, -0.15, -0.03],
              [0.07, -0.33, 0],
            ]}
            color={COLORS.cyan}
          />
        </Subsystem>
        <group
          position={[0, -0.38, 0]}
          quaternion={right ? lower.clone().invert() : undefined}
        >
          <Subsystem id="wrists" order={order}>
            <Bearing radius={0.045} width={0.105} />
            <Part
              at={[0, -0.025, 0]}
              size={[0.1, 0.06, 0.075]}
              color="#455661"
            />
          </Subsystem>
          <Hand closed={closed && right} order={order} />
          <Subsystem id="ik" order={order}>
            <Ring
              at={[0, 0, 0.02]}
              radius={0.09}
              thickness={0.003}
              color={COLORS.violet}
            />
          </Subsystem>
        </group>
      </group>
    </group>
  );
}
export default function RobotModel() {
  const r = useData((s) => s.robot),
    complete = useExperience((s) => s.buildComplete),
    count = useExperience((s) => s.buildCount),
    flow = useExperience((s) => s.flow);
  const body = useRef<THREE.Group>(null!),
    gaitPhase = useRef(0),
    gait = useRef(0);
  const world = useRef<THREE.Group>(null!);
  const editWorld = (point: THREE.Vector3) => {
    if (!useExperience.getState().buildComplete) return;
    const local = world.current.worldToLocal(point.clone()),
      d = useData.getState();
    d.set({
      robot: editObstacle(d.robot, [
        Math.round(local.x / 0.7 + 3.5),
        Math.round(local.z / 0.7 + 3.5),
      ]),
    });
  };
  const left = useRef<THREE.Group>(null!),
    right = useRef<THREE.Group>(null!);
  const moving = /NAVIGATE/.test(r.phase),
    held = r.objectState === "held";
  const target: V3 =
    r.phase === "REACH"
      ? [0.43 - 0.04 * r.reach, 0.67 + 0.07 * r.reach, 0.08 + 0.17 * r.reach]
      : r.phase === "PLACE"
        ? [0.4, 0.75 + 0.25 * r.reach, 0.25 + 0.1 * r.reach]
        : r.phase === "GRASP" || r.phase === "VERIFY_GRASP"
          ? [0.39, 0.74, 0.25]
          : held
            ? [0.4, 1, 0.35]
            : [0.43, 0.7, 0];
  const solved = useMemo(
    () =>
      solveFabrik(
        [
          [0.43, 1.47, 0],
          [0.43, 1.08, 0],
          [0.43, 0.7, 0],
        ],
        target,
      ),
    [target],
  );
  const search = useMemo(
    () => planSearch(r.cell, r.goal, new Set(r.blocked)),
    [r.cell, r.goal, r.blocked],
  );
  useFrame((_, dt) => {
    const s = useExperience.getState(),
      rate = s.reduced ? 100 : 8;
    const px = complete ? (r.cell[0] - 3.5) * 0.7 : 0,
      pz = complete ? (r.cell[1] - 3.5) * 0.7 : 0;
    body.current.position.x = THREE.MathUtils.damp(
      body.current.position.x,
      px,
      rate,
      dt,
    );
    body.current.position.z = THREE.MathUtils.damp(
      body.current.position.z,
      pz,
      rate,
      dt,
    );
    if (moving) gaitPhase.current += dt * 7;
    gait.current = THREE.MathUtils.damp(
      gait.current,
      moving && !s.reduced ? 0.2 : 0,
      8,
      dt,
    );
    left.current.rotation.x = Math.sin(gaitPhase.current) * gait.current;
    right.current.rotation.x = -Math.sin(gaitPhase.current) * gait.current;
  });
  return (
    <group ref={world} position={[0, -1.35, 0]}>
      <group ref={body} name="robot-root">
        <Subsystem id="pelvis" at={[0, 1.1, 0]}>
          <Part size={[0.46, 0.2, 0.29]} color="#465661" />
          {[-1, 1].map((s) => (
            <Part
              key={s}
              at={[s * 0.21, -0.015, 0]}
              size={[0.045, 0.25, 0.24]}
              color={COLORS.titanium}
            />
          ))}
          <Ring
            radius={0.13}
            thickness={0.024}
            at={[0, 0.12, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            color={COLORS.gold}
          />
        </Subsystem>
        <Subsystem id="torso" at={[0, 1.45, 0]}>
          <Part
            at={[0, 0, -0.075]}
            size={[0.075, 0.53, 0.11]}
            color={COLORS.titanium}
          />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Part
                at={[s * 0.22, 0.04, 0]}
                size={[0.045, 0.43, 0.18]}
                color="#536675"
              />
              {[0, 1, 2, 3].map((i) => (
                <Part
                  key={i}
                  at={[0, i * 0.11 - 0.13, 0]}
                  size={[0.48, 0.025, 0.2]}
                  color="#70818d"
                />
              ))}
            </group>
          ))}
          <Part at={[0, 0, -0.14]} size={[0.32, 0.3, 0.045]} color="#203f43" />
          <GridChips rows={3} cols={3} spacing={0.07} at={[0, 0.19, 0.02]} />
        </Subsystem>
        <Leg side={-1} jointRef={left} />
        <Leg side={1} jointRef={right} />
        <Arm side={-1} target={target} closed={false} />
        <Arm
          side={1}
          target={target}
          closed={held || r.phase === "GRASP" || r.phase === "VERIFY_GRASP"}
        />
        <group position={[0, 1.79, 0]}>
          <Subsystem id="neck">
            <Bearing radius={0.065} width={0.12} />
            {[-1, 1].map((s) => (
              <Part
                key={s}
                at={[s * 0.075, 0.06, 0]}
                size={[0.022, 0.14, 0.11]}
                color={COLORS.titanium}
              />
            ))}
          </Subsystem>
          <group position={[0, 0.18, 0]}>
            <Subsystem id="head">
              <TaperedShell
                width={0.31}
                height={0.27}
                depth={0.24}
                color={COLORS.white}
              />
              <Part
                at={[0, 0.015, 0.128]}
                size={[0.265, 0.11, 0.024]}
                color="#12222b"
              />
              {[-1, 1].map((s) => (
                <group key={s}>
                  {[0, 1, 2, 3].map((i) => (
                    <Part
                      key={i}
                      at={[s * 0.16, i * 0.025 - 0.04, 0]}
                      size={[0.015, 0.009, 0.12]}
                      color="#273e4a"
                    />
                  ))}
                </group>
              ))}
            </Subsystem>
            <Subsystem id="sensors">
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.075, 0.02, 0.15]}>
                  <Ring
                    radius={0.033}
                    thickness={0.006}
                    color={COLORS.titanium}
                  />
                  <mesh>
                    <circleGeometry args={[0.027, 24]} />
                    <meshStandardMaterial
                      color="#12303e"
                      emissive={COLORS.cyan}
                      emissiveIntensity={0.5}
                      metalness={0.9}
                      roughness={0.05}
                    />
                  </mesh>
                </group>
              ))}
              <Part
                at={[0, -0.037, 0.15]}
                size={[0.025, 0.018, 0.012]}
                color={COLORS.gold}
                active
              />
            </Subsystem>
            <Subsystem id="perception">
              <Line
                points={[
                  [0, 0, 0.17],
                  [-0.8, -1.3, 1.4],
                  [0.8, -1.3, 1.4],
                  [0, 0, 0.17],
                ]}
                color={r.targetPresent ? "#538b88" : COLORS.amber}
                lineWidth={1}
              />
            </Subsystem>
          </group>
        </group>
        <Subsystem id="actuators" at={[0, 1.3, -0.12]}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.15, 0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.055, 0.055, 0.2, 20]} />
                <Surface color="#53616f" />
              </mesh>
              {[-1, 0, 1].map((j) => (
                <Ring
                  key={j}
                  radius={0.06}
                  thickness={0.008}
                  at={[0, j * 0.06, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  color={COLORS.gold}
                />
              ))}
            </group>
          ))}
        </Subsystem>
        <Subsystem id="wiring" at={[0, 1.47, -0.16]}>
          <Part size={[0.29, 0.32, 0.075]} color="#22373d" />
          {[-1, 1].map((s) => (
            <Cable
              key={s}
              points={[
                [s * 0.12, 0.12, 0],
                [s * 0.25, 0.04, 0],
                [s * 0.24, -0.2, -0.01],
                [s * 0.18, -0.3, 0.02],
              ]}
              color={s === 1 ? COLORS.gold : COLORS.cyan}
              width={2}
            />
          ))}
          <GridChips rows={3} cols={3} spacing={0.055} at={[0, 0.18, 0.025]} />
        </Subsystem>
        <Subsystem id="shell" at={[0, 1.47, 0.13]}>
          <TaperedShell
            width={0.56}
            height={0.43}
            depth={0.09}
            color={COLORS.white}
          />
          <Part
            at={[0, 0.02, 0.061]}
            size={[0.29, 0.04, 0.015]}
            color="#24343d"
          />
          <Part
            at={[0, 0.02, 0.075]}
            size={[0.15, 0.009, 0.008]}
            color={COLORS.cyan}
            active
          />
          {[-1, 1].flatMap((s) =>
            [0, 1, 2].map((i) => (
              <Part
                key={`${s}${i}`}
                at={[s * 0.18, -0.08 + i * 0.027, 0.06]}
                size={[0.08, 0.01, 0.012]}
                color="#344a55"
              />
            )),
          )}
        </Subsystem>
        <Subsystem id="assembly" at={[0, 1.08, 0.16]}>
          <Part size={[0.18, 0.065, 0.018]} color={COLORS.titanium} />
          <Part
            at={[0, 0, 0.015]}
            size={[0.11, 0.008, 0.005]}
            color={COLORS.gold}
            active
          />
        </Subsystem>
        <Subsystem id="autonomy" at={[0, 1.5, -0.23]}>
          <Part size={[0.19, 0.23, 0.055]} color="#223f4c" />
          {[0, 1, 2, 3].map((i) => (
            <Part
              key={i}
              at={[-0.055 + i * 0.035, 0.05, -0.04]}
              size={[0.015, 0.08, 0.012]}
              color={r.phase === "COMPLETE" ? COLORS.gold : COLORS.cyan}
              active
            />
          ))}
        </Subsystem>
        {held && (
          <mesh
            position={[
              solved.points[2][0],
              solved.points[2][1] - 0.025,
              solved.points[2][2] + 0.02,
            ]}
            name="held-object"
          >
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <Surface color={COLORS.cyan} />
          </mesh>
        )}
      </group>
      <Subsystem id="mapping">
        <gridHelper args={[5.6, 8, "#456c76", "#203a47"]} />
        <mesh
          position={[0, -0.055, 0]}
          onClick={(e) => {
            e.stopPropagation();
            editWorld(e.point);
          }}
        >
          <boxGeometry args={[5.6, 0.08, 5.6]} />
          <Surface color="#15242d" />
        </mesh>
        {r.blocked.map((key) => {
          const [x, z] = key.split(",").map(Number);
          return (
            <group
              key={key}
              position={[(x - 3.5) * 0.7, 0.25, (z - 3.5) * 0.7]}
              onClick={(e) => {
                e.stopPropagation();
                const d = useData.getState();
                d.set({ robot: editObstacle(d.robot, [x, z]) });
              }}
            >
              <Part size={[0.56, 0.5, 0.56]} color="#3c4d59" />
              <Part
                at={[0, 0.26, 0]}
                size={[0.45, 0.012, 0.45]}
                color="#7f7564"
              />
            </group>
          );
        })}
        {[r.target, r.delivery].map((cell, i) => (
          <group
            key={i}
            position={[
              (cell[0] - 3.5) * 0.7 + 0.4,
              0.35,
              (cell[1] - 3.5) * 0.7 + 0.25,
            ]}
          >
            <Part
              size={[0.36, 0.05, 0.36]}
              at={[0, 0.35, 0]}
              color={i === 0 ? "#627481" : "#a68c62"}
            />
            {[-1, 1].map((s) => (
              <Part
                key={s}
                at={[s * 0.13, 0, 0]}
                size={[0.027, 0.7, 0.22]}
                color="#3a505e"
              />
            ))}
          </group>
        ))}
        {!held && r.targetPresent && (
          <mesh
            name="world-object"
            position={[
              ((r.objectState === "placed" ? r.delivery : r.target)[0] - 3.5) *
                0.7 +
                0.4,
              0.75,
              ((r.objectState === "placed" ? r.delivery : r.target)[1] - 3.5) *
                0.7 +
                0.25,
            ]}
          >
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <Surface
              color={r.objectState === "placed" ? COLORS.gold : COLORS.cyan}
            />
          </mesh>
        )}
      </Subsystem>
      <Subsystem id="astar">
        <group
          onClick={(e) => {
            e.stopPropagation();
            editWorld(e.point);
          }}
        >
          {search.visited.map((c, i) => (
            <Part
              key={i}
              at={[(c[0] - 3.5) * 0.7, 0.005, (c[1] - 3.5) * 0.7]}
              size={[0.62, 0.008, 0.62]}
              color="#284d53"
            />
          ))}
          {search.path.length > 1 && (
            <Line
              points={search.path.map(
                (c) =>
                  [(c[0] - 3.5) * 0.7, 0.035, (c[1] - 3.5) * 0.7] as Vector,
              )}
              color={COLORS.cyan}
              lineWidth={3}
            />
          )}
        </group>
      </Subsystem>
      <Subsystem id="replanning">
        {r.blocked.map((key) => {
          const [x, z] = key.split(",").map(Number);
          return (
            <Ring
              key={key}
              at={[(x - 3.5) * 0.7, 0.52, (z - 3.5) * 0.7]}
              radius={0.19}
              thickness={0.007}
              rotation={[-Math.PI / 2, 0, 0]}
              color={r.replans ? COLORS.amber : COLORS.gold}
            />
          );
        })}
      </Subsystem>
      <Subsystem
        id="grasp"
        at={[
          (r.delivery[0] - 3.5) * 0.7 + 0.4,
          0.74,
          (r.delivery[1] - 3.5) * 0.7 + 0.25,
        ]}
      >
        <Ring
          radius={0.22}
          thickness={0.008}
          rotation={[-Math.PI / 2, 0, 0]}
          color={r.objectState === "placed" ? COLORS.gold : COLORS.violet}
        />
      </Subsystem>
      {count === 32 && flow && (
        <Trace
          at={[0, 0.03, 2.8]}
          length={5}
          rotation={[-Math.PI / 2, 0, 0]}
          activity={r.phase === "COMPLETE" ? 1 : 0.25}
        />
      )}
    </group>
  );
}
