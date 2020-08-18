import { query, World } from "@javelin/ecs"
import { InputBuffer } from "../components"

const inputBuffers = query(InputBuffer)

export const getInputBuffer = (world: World) => {
  for (const [, [result]] of inputBuffers(world)) {
    return result
  }

  return null
}
