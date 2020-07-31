import { World, Vec3, Body, Plane } from "cannon-es"

export const simulation = new World({
  gravity: new Vec3(0, 0, -9.81),
})

simulation.addBody(new Body({ shape: new Plane(), mass: 0 }))

export const bodiesByEntity = new Map<number, Body>()
