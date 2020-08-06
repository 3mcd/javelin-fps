import { createTopic } from "@javelin/ecs"
import { createStackPool } from "@javelin/ecs/dist/pool/stack_pool"

export enum PhysicsCommandType {
  Move,
  Jump,
  Rotate,
}

export type Move = [PhysicsCommandType.Move, number, number, number]
export type Jump = [PhysicsCommandType.Jump, number, number]
export type Rotate = [
  PhysicsCommandType.Rotate,
  number,
  number,
  number,
  number,
  number,
]

export type PhysicsCommand = Move | Jump | Rotate

export const physicsCommandPool = createStackPool<PhysicsCommand>(
  () => [-1, 0, 0, 0],
  command => {
    command[0] = -1
    command[1] = 0
    command[2] = 0
    command[3] = 0
    return command
  },
  100,
)

export const move = (entity: number, vx: number, vy: number): Move => {
  const command = physicsCommandPool.retain() as Move
  command[0] = PhysicsCommandType.Move
  command[1] = entity
  command[2] = vx
  command[3] = vy
  return command
}

export const jump = (entity: number, vz: number): Jump => {
  const command = physicsCommandPool.retain() as Jump
  command[0] = PhysicsCommandType.Jump
  command[1] = entity
  command[2] = vz
  return command
}

export const rotate = (
  entity: number,
  qx: number,
  qy: number,
  qz: number,
  qw: number,
): Rotate => {
  const command = physicsCommandPool.retain() as Rotate
  command[0] = PhysicsCommandType.Rotate
  command[1] = entity
  command[2] = qx
  command[3] = qy
  command[4] = qz
  command[5] = qw
  return command
}

export const physicsTopic = createTopic<PhysicsCommand>()
