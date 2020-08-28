import { array, createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../../../common/types"

export const InterpolationBuffer = createComponentType({
  type: ComponentTypes.InterpolationBuffer,
  name: "interpolation_buffer",
  schema: {
    buffer: array(array(number)),
  },
})
