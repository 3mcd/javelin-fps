import { PhysicsCommand, accelerate, rotate } from "../topics"
import { Topic, World } from "@javelin/ecs"
import { Vec3, Quaternion } from "cannon-es"
import { MovementState } from "../components"

const AXIS_X = new Vec3(1, 0, 0)
const AXIS_Z = new Vec3(0, 0, 1)

const tmpQuatLat = new Quaternion()
const tmpQuatLon = new Quaternion()

export const dispatchPhysicsCommandsFromInput = (
  input: number[],
  entity: number,
  topic: Topic<PhysicsCommand>,
  world: World,
) => {
  // const movementState = world.getComponent(entity, MovementState)
  const [up, right, down, left, jump, pointerX, pointerY] = input
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

  tmpQuatLat.setFromAxisAngle(AXIS_X, pointerY)
  tmpQuatLon.setFromAxisAngle(AXIS_Z, pointerX)
  const { x: qx, y: qy, z: qz, w: qw } = tmpQuatLon.mult(tmpQuatLat).normalize()

  topic.pushImmediate(rotate(entity, qx, qy, qz, qw))
}
