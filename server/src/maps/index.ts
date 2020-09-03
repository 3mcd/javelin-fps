import { World } from "@javelin/ecs"
import { Quaternion } from "cannon-es"
import { Box, Simulate, Transform, Velocity } from "../../../common"

const quat = new Quaternion(0, 0, Math.sqrt(0.5), Math.sqrt(0.5))
const height = 1
const depth = 20
const width = 300
const halfWidth = width / 2
const halfHeight = height / 2

export function createMap(world: World) {
  // spawn dynamic entities
  world.spawn(
    world.component(Transform, 5, 5, 10),
    world.component(Box, 2, 2, 2),
    world.component(Simulate),
    world.component(Velocity),
  )

  world.spawn(
    world.component(Transform, 5, 5, 5),
    world.component(Box, 1, 1, 1),
    world.component(Simulate),
    world.component(Velocity),
  )

  // spawn static entities
  world.spawn(
    world.component(Box, width, height, depth),
    world.component(Transform, 0, halfWidth, halfHeight, 0, 0, 0, 1),
    world.component(Simulate),
  )

  world.spawn(
    world.component(Box, width, height, depth),
    world.component(Transform, 0, -halfWidth, halfHeight, 0, 0, 0, 1),
    world.component(Simulate),
  )

  world.spawn(
    world.component(Box, width, height, depth),
    world.component(
      Transform,
      halfWidth,
      0,
      halfHeight,
      quat.x,
      quat.y,
      quat.z,
      quat.w,
    ),
    world.component(Simulate),
  )

  world.spawn(
    world.component(Box, width, height, depth),
    world.component(
      Transform,
      -halfWidth,
      0,
      halfHeight,
      quat.x,
      quat.y,
      quat.z,
      quat.w,
    ),
    world.component(Simulate),
  )
}
