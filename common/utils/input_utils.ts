import { Topic, World } from "@javelin/ecs"
import { Quaternion, Vec3 } from "cannon-es"
import { Transform } from "../components"
import { jump, move, PhysicsCommand, rotate } from "../topics"

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
  const [up, right, down, left, _jump, pointerX, pointerY] = input
  const lon = up - down
  const lat = right - left
  const tnrasform = world.getComponent(entity, Transform)

  if (lon || lat) {
    topic.pushImmediate(move(entity, lat * 0.5, lon * 0.5))
  }

  if (tnrasform.grounded && _jump) {
    topic.pushImmediate(jump(entity, 2))
  }

  tmpQuatLat.setFromAxisAngle(AXIS_X, pointerY)
  tmpQuatLon.setFromAxisAngle(AXIS_Z, pointerX)
  const { x: qx, y: qy, z: qz, w: qw } = tmpQuatLon.mult(tmpQuatLat).normalize()

  topic.pushImmediate(rotate(entity, qx, qy, qz, qw))
}
