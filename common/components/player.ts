import { array, createComponentFactory, number, string } from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Player = createComponentFactory(
  {
    type: ComponentTypes.Player,
    name: "player",
    schema: {
      actorEntity: { defaultValue: -1, type: number },
      clientId: string,
      inputs: array(array(number)),
      lastInput: array(number),
    },
  },
  (player, clientId: string, actorEntity: number) => {
    player.clientId = clientId
    player.actorEntity = actorEntity
  },
)
