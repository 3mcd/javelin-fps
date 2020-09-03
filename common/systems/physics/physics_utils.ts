import {
  Body,
  Vec3,
  World,
  Sphere as CannonSphere,
  Box as CannonBox,
} from "cannon-es"
import { ComponentOf, World as JavelinWorld } from "@javelin/ecs"
import { Velocity, Transform, Sphere, Box } from "../../components"

const contactNormal = new Vec3()
const upAxis = new Vec3(0, 0, 1)

export function isGrounded(body: Body, world: World) {
  for (let i = 0; i < world.contacts.length; i++) {
    const { bi, bj, ni } = world.contacts[i]

    if (!(bi.id === body.id || bj.id === body.id)) {
      continue
    }

    if (bi.id === body.id) {
      ni.negate(contactNormal)
    } else {
      contactNormal.copy(ni)
    }

    if (contactNormal.dot(upAxis) > 0.5) {
      return true
    }
  }

  return false
}

export function buildEntityShape(entity: number, world: JavelinWorld) {
  const sphere = world.tryGetComponent(entity, Sphere)

  if (sphere) {
    return new CannonSphere(sphere.radius)
  }

  const box = world.tryGetComponent(entity, Box)

  if (box) {
    const halfExtents = new Vec3(box.width / 2, box.height / 2, box.depth / 2)
    return new CannonBox(halfExtents)
  }

  throw new Error("Can't create shape for entity.")
}

export function syncTransform(
  body: Body,
  velocity: ComponentOf<typeof Transform>,
) {
  const { x, y, z, qx, qy, qz, qw } = velocity
  body.position.set(x, y, z)
  body.quaternion.set(qx, qy, qz, qw)
}

export function syncVelocity(
  body: Body,
  velocity: ComponentOf<typeof Velocity>,
) {
  const { x, y, z, ax, ay, az } = velocity
  body.velocity.set(x, y, z)
  body.angularVelocity.set(ax, ay, az)
}
