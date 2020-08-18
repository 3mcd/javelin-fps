import { attached, detached, query, World } from "@javelin/ecs"
import { Body, Sphere } from "cannon-es"
import { Body as BodyComponent, Simulate } from "../../../components"
import { bodiesByEntity, simulation } from "../simulation"

const bodiesCreated = query(attached(Simulate))
const bodiesDestroyed = query(detached(Simulate))

export const maintainPhysicsSubsystem = (world: World) => {
  for (const [entity] of bodiesCreated(world)) {
    const body = new Body({
      mass: 1,
      shape: new Sphere(0.5),
    })

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
