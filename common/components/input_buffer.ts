import { array, createComponentFactory, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const InputBuffer = createComponentFactory({
  type: ComponentTypes.InputBuffer,
  name: "input_buffer",
  schema: {
    inputs: array(array(number)),
  },
})
