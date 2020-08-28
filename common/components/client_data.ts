import { createComponentType, number, string } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const ClientData = createComponentType({
  type: ComponentTypes.ClientData,
  name: "client_data",
  schema: {
    clientId: string,
    serverLastProcessedInput: number,
    playerEntityLocal: { type: number, defaultValue: -1 },
  },
  initialize: (clientData, clientId: string) => {
    clientData.clientId = clientId
  },
})
