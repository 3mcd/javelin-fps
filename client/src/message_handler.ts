import { createMessageHandler } from "@javelin/net"
import { reconcile } from "./utils"

export const messageHandler = createMessageHandler({
  processUnreliableUpdates(updates, world) {
    reconcile(updates, world, messageHandler)
  },
})
