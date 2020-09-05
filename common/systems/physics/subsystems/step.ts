import { query, World } from "@javelin/ecs"
import { Vec3 } from "cannon-es"
import { Simulate, Transform, Velocity, Sphere } from "../../../components"
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

    // Linear damping of player actors
    if (world.tryGetComponent(entity, Sphere)) {
      body.velocity.x *= 0.8
      body.velocity.y *= 0.8
    }
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

    transform.x = x
    transform.y = y
    transform.z = z
    transform.qx = qx
    transform.qy = qy
    transform.qz = qz
    transform.qw = qw

    transform.grounded = isGrounded(body, simulation)

    const velocity = world.tryGetComponent(entity, Velocity)

    if (velocity) {
      velocity.x = vx
      velocity.y = vy
      velocity.z = vz
      velocity.ax = avx
      velocity.ay = avy
      velocity.az = avz
    }
  }
}
