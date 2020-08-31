import { changed, query, World } from "@javelin/ecs"
import { createStackPool } from "@javelin/ecs/dist/esm/pool/stack_pool"
import { Quaternion } from "three"
import { Body, getServerDetails } from "../../../common"
import { InterpolationBuffer, ClientTransform } from "../components"

const toInterpolate = query(InterpolationBuffer, ClientTransform)
const toUpdate = query(InterpolationBuffer, changed(Body))

const tempQuatFrom = new Quaternion()
const tempQuatTo = new Quaternion()

export const interpolationRecordPool = createStackPool(
  () => [0, 0, 0, 0, 0, 0, 0, 0],
  record => {
    record[0] = 0
    record[1] = 0
    record[2] = 0
    record[3] = 0
    record[4] = 0
    record[5] = 0
    record[6] = 0
    record[7] = 0
    return record
  },
  1000,
)

export function interpolateRemoteEntitiesSystem(world: World) {
  const { sendRate } = getServerDetails(world)
  const time = Date.now()
  const renderTime = time - 1000 / sendRate

  for (const [, [interpolationBuffer, body]] of toUpdate(world)) {
    const { x, y, z, qx, qy, qz, qw } = body
    const record = interpolationRecordPool.retain()

    record[0] = Date.now()
    record[1] = x
    record[2] = y
    record[3] = z
    record[4] = qx
    record[5] = qy
    record[6] = qz
    record[7] = qw

    interpolationBuffer.buffer.push(record)
  }

  for (const [, [interpolationBuffer, renderTransform]] of toInterpolate(
    world,
  )) {
    const m_clientTransform = world.getMutableComponent(renderTransform)

    // const mutInterpolationBuffer = world.getMutableComponent(
    //   interpolationBuffer,
    // )

    // Drop older positions.
    while (
      interpolationBuffer.buffer.length >= 2 &&
      interpolationBuffer.buffer[1][0] <= renderTime
    ) {
      interpolationRecordPool.release(interpolationBuffer.buffer.shift())
    }

    if (
      interpolationBuffer.buffer.length >= 2 &&
      interpolationBuffer.buffer[0][0] <= renderTime &&
      renderTime <= interpolationBuffer.buffer[1][0]
    ) {
      const [
        [t0, x0, y0, z0, qx0, qy0, qz0, qw0],
        [t1, x1, y1, z1, qx1, qy1, qz1, qw1],
      ] = interpolationBuffer.buffer

      const dr = renderTime - t0
      const dt = t1 - t0

      // Interpolate position
      m_clientTransform.x = x0 + ((x1 - x0) * dr) / dt
      m_clientTransform.y = y0 + ((y1 - y0) * dr) / dt
      m_clientTransform.z = z0 + ((z1 - z0) * dr) / dt

      // Interpolate rotation
      tempQuatTo.set(qx0, qy0, qz0, qw0)
      tempQuatFrom.set(qx1, qy1, qz1, qw1)
      tempQuatTo.slerp(tempQuatFrom, dr / dt)

      m_clientTransform.qx = tempQuatTo.x
      m_clientTransform.qy = tempQuatTo.y
      m_clientTransform.qz = tempQuatTo.z
      m_clientTransform.qw = tempQuatTo.w
    }
  }
}
