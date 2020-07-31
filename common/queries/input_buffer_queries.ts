import { query, select, World } from "@javelin/ecs"
import { InputBuffer } from "../components"

const inputBuffers = query(select(InputBuffer))

export const getInputBuffer = (world: World) => {
  for (const [result] of inputBuffers(world)) {
    return result
  }

  return null
}
