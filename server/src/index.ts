import { createWorld, mutableEmpty } from "@javelin/ecs"
import { Clock, createHrtimeLoop } from "@javelin/hrtime-loop"
import { createMessageProducer, UpdateUnreliable } from "@javelin/net"
import { decode, encode } from "@msgpack/msgpack"
import { Server } from "@web-udp/server"
import { createServer } from "http"
import {
  Body,
  ConnectionMetadata,
  ConnectionType,
  maintainPhysicsSubsystem,
  physicsTopic,
  Player,
  ServerDetails,
  stepPhysicsSubsystem,
  Tag,
} from "../../common"
import { createClient } from "./client"
import { applyPlayerInputSystem } from "./systems"
import { Client, ClientState } from "./types"

const port = Number(process.env.PORT)
const tickRate = Number(process.env.TICK_RATE)
const sendRate = Number(process.env.SEND_RATE)

if (Number.isNaN(port)) throw new Error("Invalid PORT")
if (Number.isNaN(tickRate)) throw new Error("Invalid TICK_RATE")
if (Number.isNaN(sendRate)) throw new Error("Invalid SEND_RATE")

const components = [
  { type: Body, priority: 1 },
  { type: Player },
  { type: ServerDetails },
]

const messageProducer = createMessageProducer({
  components: components,
  updateInterval: (1 / sendRate) * 1000,
  updateSize: 1000,
})

const world = createWorld({
  componentFactories: components.map(c => c.type),
  systems: [
    maintainPhysicsSubsystem,
    applyPlayerInputSystem,
    stepPhysicsSubsystem,
  ],
})

world.create([ServerDetails.create(60, 30)])
world.tick({ dt: 0, tick: 0, now: 0 })

const server = createServer()
const udp = new Server({ server })

const clients: Client[] = []

const isClientFullyConnected = (client: Client) =>
  client.connections[ConnectionType.Unreliable] &&
  client.connections[ConnectionType.Reliable]

const isConnectionMetadata = (metadata: any): metadata is ConnectionMetadata =>
  typeof metadata === "object" &&
  metadata !== null &&
  (metadata.connectionType === ConnectionType.Reliable ||
    metadata.connectionType === ConnectionType.Unreliable) &&
  typeof metadata.clientId === "string"

const createClientEntities = (client: Client) => {
  const actor = world.create([Body.create()], Tag.Simulate)
  const player = world.create([Player.create(client.id, actor)])

  client.playerEntity = player
}

const cleanupClientEntities = (client: Client) => {
  if (typeof client.playerEntity !== "number") {
    return
  }

  const player = world.getComponent(client.playerEntity, Player)

  world.destroy(client.playerEntity)

  if (player.actorEntity !== -1) {
    world.destroy(player.actorEntity)
  }

  client.playerEntity = null
}

udp.connections.subscribe(connection => {
  const { metadata } = connection

  if (!isConnectionMetadata(metadata)) {
    console.error(`Invalid client metadata.`)
    connection.close()
    return
  }

  const { clientId, connectionType } = metadata

  let client = clients.find(client => client.id === clientId)

  if (client && isClientFullyConnected(client)) {
    console.error(`Client with id ${clientId} already exists!`)
    connection.close()
    return
  }

  if (!client) {
    client = createClient(clientId, connection, connectionType)
    clients.push(client)
  } else {
    client.connections[connectionType] = connection

    if (isClientFullyConnected(client)) {
      client.state = ClientState.Connected
      createClientEntities(client)
    }
  }

  connection.messages.subscribe(data => {
    client.messages.push(decode(data))
  })
  connection.closed.subscribe(() => {
    if (client.state === ClientState.Disconnected) {
      return
    }

    client.state = ClientState.Disconnected

    clients.splice(clients.indexOf(client), 1)

    client.connections[ConnectionType.Reliable]?.close()
    client.connections[ConnectionType.Unreliable]?.close()

    cleanupClientEntities(client)
  })
})

const tick = (clock: Clock) => {
  for (const client of clients) {
    if (typeof client.playerEntity !== "number") {
      continue
    }

    const player = world.tryGetComponent(client.playerEntity, Player)

    if (!player) {
      continue
    }

    for (const message of client.messages) {
      player.inputs.push(message as number[])
    }

    mutableEmpty(client.messages)
  }

  world.tick(clock)

  const reliable = encode(messageProducer.getReliableMessages(world))
  const unreliable = messageProducer.getUnreliableMessages(world)

  for (const client of clients) {
    switch (client.state) {
      case ClientState.Connected:
        client.connections[ConnectionType.Reliable].send(
          encode(messageProducer.getInitialMessages(world)),
        )
        client.state = ClientState.Initialized
        break
      case ClientState.Initialized: {
        client.connections[ConnectionType.Reliable].send(reliable)

        const player = world.getComponent(client.playerEntity, Player)

        if (!player) {
          break
        }

        if (unreliable.length > 0) {
          client.connections[ConnectionType.Unreliable].send(
            encode(
              unreliable.map(updateUnreliable => {
                const update = updateUnreliable.slice() as UpdateUnreliable
                update[3] = player.lastInput[7]
                return update
              }),
            ),
          )
        }

        break
      }
      default:
        break
    }
  }

  physicsTopic.flush()
}

const loop = createHrtimeLoop((1 / tickRate) * 1000, tick)

server.listen(port, () => {
  console.log(`Server listening on ${port}`)
  console.log(`sendRate=${sendRate}, tickRate=${tickRate}`)
  loop.start()
})
