import { array, createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../../../common/types"

export const InterpolatedTransform = createComponentType({
  type: ComponentTypes.InterpolatedTransform,
  name: "interpolated_transform",
  schema: {
    x: number,
    y: number,
    z: number,
    qx: number,
    qy: number,
    qz: number,
    qw: number,
    buffer: array(array(number)),
  },
})
