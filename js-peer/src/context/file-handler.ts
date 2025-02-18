import { pipe } from 'it-pipe'
import map from 'it-map'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { forComponent } from '@/lib/logger'
import { FILE_EXCHANGE_PROTOCOL } from '@/lib/constants'
import type { Message } from '@libp2p/interface'
import type { ChatMessage, RoomState } from './types'

const log = forComponent('file-handler')

export interface ChatFile {
  id: string
  body: Uint8Array
  sender: string
}

export const handleFileMessage = async (
  evt: CustomEvent<Message>,
  topic: string,
  data: Uint8Array,
  libp2p: any,
  activeRoomId: string,
  files: Map<string, ChatFile>,
  setFiles: (files: Map<string, ChatFile>) => void,
  setRooms: (rooms: Record<string, RoomState> | ((prev: Record<string, RoomState>) => Record<string, RoomState>)) => void
) => {
  const newChatFileMessage = (id: string, body: Uint8Array) => {
    return `File: ${id} (${body.length} bytes)`
  }
  
  const fileId = new TextDecoder().decode(data)
  if (evt.detail.type !== 'signed') return

  try {
    const stream = await libp2p.dialProtocol(evt.detail.from, FILE_EXCHANGE_PROTOCOL)
    const chunks = await pipe(
      [fileId],
      (source) => map(source, (str) => uint8ArrayFromString(str)),
      stream,
      async (source) => {
        const chunks: Uint8Array[] = []
        for await (const chunk of source) {
          chunks.push(new Uint8Array(chunk.subarray()))
        }
        return chunks
      }
    )

    const body = chunks[0]
    const chatFile: ChatFile = {
      id: fileId,
      body,
      sender: evt.detail.from.toString()
    }

    setFiles(new Map(files).set(fileId, chatFile))

    const newMessage: ChatMessage = {
      msgId: crypto.randomUUID(),
      msg: newChatFileMessage(fileId, body),
      fileObjectUrl: window.URL.createObjectURL(new Blob([body])),
      peerId: evt.detail.from.toString(),
      read: false,
      receivedAt: Date.now(),
      roomId: activeRoomId
    }

    setRooms((prev) => ({
      ...prev,
      [activeRoomId]: {
        ...prev[activeRoomId],
        messages: [...(prev[activeRoomId]?.messages || []), newMessage],
        unread: 0
      }
    }))
  } catch (err) {
    log('Failed to retrieve file:', err)
  }
}
