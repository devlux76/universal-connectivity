import { ChatMessage, ChatFile, RoomType, DirectMessages, RoomUnreads, RoomState } from './types'

// Room actions
export const roomActions = {
  setRooms: (rooms: Record<string, RoomState>) => ({
    type: 'SET_ROOMS' as const,
    payload: rooms,
  }),

  addMessage: (roomId: string, message: ChatMessage) => ({
    type: 'ADD_MESSAGE' as const,
    payload: { roomId, message },
  }),

  clearUnread: (roomId: string) => ({
    type: 'CLEAR_UNREAD' as const,
    payload: roomId,
  }),

  setActiveRoom: (roomId: string) => ({
    type: 'SET_ACTIVE_ROOM' as const,
    payload: roomId,
  }),

  setRoomType: (roomType: RoomType) => ({
    type: 'SET_ROOM_TYPE' as const,
    payload: roomType,
  }),
}

// Direct message actions
export const dmActions = {
  addDirectMessage: (peerId: string, message: ChatMessage) => ({
    type: 'ADD_DIRECT_MESSAGE' as const,
    payload: { peerId, message },
  }),

  setDirectMessages: (messages: DirectMessages) => ({
    type: 'SET_DIRECT_MESSAGES' as const,
    payload: messages,
  }),

  markAsRead: (peerId: string, msgId: string) => ({
    type: 'MARK_DM_AS_READ' as const,
    payload: { peerId, msgId },
  }),
}

// File actions
export const fileActions = {
  addFile: (file: ChatFile) => ({
    type: 'ADD_FILE' as const,
    payload: file,
  }),

  setFiles: (files: Map<string, ChatFile>) => ({
    type: 'SET_FILES' as const,
    payload: files,
  }),
}

// History actions
export const historyActions = {
  addToHistory: (message: ChatMessage) => ({
    type: 'ADD_TO_HISTORY' as const,
    payload: message,
  }),

  setHistory: (messages: ChatMessage[]) => ({
    type: 'SET_HISTORY' as const,
    payload: messages,
  }),

  markHistoryAsRead: (msgId: string) => ({
    type: 'MARK_HISTORY_AS_READ' as const,
    payload: msgId,
  }),
}

// Unread actions
export const unreadActions = {
  setRoomUnreads: (unreads: RoomUnreads) => ({
    type: 'SET_ROOM_UNREADS' as const,
    payload: unreads,
  }),

  incrementUnread: (roomId: string) => ({
    type: 'INCREMENT_UNREAD' as const,
    payload: roomId,
  }),
}

export const chatActions = {
  ...roomActions,
  ...dmActions,
  ...fileActions,
  ...historyActions,
  ...unreadActions,
}

export type ChatAction = ReturnType<(typeof chatActions)[keyof typeof chatActions]>
