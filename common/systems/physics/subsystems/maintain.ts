import { attached, detached, query, World } from "@javelin/ecs"
import { Body } from "cannon-es"
import { Simulate, Velocity, Transform } from "../../../components"
import { bodiesByEntity, simulation } from "../simulation"
import { syncVelocity, syncTransform, buildEntityShape } from "../physics_utils"

const bodiesCreated = query(attached(Simulate), Transform)
const bodiesDestroyed = query(detached(Simulate))

export const maintainPhysicsSubsystem = (world: World) => {
  for (const [entity, [, transform]] of bodiesCreated(world)) {
    const velocity = world.tryGetComponent(entity, Velocity)
    const body = new Body({
      mass: velocity ? 1 : 0,
      shape: buildEntityShape(entity, world),
    })

    syncTransform(body, transform)

    if (velocity) {
      syncVelocity(body, velocity)
    }

    simulation.addBody(body)
    bodiesByEntity.set(entity, body)
  }

  for (const [entity] of bodiesDestroyed(world)) {
    const body = bodiesByEntity.get(entity)

    if (body) {
      simulation.removeBody(body)
      bodiesByEntity.delete(entity)
    }
  }
}
