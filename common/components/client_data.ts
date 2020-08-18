import { createComponentType, number, string } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const ClientData = createComponentType({
  type: ComponentTypes.ClientData,
  name: "client_data",
  schema: {
    clientId: string,
    serverLastProcessedInput: number,
    playerEntityLocal: number,
  },
  initialize: (clientData, clientId: string) => {
    clientData.clientId = clientId
  },
})
