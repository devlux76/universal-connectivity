import { TOPICS } from '@/lib/constants'
import type { Message } from '@libp2p/interface'
import type { ChatMessage, RoomState } from './types'

export const handleChatMessage = (
  evt: CustomEvent<Message>,
  topic: string,
  data: Uint8Array,
  activeRoomId: string,
  setRooms: (rooms: Record<string, RoomState> | ((prev: Record<string, RoomState>) => Record<string, RoomState>)) => void
) => {
  const msg = new TextDecoder().decode(data)

  if (evt.detail.type === 'signed') {
    const newMessage: ChatMessage = {
      msgId: crypto.randomUUID(),
      msg,
      fileObjectUrl: undefined,
      peerId: evt.detail.from.toString(),
      read: false,
      receivedAt: Date.now(),
      roomId: topic
    }

    const roomId =
      topic === TOPICS.ROOMS.LOBBY
        ? 'lobby'
        : topic.startsWith(TOPICS.ROOMS.PREFIX)
          ? topic.slice(TOPICS.ROOMS.PREFIX.length)
          : topic

    setRooms((prev) => ({
      ...prev,
      [roomId]: {
        ...(prev[roomId] || { messages: [], unread: 0, joined: true }),
        messages: [...(prev[roomId]?.messages || []), newMessage],
        unread: roomId !== activeRoomId ? (prev[roomId]?.unread || 0) + 1 : 0
      }
    }))
  }
}
