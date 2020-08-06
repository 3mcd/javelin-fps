import { array, boolean, createComponentFactory, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const InputBuffer = createComponentFactory({
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
