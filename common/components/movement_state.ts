import { boolean, createComponentFactory } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const MovementState = createComponentFactory({
  type: ComponentTypes.MovementState,
  name: "movement_state",
  schema: {
    grounded: boolean,
  },
})
