import { query, World } from "@javelin/ecs"
import { Vec3 } from "cannon-es"
import { Body as BodyComponent, Simulate } from "../../../components"
import { getServerDetails } from "../../../queries"
import {
  physicsCommandPool,
  PhysicsCommandType,
  physicsTopic,
} from "../../../topics"
import { isGrounded } from "../physics_utils"
import { bodiesByEntity, simulation } from "../simulation"

const bodies = query(BodyComponent, Simulate)

const tmpVelocity = new Vec3()

export const stepPhysicsSubsystem = (world: World) => {
  const { tickRate } = getServerDetails(world)

  for (const [
    entity,
    [{ x, y, z, vx, vy, vz, qx, qy, qz, qw, avx, avy, avz }],
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

  for (const [entity, [_body]] of bodies(world)) {
    const body = bodiesByEntity.get(entity)
    const m_body = world.getMutableComponent(_body)
    const {
      position: { x, y, z },
      velocity: { x: vx, y: vy, z: vz },
      quaternion: { x: qx, y: qy, z: qz, w: qw },
      angularVelocity: { x: avx, y: avy, z: avz },
    } = body

    m_body.x = x
    m_body.y = y
    m_body.z = z
    m_body.qx = qx
    m_body.qy = qy
    m_body.qz = qz
    m_body.qw = qw
    m_body.vx = vx
    m_body.vy = vy
    m_body.vz = vz
    m_body.avx = avx
    m_body.avy = avy
    m_body.avz = avz
    m_body.grounded = isGrounded(body, simulation)
  }
}
