import { attached, createWorld, query, World } from "@javelin/ecs"
import { createMessageHandler, JavelinMessage } from "@javelin/net"
import { decode } from "@msgpack/msgpack"
import { Client, Connection, RTCConnectionProvider } from "@web-udp/client"
import { WebSocketTransport } from "@web-udp/protocol"
import {
  ClientData,
  InputBuffer,
  maintainPhysicsSubsystem,
  physicsTopic,
  Player,
  ServerDetails,
  Simulate,
  Sphere,
  stepPhysicsSubsystem,
  Transform,
  Velocity,
  Box,
  Mass,
} from "../../common"
import { ClientTransform, InterpolationBuffer } from "./components"
import { API_HOST } from "./config"
import { createLoop } from "./loop"
import { getConnectionOptions } from "./net"
import { getClientData, getClientPlayer } from "./queries"
import { createRenderLoop, maintainRenderSceneSystem, redraw } from "./render"
import {
  createSampleInputSystem,
  interpolateRemoteEntitiesSystem,
} from "./systems"
import { reconcile } from "./utils"

const clientId = Math.random().toString()
const transport = new WebSocketTransport(new WebSocket(`ws://${API_HOST}`))

async function fetchIceServers() {
  try {
    const req = await fetch(`http://${API_HOST}/ice`)
    const { iceServers } = await req.json()

    return iceServers
  } catch {
    return undefined
  }
}

async function main() {
  const client = new Client({
    url: API_HOST,
    provider: new RTCConnectionProvider({
      transport,
      iceServers: await fetchIceServers(),
      onConnection(connection) {
        client.connections.dispatch(connection)
      },
    }),
    transport,
  })
  1
  const connectionOptions = getConnectionOptions(clientId)
  const connections = {
    reliable: await client.connect(connectionOptions.reliable),
    unreliable: await client.connect(connectionOptions.unreliable),
  }

  const messageHandler = createMessageHandler({
    processUnreliableUpdates(updates, world) {
      reconcile(updates, world, messageHandler)
    },
  })

  const LOG_BANDWIDTH_INTERVAL_MS = 1000

  let prevTransferLogTime = 0
  let bytes = 0

  function logDataTransferRate(arrayBuffer: ArrayBuffer) {
    const now = performance.now()

    bytes += arrayBuffer.byteLength

    if (now - prevTransferLogTime >= LOG_BANDWIDTH_INTERVAL_MS) {
      console.log(`${bytes / 1000} kb/s`)
      prevTransferLogTime = now
      bytes = 0
    }
  }

  const handleMessage = (data: any) => {
    const messages = decode(data) as JavelinMessage[]
    logDataTransferRate(data)
    messages.forEach(messageHandler.push)
  }

  const handleClosed = () => {
    connections.reliable.close()
    connections.unreliable.close()
    console.log("Connection to server closed")
  }

  const handleError = (error: { error: string }) => {
    console.error(error.error)
  }

  const setupConnection = (connection: Connection) => {
    connection.closed.subscribe(handleClosed)
    connection.errors.subscribe(handleError)
    connection.messages.subscribe(handleMessage)
  }

  setupConnection(connections.reliable)
  setupConnection(connections.unreliable)

  const bodiesCreated = query(attached(Transform))
  const initializeLocalEntitiesSystem = (world: World) => {
    const clientData = getClientData(world)
    const player = getClientPlayer(world)

    if (!player) {
      return
    }

    if (player.actorEntity !== -1) {
      world.getObservedComponent(
        clientData,
      ).playerEntityLocal = messageHandler.getLocalEntity(player.actorEntity)
    }

    for (const [entity, [{ x, y, z, qx, qy, qz, qw }]] of bodiesCreated(
      world,
    )) {
      if (entity === clientData.playerEntityLocal) {
        world.attach(
          entity,
          world.component(ClientTransform, x, y, z, qx, qy, qz, qw),
          world.component(Simulate),
        )
      } else {
        world.attach(
          entity,
          world.component(ClientTransform, x, y, z, qx, qy, qz, qw),
          world.component(InterpolationBuffer),
          world.component(Simulate),
        )
      }
    }
  }

  const world = createWorld({
    systems: [
      messageHandler.system,
      initializeLocalEntitiesSystem,
      maintainPhysicsSubsystem,
      createSampleInputSystem(connections.unreliable),
      stepPhysicsSubsystem,
      interpolateRemoteEntitiesSystem,
      maintainRenderSceneSystem,
    ],
    componentTypes: [
      Box,
      ClientData,
      ClientTransform,
      InputBuffer,
      InterpolationBuffer,
      Mass,
      Player,
      ServerDetails,
      Simulate,
      Sphere,
      Transform,
      Velocity,
    ],
  })

  ;(window as any).world = world
  ;(window as any).connections = connections

  // Create singleton components
  world.spawn(
    world.component(ClientData, clientId),
    world.component(InputBuffer),
  )

  world.tick({ dt: 0, tick: 0, now: 0 })

  const loop = createLoop((1 / 60) * 1000, clock => {
    world.tick(clock)
    physicsTopic.flush()
  })
  const renderLoop = createRenderLoop(clock => {
    redraw(world, clock)
  })

  loop.start()
  renderLoop.start()
}

main()
