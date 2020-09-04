import { World } from "@javelin/ecs"
import { MessageHandler, UpdateUnreliable } from "@javelin/net"
import {
  Transform,
  dispatchPhysicsCommandsFromInput,
  getInputBuffer,
  physicsTopic,
  stepPhysicsSubsystem,
} from "../../../common"
import { ClientTransform } from "../components"
import { getClientData, getClientPlayer } from "../queries"
import { inputSamplePool } from "../systems"

export const reconcile = (
  updates: UpdateUnreliable[],
  world: World,
  messageHandler: MessageHandler,
) => {
  const player = getClientPlayer(world)

  const clientData = getClientData(world)
  const { inputs } = getInputBuffer(world)

  let { serverLastProcessedInput, playerEntityLocal } = clientData

  if (!(player && playerEntityLocal > -1)) {
    return
  }

  for (let u = 0; u < updates.length; u++) {
    const update = updates[u]
    const [, , meta] = update

    if (!(player && meta >= serverLastProcessedInput)) {
      console.warn(
        `Out of order message (meta=${meta}, serverLastProcessedInput=${serverLastProcessedInput})`,
      )
      continue
    }

    const serverTick = meta as number

    messageHandler.handleUnreliableUpdate(update, world)

    let i = 0

    while (i < inputs.length) {
      const input = inputs[i]

      if (input[7] <= meta) {
        inputs.splice(i, 1)
        inputSamplePool.release(input)
      } else {
        dispatchPhysicsCommandsFromInput(
          input,
          playerEntityLocal,
          physicsTopic,
          world,
        )
        stepPhysicsSubsystem(world)
        physicsTopic.flush()
        i++
      }
    }
    serverLastProcessedInput = serverTick
  }

  // Copy reconciled player body state over to client transform (for rendering)
  Object.assign(
    world.getComponent(playerEntityLocal, ClientTransform),
    world.getComponent(playerEntityLocal, Transform),
  )

  clientData.serverLastProcessedInput = serverLastProcessedInput
}
