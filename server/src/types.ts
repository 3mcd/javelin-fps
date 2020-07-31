import { Connection } from "@web-udp/client"
import { ConnectionType } from "../../common"

export enum ClientState {
  Connecting,
  Connected,
  Initialized,
  Disconnected,
}

export type Client = {
  connections: { [K in ConnectionType]?: Connection }
  messages: unknown[]
  id: string
  seq: number
  state: ClientState
  playerEntity: number | null
}
