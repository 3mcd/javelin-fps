import { Connection } from "@web-udp/client"
import { ConnectionType } from "../../common"
import { Client, ClientState } from "./types"

export const createClient = (
  clientId: string,
  connection: Connection,
  connectionType: ConnectionType,
): Client => ({
  connections: { [connectionType]: connection },
  id: clientId,
  state: ClientState.Connecting,
  seq: 0,
  messages: [],
  playerEntity: null,
})
