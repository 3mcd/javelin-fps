import { createComponentFactory, number } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const ServerDetails = createComponentFactory(
  {
    type: ComponentTypes.ServerDetails,
    name: "server_info",
    schema: {
      tickRate: number,
      sendRate: number,
    },
  },
  (serverInfo, tickRate: number, sendRate: number) => {
    serverInfo.tickRate = tickRate
    serverInfo.sendRate = sendRate
  },
)
