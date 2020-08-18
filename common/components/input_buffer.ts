import { array, boolean, createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const InputBuffer = createComponentType({
  type: ComponentTypes.InputBuffer,
  name: "input_buffer",
  schema: {
    inputs: array(array(number)),
    buffering: boolean,
    targetInputBufferLength: { defaultValue: 2, type: number },
    lastBufferGrow: number,
    lastBufferShrink: number,
    lastInput: array(number),
  },
})
