import { PhysicsCommand, accelerate } from "../topics"
import { Topic } from "@javelin/ecs"

export const dispatchPhysicsCommandsFromInput = (
  input: number[],
  entity: number,
  topic: Topic<PhysicsCommand>,
) => {
  const [up, right, down, left, jump] = input
  const lon = up - down
  const lat = right - left

  if (lon) {
    topic.pushImmediate(accelerate(entity, 0, lon * 0.5, 0))
  }

  if (lat) {
    topic.pushImmediate(accelerate(entity, lat * 0.5, 0, 0))
  }

  if (jump) {
    topic.pushImmediate(accelerate(entity, 0, 0, 1))
  }
}
