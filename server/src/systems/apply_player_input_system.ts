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

    const mutInputBuffer = world.mut(inputBuffer)

    if (mutInputBuffer.buffering) {
      if (inputs.length >= targetInputBufferLength) {
        mutInputBuffer.buffering = false
        console.log("Take", inputs.length)
      } else {
        continue
      }
    }

    let input: number[]

    if (inputs.length === 0) {
      let growFactor = 1

      if (mutInputBuffer.lastBufferGrow > 0) {
        growFactor = Math.min(
          15,
          Math.ceil(
            (16.6666 * 1000) / (clock.now - mutInputBuffer.lastBufferGrow),
          ),
        )
      }

      mutInputBuffer.targetInputBufferLength += growFactor
      mutInputBuffer.lastBufferGrow = clock.now
      mutInputBuffer.buffering = true
      console.log("Grow", mutInputBuffer.targetInputBufferLength)
      input = lastInput
    } else {
      if (
        inputs.length >= mutInputBuffer.targetInputBufferLength &&
        clock.now - mutInputBuffer.lastBufferShrink > 1000
      ) {
        mutInputBuffer.targetInputBufferLength = Math.max(
          1,
          mutInputBuffer.targetInputBufferLength - 1,
        )
        mutInputBuffer.lastBufferShrink = clock.now
      }
      input = inputs.shift()
    }

    if (input) {
      dispatchPhysicsCommandsFromInput(input, actorEntity, physicsTopic, world)
      mutInputBuffer.lastInput = input
    }
  }
}
