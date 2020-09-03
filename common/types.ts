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
  Player,
  ServerDetails,
  Simulate,
  Sphere,
  Transform,
  Velocity,
  // client
  BodyBuffer,
  ClientData,
  ClientTransform,
  InputBuffer,
  InterpolationBuffer,
}
