import { createComponentFactory, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Body = createComponentFactory({
  type: ComponentTypes.Body,
  name: "body",
  schema: {
    x: number,
    y: number,
    z: number,
    qx: number,
    qy: number,
    qz: number,
    qw: number,
    vx: number,
    vy: number,
    vz: number,
    avx: number,
    avy: number,
    avz: number,
  },
})
