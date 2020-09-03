import { query, World } from "@javelin/ecs"
import { Vec3 } from "cannon-es"
import { Simulate, Transform, Velocity } from "../../../components"
import { getServerDetails } from "../../../queries"
import {
  physicsCommandPool,
  PhysicsCommandType,
  physicsTopic,
} from "../../../topics"
import { isGrounded, syncVelocity, syncTransform } from "../physics_utils"
import { bodiesByEntity, simulation } from "../simulation"

const bodies = query(Transform, Simulate)

const tmpVelocity = new Vec3()

export const stepPhysicsSubsystem = (world: World) => {
  const { tickRate } = getServerDetails(world)

  for (const [entity, [transform]] of bodies(world)) {
    const body = bodiesByEntity.get(entity)
    const velocity = world.tryGetComponent(entity, Velocity)

    syncTransform(body, transform)

    if (velocity) {
      syncVelocity(body, velocity)
    }

    // Linear damping
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

  for (const [entity, [transform]] of bodies(world)) {
    const body = bodiesByEntity.get(entity)
    const {
      position: { x, y, z },
      velocity: { x: vx, y: vy, z: vz },
      quaternion: { x: qx, y: qy, z: qz, w: qw },
      angularVelocity: { x: avx, y: avy, z: avz },
    } = body

    const m_transform = world.getObservedComponent(transform)

    m_transform.x = x
    m_transform.y = y
    m_transform.z = z
    m_transform.qx = qx
    m_transform.qy = qy
    m_transform.qz = qz
    m_transform.qw = qw

    const velocity = world.tryGetComponent(entity, Velocity)

    if (velocity) {
      const m_velocity = world.getObservedComponent(velocity)

      m_velocity.x = vx
      m_velocity.y = vy
      m_velocity.z = vz
      m_velocity.ax = avx
      m_velocity.ay = avy
      m_velocity.az = avz
    }

    m_transform.grounded = isGrounded(body, simulation)
  }
}
