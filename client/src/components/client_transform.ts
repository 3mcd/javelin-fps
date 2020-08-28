import { createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../../../common/types"

export const ClientTransform = createComponentType({
  type: ComponentTypes.ClientTransform,
  name: "client_transform",
  schema: {
    x: number,
    y: number,
    z: number,
    qx: number,
    qy: number,
    qz: number,
    qw: number,
  },
})
