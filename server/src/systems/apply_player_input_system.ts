import { query, World } from "@javelin/ecs"
import { Clock } from "@javelin/hrtime-loop"
import {
  dispatchPhysicsCommandsFromInput,
  InputBuffer,
  physicsTopic,
  Player,
} from "../../../common"

const players = query(Player, InputBuffer)

export const applyPlayerInputSystem = (world: World, clock: Clock) => {
  for (const [, [player, inputBuffer]] of players(world)) {
    const { actorEntity } = player
    const { inputs, lastInput, targetInputBufferLength } = inputBuffer

    if (actorEntity === -1) {
      continue
    }

    if (inputBuffer.buffering) {
      if (inputs.length >= targetInputBufferLength) {
        inputBuffer.buffering = false
      } else {
        continue
      }
    }

    let input: number[]

    if (inputs.length === 0) {
      let growFactor = 1

      if (inputBuffer.lastBufferGrow > 0) {
        growFactor = Math.ceil(
          (16.6666 * 1000) / (clock.now - inputBuffer.lastBufferGrow),
        )
      }

      inputBuffer.targetInputBufferLength = Math.min(
        growFactor + inputBuffer.targetInputBufferLength,
        20,
      )
      inputBuffer.lastBufferGrow = clock.now
      inputBuffer.buffering = true
      input = lastInput
    } else {
      if (
        inputs.length >= inputBuffer.targetInputBufferLength &&
        clock.now - inputBuffer.lastBufferShrink > 1000
      ) {
        inputBuffer.targetInputBufferLength = Math.max(
          1,
          inputBuffer.targetInputBufferLength - 1,
        )
        inputBuffer.lastBufferShrink = clock.now
      }
      input = inputs.shift()
    }

    if (input) {
      dispatchPhysicsCommandsFromInput(input, actorEntity, physicsTopic, world)
      inputBuffer.lastInput = input
    }
  }
}
