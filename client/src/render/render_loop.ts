import { Clock } from "@javelin/hrtime-loop";

export function createRenderLoop(callback: (clock: Clock) => unknown) {
  const clock = {
    dt: 0,
    now: 0,
    tick: 0,
  };

  let running = false;
  let previousTick = 0;

  function loop(now: number) {
    if (!running) {
      return;
    }

    const delta = now - previousTick;

    clock.dt = delta;
    clock.now = now;
    clock.tick += 1;

    previousTick = now;

    callback(clock);

    requestAnimationFrame(loop);
  }

  function start() {
    running = true;
    requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
  }

  return {
    start,
    stop,
  };
}
