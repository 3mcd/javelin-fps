import { committed, query, select, tag, World } from "@javelin/ecs"
import { Vec3 } from "cannon-es"
import { Body as BodyComponent } from "../../../components"
import { getServerDetails } from "../../../queries"
import { Tag } from "../../../tag"
import {
  physicsCommandPool,
  PhysicsCommandType,
  physicsTopic,
} from "../../../topics"
import { isGrounded } from "../physics_utils"
import { bodiesByEntity, simulation } from "../simulation"

const bodies = query(select(BodyComponent), committed, tag(Tag.Simulate))

const tmpVelocity = new Vec3()

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
      case PhysicsCommandType.Move: {
        const [, , x, y] = command
        const { x: vx, y: vy, z: vz } = body.quaternion.vmult(
          tmpVelocity.set(x, y, 0),
        )
        body.velocity.x += vx
        body.velocity.y += vy
        break
      }
      case PhysicsCommandType.Jump: {
        const [, , vz] = command
        body.velocity.z += vz
        break
      }
      case PhysicsCommandType.Rotate: {
        const [, , qx, qy, qz, qw] = command
        body.quaternion.set(qx, qy, qz, qw)
        break
      }
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
    mutBodyComponent.grounded = isGrounded(body, simulation)
  }
}
