import { ChatMessage, ChatState } from './types'
import { Draft } from 'immer'

// Room reducers
export const roomReducers = {
  addMessageToRoom: (state: Draft<ChatState>, roomId: string, message: ChatMessage) => {
    const room = state.rooms[roomId] || { messages: [], unread: 0, joined: true }
    room.messages.push(message)
    room.unread = roomId !== state.activeRoomId ? room.unread + 1 : 0
    state.rooms[roomId] = room
  },

  clearRoomUnread: (state: Draft<ChatState>, roomId: string) => {
    if (state.rooms[roomId]) {
      state.rooms[roomId].unread = 0
    }
  },

  addRoom: (state: Draft<ChatState>, roomId: string) => {
    if (!state.rooms[roomId]) {
      state.rooms[roomId] = {
        messages: [],
        unread: 0,
        joined: true,
      }
    }
  },
}

// Direct message reducers
export const dmReducers = {
  addDirectMessage: (state: Draft<ChatState>, peerId: string, message: ChatMessage) => {
    const messages = state.directMessages[peerId] || []
    messages.push(message)
    state.directMessages[peerId] = messages
  },

  markDirectMessageAsRead: (state: Draft<ChatState>, peerId: string, msgId: string) => {
    const messages = state.directMessages[peerId]
    if (messages) {
      state.directMessages[peerId] = messages.map((m) => (m.msgId === msgId ? { ...m, read: true } : m))
    }
  },
}

// File reducers
export const fileReducers = {
  addFile: (state: Draft<ChatState>, fileId: string, fileData: { body: Uint8Array; sender: string }) => {
    state.files.set(fileId, {
      id: fileId,
      ...fileData,
    })
  },

  removeFile: (state: Draft<ChatState>, fileId: string) => {
    state.files.delete(fileId)
  },
}

// History reducers
export const historyReducers = {
  addToHistory: (state: Draft<ChatState>, message: ChatMessage) => {
    state.messageHistory.push(message)
  },

  markHistoryAsRead: (state: Draft<ChatState>, msgId: string) => {
    state.messageHistory = state.messageHistory.map((m) => (m.msgId === msgId ? { ...m, read: true } : m))
  },
}

// Root reducer that combines all reducers
export const rootReducer = {
  ...roomReducers,
  ...dmReducers,
  ...fileReducers,
  ...historyReducers,
}
