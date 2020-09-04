import { World } from "@javelin/ecs"
import { Quaternion } from "cannon-es"
import { Box, Mass, Simulate, Transform, Velocity } from "../../../common"

const quat = new Quaternion(0, 0, Math.sqrt(0.5), Math.sqrt(0.5))
const height = 1
const depth = 20
const width = 300
const halfWidth = width / 2
const halfHeight = height / 2

export function createArenaMap(world: World) {
  // spawn dynamic entities

  for (let i = 0; i < 10; i++) {
    world.spawn(
      world.component(Transform, 0, 0, 15 * i),
      world.component(Velocity),
      world.component(Box, i, i, i),
      world.component(Simulate),
      world.component(Mass, i * 3),
    )
  }

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
