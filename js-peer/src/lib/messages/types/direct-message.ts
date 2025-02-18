import type { Stream, Connection } from '@libp2p/interface'
import { ConnectionManager, Registrar } from '@libp2p/interface-internal'

export interface DirectMessageEvent {
  content: string
  type: string
  stream: Stream
  connection: Connection
}

export interface DirectMessageEvents {
  message: CustomEvent<DirectMessageEvent>
}

export interface DirectMessageComponents {
  registrar: Registrar
  connectionManager: ConnectionManager
}

// Protocol metadata
export interface Metadata {
  clientVersion: string
  timestamp: bigint
}

export interface DirectMessageRequest {
  metadata?: Metadata
  content: string
  type: string
}

export interface DirectMessageResponse {
  metadata?: Metadata
  status: Status
  statusText?: string
}

export enum Status {
  UNKNOWN = 'UNKNOWN',
  OK = 'OK',
  ERROR = 'ERROR',
}

export const StatusValues = {
  UNKNOWN: 0,
  OK: 200,
  ERROR: 500,
}
