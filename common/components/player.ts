import { createComponentType, number, string } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Player = createComponentType({
  type: ComponentTypes.Player,
  name: "player",
  schema: {
    actorEntity: { defaultValue: -1, type: number },
    clientId: string,
  },
  initialize: (player, clientId: string, actorEntity: number) => {
    player.clientId = clientId
    player.actorEntity = actorEntity
  },
})
