import { createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Box = createComponentType({
  type: ComponentTypes.Box,
  name: "box",
  schema: {
    width: number,
    height: number,
    depth: number,
  },
  initialize: (
    box,
    width: number = 1,
    height: number = 1,
    depth: number = 1,
  ) => {
    box.width = width
    box.height = height
    box.depth = depth
  },
})
