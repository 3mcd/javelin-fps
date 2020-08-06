import { Clock } from "@javelin/hrtime-loop"

export function createLoop(
  tickRate: number,
  callback: (clock: Clock) => unknown,
) {
  const clock = {
    dt: 0,
    now: 0,
    tick: 0,
  }

  let timeout: NodeJS.Timer
  let previousTick = performance.now()

  function loop() {
    const now = performance.now()
    const delta = now - previousTick

    if (previousTick + tickRate <= now) {
      previousTick = now
      clock.dt = delta
      clock.now = now
      clock.tick += 1
      callback(clock)
      timeout = setTimeout(loop, tickRate - 4)
    } else {
      setImmediate(loop)
    }
  }

  function start() {
    timeout = setTimeout(loop, tickRate)
  }
  function stop() {
    clearTimeout(timeout)
  }

  return {
    start,
    stop,
  }
}
