import {
  committed,
  query,
  select,
  World,
  MutableComponentOf,
} from "@javelin/ecs"
import {
  dispatchPhysicsCommandsFromInput,
  physicsTopic,
  Player,
} from "../../../common"
import { Clock } from "@javelin/hrtime-loop"

const players = query(select(Player), committed)

export const applyPlayerInputSystem = (world: World, clock: Clock) => {
  for (const [player] of players(world)) {
    const { actorEntity, inputs, lastInput, targetInputBufferLength } = player

    if (actorEntity === -1) {
      continue
    }

    const mutPlayer = world.mut(player)

    if (mutPlayer.buffering) {
      if (inputs.length >= targetInputBufferLength) {
        mutPlayer.buffering = false
        console.log("Take", inputs.length)
      } else {
        continue
      }
    }

    let input: number[]

    if (inputs.length === 0) {
      let growFactor = 1

      if (mutPlayer.lastBufferGrow > 0) {
        growFactor = Math.min(
          15,
          Math.ceil((16.6666 * 1000) / (clock.now - mutPlayer.lastBufferGrow)),
        )
      }

      mutPlayer.targetInputBufferLength += growFactor
      mutPlayer.lastBufferGrow = clock.now
      mutPlayer.buffering = true
      console.log("Grow", mutPlayer.targetInputBufferLength)
      input = lastInput
    } else {
      if (
        inputs.length >= mutPlayer.targetInputBufferLength &&
        clock.now - mutPlayer.lastBufferShrink > 1000
      ) {
        mutPlayer.targetInputBufferLength = Math.max(
          1,
          mutPlayer.targetInputBufferLength - 1,
        )
        mutPlayer.lastBufferShrink = clock.now
      }
      input = inputs.shift()
    }

    if (input) {
      dispatchPhysicsCommandsFromInput(input, actorEntity, physicsTopic, world)
      // Note: we don't obtain a mutable reference here because we don't want
      // to send a reliable update for Player components every time we process
      // an input on the server. This should be implemented better in the future!
      ;(player as MutableComponentOf<typeof Player>).lastInput = input
    }
  }
}
