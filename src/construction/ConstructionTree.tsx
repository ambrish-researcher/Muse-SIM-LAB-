import type { ReactNode } from "react";
import { BLUEPRINTS, type ConstructionPart, type Vector } from "./blueprints";
import type { LabId } from "../simulation";
import { Subsystem } from "../engine/Subsystem";
/** Real parent-relative anchor hierarchy. A child's unoccupied anchor is not geometry. */
export function ConstructionTree({
  lab,
  render,
  explode,
}: {
  lab: LabId;
  render: (part: ConstructionPart, index: number) => ReactNode;
  explode?: (part: ConstructionPart) => number;
}) {
  const parts = BLUEPRINTS[lab];
  const node = (part: ConstructionPart): ReactNode => {
    const parent = parts.find((p) => p.id === part.parent);
    const local = part.target.map(
      (v, i) => v - (parent?.target[i] ?? 0),
    ) as Vector;
    return (
      <group key={part.id} name={`anchor:${part.id}`} position={local}>
        <Subsystem id={part.id} explode={explode?.(part) ?? 0}>
          {render(part, parts.indexOf(part))}
        </Subsystem>
        {parts.filter((p) => p.parent === part.id).map(node)}
      </group>
    );
  };
  return <>{parts.filter((p) => !p.parent).map(node)}</>;
}
