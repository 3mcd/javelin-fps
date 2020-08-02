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

const players = query(select(Player), committed)

export const applyPlayerInputSystem = (world: World) => {
  for (const [player] of players(world)) {
    const { actorEntity, inputs, lastInput } = player

    if (actorEntity === -1) {
      continue
    }

    const input = inputs.shift() || lastInput

    if (input) {
      dispatchPhysicsCommandsFromInput(input, actorEntity, physicsTopic, world)
      // Note: we don't obtain a mutable reference here because we don't want
      // to send a reliable update for Player components every time we process
      // an input on the server. This should be implemented better in the future!
      ;(player as MutableComponentOf<typeof Player>).lastInput = input
    }
  }
}
