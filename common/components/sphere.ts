import { createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Sphere = createComponentType({
  type: ComponentTypes.Sphere,
  name: "sphere",
  schema: {
    radius: number,
  },
  initialize: (velocity, radius = 0.5) => {
    velocity.radius = radius
  },
})
