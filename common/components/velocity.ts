import { createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Velocity = createComponentType({
  type: ComponentTypes.Velocity,
  name: "velocity",
  schema: {
    x: number,
    y: number,
    z: number,
    ax: number,
    ay: number,
    az: number,
  },
  initialize: (velocity, x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0) => {
    velocity.x = x
    velocity.y = y
    velocity.z = z
    velocity.x = vx
    velocity.y = vy
    velocity.z = vz
  },
})
