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
  initialize: (
    clientTransform,
    x: number = 0,
    y: number = 0,
    z: number = 0,
    qx: number = 0,
    qy: number = 0,
    qz: number = 0,
    qw: number = 1,
  ) => {
    clientTransform.x = x
    clientTransform.y = y
    clientTransform.z = z
    clientTransform.qx = qx
    clientTransform.qy = qy
    clientTransform.qz = qz
    clientTransform.qw = qw
  },
})
