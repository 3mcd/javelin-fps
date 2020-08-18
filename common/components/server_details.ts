import { createComponentType, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const ServerDetails = createComponentType({
  type: ComponentTypes.ServerDetails,
  name: "server_info",
  schema: {
    tickRate: number,
    sendRate: number,
  },
  initialize: (serverInfo, tickRate: number, sendRate: number) => {
    serverInfo.tickRate = tickRate
    serverInfo.sendRate = sendRate
  },
})
