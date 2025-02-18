import type { Message } from '@libp2p/interface'
import type { Libp2p } from '@libp2p/interface'

export interface ChatMessage {
  msgId: string
  msg: string
  fileObjectUrl: string | undefined
  peerId: string
  read: boolean
  receivedAt: number
  roomId?: string
}

export interface ChatFile {
  id: string
  body: Uint8Array
  sender: string
}

export interface DirectMessages {
  [peerId: string]: ChatMessage[]
}

export type RoomType = 'dm' | 'topic'

export interface RoomUnreads {
  [roomId: string]: number
}

export interface RoomState {
  messages: ChatMessage[]
  unread: number
  joined: boolean
}

export interface ChatState {
  rooms: Record<string, RoomState>
  activeRoomId: string
  roomType: RoomType
  directMessages: DirectMessages
  files: Map<string, ChatFile>
  roomUnreads: RoomUnreads
  messageHistory: ChatMessage[]
}

export interface ChatContextValue extends ChatState {
  setRooms: (rooms: Record<string, RoomState> | ((prev: Record<string, RoomState>) => Record<string, RoomState>)) => void
  setActiveRoomId: (roomId: string) => void
  setRoomType: (type: RoomType) => void
  setDirectMessages: (directMessages: DirectMessages | ((prevMessages: DirectMessages) => DirectMessages)) => void
  setFiles: (files: Map<string, ChatFile>) => void
  setRoomUnreads: (unread: RoomUnreads | ((prev: RoomUnreads) => RoomUnreads)) => void
  setMessageHistory: (messages: ChatMessage[]) => void
}