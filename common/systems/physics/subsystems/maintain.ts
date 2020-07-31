import { simulation, bodiesByEntity } from "../simulation"
import {
  query,
  select,
  created,
  destroyed,
  World,
  committed,
  tag,
} from "@javelin/ecs"
import { Body, Sphere } from "cannon-es"
import { Body as BodyComponent } from "../../../components"
import { Tag } from "../../../tag"

const bodiesCreated = query(select(BodyComponent), created, tag(Tag.Simulate))
const bodiesDestroyed = query(
  select(BodyComponent),
  destroyed,
  tag(Tag.Simulate),
)

export const maintainPhysicsSubsystem = (world: World) => {
  for (const [{ _e: entity }] of bodiesCreated(world)) {
    const body = new Body({
      mass: 1,
      shape: new Sphere(0.5),
    })

    simulation.addBody(body)
    bodiesByEntity.set(entity, body)
  }

  for (const [{ _e: entity }] of bodiesDestroyed(world)) {
    const body = bodiesByEntity.get(entity)

    simulation.removeBody(body)
    bodiesByEntity.delete(entity)
  }
}
