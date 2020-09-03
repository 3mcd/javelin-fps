import { boolean, createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Transform = createComponentType({
  type: ComponentTypes.Transform,
  name: "transform",
  schema: {
    x: number,
    y: number,
    z: number,
    qx: number,
    qy: number,
    qz: number,
    qw: { type: number, defaultValue: 1 },
    grounded: boolean,
  },
  initialize: (
    transform,
    x: number = 0,
    y: number = 0,
    z: number = 0,
    qx: number = 0,
    qy: number = 0,
    qz: number = 0,
    qw: number = 1,
  ) => {
    transform.x = x
    transform.y = y
    transform.z = z
    transform.qx = qx
    transform.qy = qy
    transform.qz = qz
    transform.qw = qw
  },
})
