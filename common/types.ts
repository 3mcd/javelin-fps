// net

export type ConnectionMetadata = {
  clientId: string
  connectionType: ConnectionType
}

export enum ConnectionType {
  Reliable,
  Unreliable,
}

// game

export enum ComponentTypes {
  // common
  Box,
  Mass,
  Player,
  ServerDetails,
  Simulate,
  Sphere,
  Transform,
  Velocity,
  // client
  ClientData,
  ClientTransform,
  InputBuffer,
  InterpolationBuffer,
}
