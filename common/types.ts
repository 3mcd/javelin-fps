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
  Body,
  Input,
  Player,
  ServerDetails,
  Simulate,
  // client
  BodyBuffer,
  ClientData,
  ClientTransform,
  InputBuffer,
  InterpolationBuffer,
}
