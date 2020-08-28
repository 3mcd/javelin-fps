import { query, World } from "@javelin/ecs"
import { ClientData, Player } from "../../../common"

const clientData = query(ClientData)

export const getClientData = (world: World) => {
  for (const [, [result]] of clientData(world)) {
    return result
  }

  return null
}

const players = query(Player)

export const getClientPlayer = (world: World) => {
  const clientData = getClientData(world)
  const { clientId } = clientData

  for (const [, [player]] of players(world)) {
    if (player.clientId === clientId) {
      return player
    }
  }

  return null
}
