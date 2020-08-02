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
  Player,
  ServerDetails,
  Input,
  MovementState,
  // client
  ClientData,
  InputBuffer,
  InterpolatedTransform,
}
