import { ConnectionType } from "../../common"

export function getConnectionOptions(clientId: string) {
  return {
    reliable: {
      maxPacketLifeTime: 5000,
      maxRetransmits: 5,
      UNSAFE_ordered: true,
      metadata: {
        clientId,
        connectionType: ConnectionType.Reliable,
      },
    },
    unreliable: {
      metadata: {
        clientId,
        connectionType: ConnectionType.Unreliable,
      },
    },
  }
}
