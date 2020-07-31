import { createTopic } from "@javelin/ecs"
import { createStackPool } from "@javelin/ecs/dist/pool/stack_pool"

export enum PhysicsCommandType {
  Accelerate,
  Rotate,
}

export type Accelerate = [
  PhysicsCommandType.Accelerate,
  number,
  number,
  number,
  number,
]
export type Rotate = [PhysicsCommandType.Rotate, number, number, number]

export type PhysicsCommand = Accelerate | Rotate

export const physicsCommandPool = createStackPool<PhysicsCommand>(
  () => [-1, 0, 0, 0, 0],
  command => {
    command[0] = -1
    command[1] = 0
    command[2] = 0
    command[3] = 0
    command[4] = 0
    return command
  },
  100,
)

export const accelerate = (
  entity: number,
  vx: number,
  vy: number,
  vz: number,
): Accelerate => {
  const command = physicsCommandPool.retain() as Accelerate
  command[0] = PhysicsCommandType.Accelerate
  command[1] = entity
  command[2] = vx
  command[3] = vy
  command[4] = vz
  return command
}

export const physicsTopic = createTopic<PhysicsCommand>()
