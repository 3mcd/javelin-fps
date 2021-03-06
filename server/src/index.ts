import { createWorld, mutableEmpty } from "@javelin/ecs"
import { Clock, createHrtimeLoop } from "@javelin/hrtime-loop"
import { createMessageProducer, UpdateUnreliable } from "@javelin/net"
import { decode, encode } from "@msgpack/msgpack"
import { Server } from "@web-udp/server"
import dotenv from "dotenv"
import { createServer } from "http"
import {
  ConnectionMetadata,
  ConnectionType,
  InputBuffer,
  maintainPhysicsSubsystem,
  physicsTopic,
  Player,
  ServerDetails,
  Simulate,
  stepPhysicsSubsystem,
  Transform,
  Velocity,
  Sphere,
  Box,
  Mass,
} from "../../common"
import { createClient } from "./client"
import { applyPlayerInputSystem } from "./systems"
import { Client, ClientState } from "./types"
import { createArenaMap } from "./maps"

dotenv.config()

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
const twilioClient = require("twilio")(twilioAccountSid, twilioAuthToken)

const port = Number(process.env.PORT)
const tickRate = Number(process.env.TICK_RATE)
const sendRate = Number(process.env.SEND_RATE)

if (Number.isNaN(port)) throw new Error("Invalid PORT")
if (Number.isNaN(tickRate)) throw new Error("Invalid TICK_RATE")
if (Number.isNaN(sendRate)) throw new Error("Invalid SEND_RATE")

const networkedComponents = [
  { type: Transform, priority: 1 },
  { type: Velocity, priority: 1 },
  { type: Sphere },
  { type: Box },
  { type: Player },
  { type: ServerDetails },
  { type: Mass },
]

const messageProducer = createMessageProducer({
  components: networkedComponents,
  updateInterval: (1 / sendRate) * 1000,
  updateSize: 1000,
})

const world = createWorld({
  componentTypes: [
    ...networkedComponents.map(c => c.type),
    InputBuffer,
    Simulate,
  ],
  systems: [
    maintainPhysicsSubsystem,
    applyPlayerInputSystem,
    stepPhysicsSubsystem,
  ],
})

createArenaMap(world)

world.spawn(world.component(ServerDetails, tickRate, sendRate))
world.tick({ dt: 0, tick: 0, now: 0 })

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Origin, X-Requested-With, Content-Type, Accept",
  "Content-Type": "application/json",
}

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/ice") {
    twilioClient.tokens
      .create()
      .then((token: any) => {
        res.writeHead(200, headers)
        res.write(JSON.stringify({ iceServers: token.iceServers }))
        res.end()
      })
      .catch((err: Error) => {
        res.writeHead(500, headers)
        res.write(JSON.stringify({ error: err.message }))
        res.end()
      })
  }
})

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
  const actor = world.spawn(
    world.component(Transform, Math.random() * 10, Math.random() * 10, 10),
    world.component(Velocity),
    world.component(Simulate),
    world.component(Sphere),
    world.component(Mass, 10),
  )
  const player = world.spawn(
    world.component(Player, client.id, actor),
    world.component(InputBuffer),
  )

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

    try {
      const inputBuffer = world.tryGetComponent(
        client.playerEntity,
        InputBuffer,
      )

      if (!inputBuffer) {
        continue
      }

      for (const message of client.messages) {
        inputBuffer.inputs.push(message as number[])
      }

      mutableEmpty(client.messages)
    } catch (err) {
      // Client may not be fully initialized yet.
    }
  }

  world.tick(clock)

  const messagesReliable = messageProducer.getReliableMessages(world)
  const messagesReliableEncoded = encode(messagesReliable)
  const messagesUnreliable = messageProducer.getUnreliableMessages(world)

  for (const client of clients) {
    switch (client.state) {
      case ClientState.Connected:
        client.connections[ConnectionType.Reliable].send(
          encode(messageProducer.getInitialMessages(world)),
        )
        client.state = ClientState.Initialized
        break
      case ClientState.Initialized: {
        if (messagesReliable.length > 0) {
          client.connections[ConnectionType.Reliable].send(
            messagesReliableEncoded,
          )
        }

        const inputBuffer = world.getComponent(client.playerEntity, InputBuffer)

        if (!inputBuffer) {
          break
        }

        if (messagesUnreliable.length > 0) {
          const clientUnreliableMessages = messagesUnreliable.map(
            updateUnreliable => {
              const update = updateUnreliable.slice() as UpdateUnreliable
              update[2] = inputBuffer.lastInput[7]
              return update
            },
          )

          client.connections[ConnectionType.Unreliable].send(
            encode(clientUnreliableMessages),
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
