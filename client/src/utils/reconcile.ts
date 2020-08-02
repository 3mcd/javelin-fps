import { World } from "@javelin/ecs"
import { MessageHandler, UpdateUnreliable } from "@javelin/net"
import {
  dispatchPhysicsCommandsFromInput,
  getInputBuffer,
  physicsTopic,
  stepPhysicsSubsystem,
} from "../../../common"
import { getClientData, getClientPlayer } from "../queries"
import { inputSamplePool } from "../systems"

export const reconcile = (
  updates: UpdateUnreliable[],
  world: World,
  messageHandler: MessageHandler,
) => {
  const player = getClientPlayer(world)

  if (!player) {
    return
  }

  const clientData = getClientData(world)
  const { inputs } = getInputBuffer(world)

  let { serverLastProcessedInput } = clientData

  for (let u = 0; u < updates.length; u++) {
    const update = updates[u]
    const [, , , meta] = update

    if (!(player && meta >= serverLastProcessedInput)) {
      console.log(meta, serverLastProcessedInput)
      return
    }

    messageHandler.applyUnreliableUpdate(update, world)

    let i = 0

    while (i < inputs.length) {
      const input = inputs[i]

      if (input[7] <= meta) {
        inputs.splice(i, 1)
        inputSamplePool.release(input)
      } else {
        player.inputs[0] = input

        dispatchPhysicsCommandsFromInput(
          input,
          clientData.playerEntityLocal,
          physicsTopic,
          world,
        )
        stepPhysicsSubsystem(world)
        physicsTopic.flush()
        i++
      }
    }
    serverLastProcessedInput = meta as number
  }

  world.mut(clientData).serverLastProcessedInput = serverLastProcessedInput
}
