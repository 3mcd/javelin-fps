import { World } from "@javelin/ecs"
import { createStackPool } from "@javelin/ecs/dist/esm/pool/stack_pool"
import { Clock } from "@javelin/hrtime-loop"
import { encode } from "@msgpack/msgpack"
import { Connection } from "@web-udp/client"
import { Gamepad, Keyboard, Mouse, or } from "contro"
import { Control } from "contro/dist/core/control"
import {
  dispatchPhysicsCommandsFromInput,
  getInputBuffer,
  physicsTopic,
  Simulate,
} from "../../../common"
import { getClientData, getClientPlayer } from "../queries"

const SENSITIVITY = 0.002
const PI_2 = Math.PI / 2

const mouse = new Mouse({ canvas: document.querySelector("canvas") })
const keyboard = new Keyboard()
const gamepad = new Gamepad()
const controls = {
  up: or(gamepad.button("Up"), keyboard.key("W")),
  down: or(gamepad.button("Down"), keyboard.key("S")),
  left: or(gamepad.button("Left"), keyboard.key("A")),
  right: or(gamepad.button("Right"), keyboard.key("D")),
  jump: or(gamepad.button("A"), keyboard.key("Space")),
  pointer: mouse.pointer(),
}

const detect = (control: Control<boolean>, index: number, sample: number[]) => {
  if (control.query()) {
    sample[index] = 1
  } else if (sample[index]) {
    sample[index] = 0
  }
}

document.addEventListener(
  "click",
  function () {
    if (/Firefox/i.test(navigator.userAgent)) {
      const onFullscreenChange = () => {
        if (document.fullscreenElement === document.body) {
          document.removeEventListener("onFullscreenChange", onFullscreenChange)
          document.removeEventListener(
            "mozfullscreenchange",
            onFullscreenChange,
          )

          mouse.lockPointer()
        }
      }

      document.addEventListener("onFullscreenChange", onFullscreenChange, false)
      document.addEventListener(
        "mozfullscreenchange",
        onFullscreenChange,
        false,
      )

      document.body.requestFullscreen()
    } else {
      mouse.lockPointer()
    }
  },
  false,
)

export const inputSamplePool = createStackPool(
  () => [0, 0, 0, 0, 0, 0, 0],
  sample => {
    sample[0] = 0
    sample[1] = 0
    sample[2] = 0
    sample[3] = 0
    sample[4] = 0
    sample[5] = 0
    sample[6] = 0
    sample[7] = 0
    return sample
  },
  50,
)

let prevPointerX = 0
let prevPointerY = 0

export const createSampleInputSystem = (connection: Connection) => (
  world: World,
  clock: Clock,
) => {
  const clientData = getClientData(world)
  const player = getClientPlayer(world)
  const inputBuffer = getInputBuffer(world)

  if (!player) {
    return
  }

  const { x, y } = controls.pointer.query()
  const input: number[] = inputSamplePool.retain()

  input[5] = prevPointerX
  input[6] = prevPointerY

  detect(controls.up, 0, input)
  detect(controls.right, 1, input)
  detect(controls.down, 2, input)
  detect(controls.left, 3, input)
  detect(controls.jump, 4, input)

  if (mouse.isPointerLocked()) {
    prevPointerX = input[5] - x * SENSITIVITY
    prevPointerY = Math.max(-PI_2, Math.min(PI_2, input[6] - y * SENSITIVITY))

    input[5] = prevPointerX
    input[6] = prevPointerY
  }

  input[7] = clock.tick

  if (world.tryGetComponent(clientData.playerEntityLocal, Simulate)) {
    dispatchPhysicsCommandsFromInput(
      input,
      clientData.playerEntityLocal,
      physicsTopic,
      world,
    )

    inputBuffer.inputs.push(input)

    while (inputBuffer.inputs.length > 20) {
      inputBuffer.inputs.shift()
    }

    connection.send(encode(input))
  }
}
