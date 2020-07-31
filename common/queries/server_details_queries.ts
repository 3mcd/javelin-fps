import { World, query, select } from "@javelin/ecs"
import { ServerDetails } from "../components"

const serverDetails = query(select(ServerDetails))

export const getServerDetails = (world: World) => {
  for (const [result] of serverDetails(world)) {
    return result
  }

  return { tickRate: 0, sendRate: 0 }
}
