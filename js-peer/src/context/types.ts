import type { ChatFile } from './file-handler'

export interface ChatMessage {
  msgId: string
  msg: string
  fileObjectUrl: string | undefined
  peerId: string
  read: boolean
  receivedAt: number
  roomId?: string
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

export interface ChatContextInterface {
  rooms: Record<string, RoomState>
  setRooms: (rooms: Record<string, RoomState> | ((prev: Record<string, RoomState>) => Record<string, RoomState>)) => void
  activeRoomId: string
  setActiveRoomId: (roomId: string) => void
  roomType: RoomType
  setRoomType: (type: RoomType) => void
  directMessages: DirectMessages
  setDirectMessages: (directMessages: DirectMessages | ((prevMessages: DirectMessages) => DirectMessages)) => void
  files: Map<string, ChatFile>
  setFiles: (files: Map<string, ChatFile>) => void
  roomUnreads: RoomUnreads
  setRoomUnreads: (unread: RoomUnreads | ((prev: RoomUnreads) => RoomUnreads)) => void
  messageHistory: ChatMessage[]
  setMessageHistory: (messages: ChatMessage[]) => void
}
