import { createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Mass = createComponentType({
  type: ComponentTypes.Mass,
  name: "mass",
  schema: {
    value: number,
  },
  initialize: (mass, value: number = 0) => {
    mass.value = value
  },
})
