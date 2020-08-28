import { attached, createWorld, query, World } from "@javelin/ecs"
import { createMessageHandler, JavelinMessage } from "@javelin/net"
import { decode } from "@msgpack/msgpack"
import { Client, Connection } from "@web-udp/client"
import {
  Body,
  ClientData,
  InputBuffer,
  maintainPhysicsSubsystem,
  physicsTopic,
  Player,
  ServerDetails,
  Simulate,
  stepPhysicsSubsystem,
} from "../../common"
import { InterpolationBuffer, ClientTransform } from "./components"
import { API_HOST } from "./config"
import { createLoop } from "./loop"
import { getConnectionOptions } from "./net"
import { getClientData, getClientPlayer } from "./queries"
import { createRenderLoop, maintainRenderSceneSystem, redraw } from "./render"
import {
  createSampleInputSystem,
  interpolateRemoteEntitiesSystem,
} from "./systems"
import { ms, reconcile } from "./utils"

const clientId = Math.random().toString()

async function main() {
  const client = new Client({ url: API_HOST })

  // Wait a brief duration before connecting.
  await ms(500)

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

  const handleMessage = (data: any) => {
    const messages = decode(data) as JavelinMessage[]
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

  const bodiesCreated = query(attached(Body))
  const initializeLocalEntitiesSystem = (world: World) => {
    const clientData = getClientData(world)
    const player = getClientPlayer(world)

    if (!player) {
      return
    }

    if (player.actorEntity !== -1) {
      world.getMutableComponent(
        clientData,
      ).playerEntityLocal = messageHandler.getLocalEntity(player.actorEntity)
    }

    for (const [entity] of bodiesCreated(world)) {
      if (entity === clientData.playerEntityLocal) {
        world.attach(
          entity,
          world.component(ClientTransform),
          world.component(Simulate),
        )
      } else {
        world.attach(
          entity,
          world.component(ClientTransform),
          world.component(InterpolationBuffer),
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
      Body,
      ClientData,
      InputBuffer,
      InterpolationBuffer,
      Player,
      ServerDetails,
      Simulate,
      ClientTransform,
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
