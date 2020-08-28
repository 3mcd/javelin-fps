import { boolean, createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Body = createComponentType({
  type: ComponentTypes.Body,
  name: "body",
  schema: {
    x: number,
    y: number,
    z: number,
    qx: number,
    qy: number,
    qz: number,
    qw: { type: number, defaultValue: 1 },
    vx: number,
    vy: number,
    vz: number,
    avx: number,
    avy: number,
    avz: number,
    grounded: boolean,
  },
  initialize: (body, x = 0, y = 0, z = 0) => {
    body.x = x
    body.y = y
    body.z = z
  },
})
