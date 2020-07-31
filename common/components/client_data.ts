import { createComponentFactory, number, string } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const ClientData = createComponentFactory(
  {
    type: ComponentTypes.ClientData,
    name: "client_data",
    schema: {
      clientId: string,
      serverLastProcessedInput: number,
      playerEntityLocal: number,
    },
  },
  (clientData, clientId: string) => {
    clientData.clientId = clientId
  },
)
