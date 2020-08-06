import { Body, Vec3, World } from "cannon-es"

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
