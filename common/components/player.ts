import {
  array,
  createComponentFactory,
  number,
  string,
  boolean,
} from "@javelin/ecs"
import { ComponentTypes } from "../types"

export const Player = createComponentFactory(
  {
    type: ComponentTypes.Player,
    name: "player",
    schema: {
      actorEntity: { defaultValue: -1, type: number },
      clientId: string,
    },
  },
  (player, clientId: string, actorEntity: number) => {
    player.clientId = clientId
    player.actorEntity = actorEntity
  },
)
