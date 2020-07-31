import { committed, query, select, tag, World } from "@javelin/ecs"
import { Body as BodyComponent } from "../../../components"
import { getServerDetails } from "../../../queries"
import { Tag } from "../../../tag"
import {
  PhysicsCommandType,
  physicsTopic,
  physicsCommandPool,
} from "../../../topics"
import { bodiesByEntity, simulation } from "../simulation"

const bodies = query(select(BodyComponent), committed, tag(Tag.Simulate))

export const stepPhysicsSubsystem = (world: World) => {
  const { tickRate } = getServerDetails(world)

  for (const [
    { _e: entity, x, y, z, vx, vy, vz, qx, qy, qz, qw, avx, avy, avz },
  ] of bodies(world)) {
    const body = bodiesByEntity.get(entity)

    body.position.set(x, y, z)
    body.velocity.set(vx, vy, vz)
    body.quaternion.set(qx, qy, qz, qw)
    body.angularVelocity.set(avx, avy, avz)

    body.velocity.x *= 0.8
    body.velocity.y *= 0.8
  }

  for (const command of physicsTopic) {
    const [, entity] = command
    const body = bodiesByEntity.get(entity)

    switch (command[0]) {
      case PhysicsCommandType.Accelerate:
        body.velocity.x += command[2]
        body.velocity.y += command[3]
        body.velocity.z += command[4]
        break
    }

    physicsCommandPool.release(command)
  }

  simulation.step(1 / tickRate)

  for (const [bodyComponent] of bodies(world)) {
    const body = bodiesByEntity.get(bodyComponent._e)
    const mutBodyComponent = world.mut(bodyComponent)
    const {
      position: { x, y, z },
      velocity: { x: vx, y: vy, z: vz },
      quaternion: { x: qx, y: qy, z: qz, w: qw },
      angularVelocity: { x: avx, y: avy, z: avz },
    } = body

    mutBodyComponent.x = x
    mutBodyComponent.y = y
    mutBodyComponent.z = z
    mutBodyComponent.qx = qx
    mutBodyComponent.qy = qy
    mutBodyComponent.qz = qz
    mutBodyComponent.qw = qw
    mutBodyComponent.vx = vx
    mutBodyComponent.vy = vy
    mutBodyComponent.vz = vz
    mutBodyComponent.avx = avx
    mutBodyComponent.avy = avy
    mutBodyComponent.avz = avz
  }
}
