import React, { createContext, useContext, useEffect, useState } from 'react'
import { useLibp2pContext } from './ctx'
import type { Message } from '@libp2p/interface'
import {
  TOPICS,
  FILE_EXCHANGE_PROTOCOL,
  MIME_TEXT_PLAIN,
} from '@/lib/constants'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { pipe } from 'it-pipe'
import map from 'it-map'
import * as lp from 'it-length-prefixed'
import { forComponent } from '@/lib/logger'
import { DirectMessageEvent, directMessageEvent } from '@/lib/direct-message'

const log = forComponent('chat-context')

export interface ChatMessage {
  msgId: string
  msg: string
  fileObjectUrl: string | undefined
  peerId: string
  read: boolean
  receivedAt: number
  roomId?: string  // Add optional roomId to track which room a message belongs to
}

export interface ChatFile {
  id: string
  body: Uint8Array
  sender: string
}

export interface DirectMessages {
  [peerId: string]: ChatMessage[]
}

type Chatroom = string

export type RoomType = 'public' | 'topic' | 'dm'

export interface RoomUnreads {
  [roomId: string]: number
}

export interface ChatContextInterface {
  rooms: Record<string, RoomState>
  setRooms: (rooms: Record<string, RoomState> | ((prev: Record<string, RoomState>) => Record<string, RoomState>)) => void
  activeRoomId: string
  setActiveRoomId: (roomId: string) => void
  directMessages: DirectMessages
  setDirectMessages: (directMessages: DirectMessages | ((prevMessages: DirectMessages) => DirectMessages)) => void
  files: Map<string, ChatFile>
  setFiles: (files: Map<string, ChatFile>) => void
}

export const chatContext = createContext<ChatContextInterface>({
  messageHistory: [],
  setMessageHistory: () => {},
  directMessages: {},
  setDirectMessages: () => {},
  roomId: '',
  setRoomId: () => {},
  roomType: 'public',
  setRoomType: () => {},
  files: new Map<string, ChatFile>(),
  setFiles: () => {},
  roomUnreads: {},
  setRoomUnreads: () => {},
})

export const useChatContext = () => {
  return useContext(chatContext)
}

interface RoomState {
  messages: ChatMessage[];
  unread: number;
  joined: boolean;
}

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [rooms, setRooms] = useState<Record<string, RoomState>>({ 
    lobby: { messages: [], unread: 0, joined: true } 
  })
  const [directMessages, setDirectMessages] = useState<DirectMessages>({})
  const [files, setFiles] = useState<Map<string, ChatFile>>(new Map<string, ChatFile>())
  const [activeRoomId, setActiveRoomId] = useState<string>('lobby')

  const { libp2p } = useLibp2pContext()

  const messageCB = (evt: CustomEvent<Message>) => {
    const { topic, data } = evt.detail
    // Type assertion to match the const-asserted topic types
    const topicStr = topic as typeof TOPICS.CHAT[number] | typeof TOPICS.FILE[number] | typeof TOPICS.PEER_DISCOVERY[number];

    if (TOPICS.CHAT.includes(topicStr as typeof TOPICS.CHAT[number])) {
      chatMessageCB(evt, topic, data)
    } else if (TOPICS.FILE.includes(topicStr as typeof TOPICS.FILE[number])) {
      chatFileMessageCB(evt, topic, data)
    } else if (TOPICS.PEER_DISCOVERY.includes(topicStr as typeof TOPICS.PEER_DISCOVERY[number])) {
      // Do nothing for peer discovery topics
    } else {
      // Handle custom topic messages
      chatMessageCB(evt, topic, data)
    }
  }

  const chatMessageCB = (evt: CustomEvent<Message>, topic: string, data: Uint8Array) => {
    const msg = new TextDecoder().decode(data)
    log(`${topic}: ${msg}`)

    // Append signed messages, otherwise discard
    if (evt.detail.type === 'signed') {
      const newMessage = {
        msgId: crypto.randomUUID(),
        msg,
        fileObjectUrl: undefined,
        peerId: evt.detail.from.toString(),
        read: false,
        receivedAt: Date.now(),
        roomId: topic
      }

      // Determine which room this message belongs to
      const roomId = topic === TOPICS.ROOMS.LOBBY ? 'lobby' : 
        topic.startsWith(TOPICS.ROOMS.PREFIX) ? topic.slice(TOPICS.ROOMS.PREFIX.length) : topic;

      // Add message to room and update unread count if not in the active room
      setRooms(prev => ({
        ...prev,
        [roomId]: {
          ...prev[roomId] || { messages: [], unread: 0, joined: true },
          messages: [...(prev[roomId]?.messages || []), newMessage],
          unread: roomId !== activeRoomId ? (prev[roomId]?.unread || 0) + 1 : 0
        }))
      }
    }
  }

  const chatFileMessageCB = async (evt: CustomEvent<Message>, topic: string, data: Uint8Array) => {
    const newChatFileMessage = (id: string, body: Uint8Array) => {
      return `File: ${id} (${body.length} bytes)`
    }
    const fileId = new TextDecoder().decode(data)

    // if the message isn't signed, discard it.
    if (evt.detail.type !== 'signed') {
      return
    }
    const senderPeerId = evt.detail.from

    try {
      const stream = await libp2p.dialProtocol(senderPeerId, FILE_EXCHANGE_PROTOCOL)
      await pipe(
        [uint8ArrayFromString(fileId)],
        (source) => lp.encode(source),
        stream,
        (source) => lp.decode(source),
        async function (source) {
          for await (const data of source) {
            const body: Uint8Array = data.subarray()
            log(`chat file message request_response: response received: size:${body.length}`)

            const msg: ChatMessage = {
              msgId: crypto.randomUUID(),
              msg: newChatFileMessage(fileId, body),
              fileObjectUrl: window.URL.createObjectURL(new Blob([body])),
              peerId: senderPeerId.toString(),
              read: false,
              receivedAt: Date.now(),
              roomId: topic
            }
            setMessageHistory([...messageHistory, msg])
          }
        },
      )
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const handleDirectMessage = (evt: CustomEvent<DirectMessageEvent>) => {
      const peerId = evt.detail.connection.remotePeer.toString()

      if (evt.detail.type !== MIME_TEXT_PLAIN) {
        throw new Error(`unexpected message type: ${evt.detail.type}`)
      }

      const message: ChatMessage = {
        msg: evt.detail.content,
        read: false,
        msgId: crypto.randomUUID(),
        fileObjectUrl: undefined,
        peerId: peerId,
        receivedAt: Date.now(),
        roomId: peerId // For DMs, the roomId is the peer's ID
      }

      const updatedMessages = directMessages[peerId] ? [...directMessages[peerId], message] : [message]

      setDirectMessages({
        ...directMessages,
        [peerId]: updatedMessages,
      })
    }

    libp2p.services.directMessage.addEventListener(directMessageEvent, handleDirectMessage)

    return () => {
      libp2p.services.directMessage.removeEventListener(directMessageEvent, handleDirectMessage)
    }
  }, [directMessages, libp2p.services.directMessage, setDirectMessages])

  useEffect(() => {
    libp2p.services.pubsub.addEventListener('message', messageCB)

    libp2p.handle(FILE_EXCHANGE_PROTOCOL, ({ stream }) => {
      pipe(
        stream.source,
        (source) => lp.decode(source),
        (source) =>
          map(source, async (msg) => {
            const fileId = uint8ArrayToString(msg.subarray())
            const file = files.get(fileId)!
            return file.body
          }),
        (source) => lp.encode(source),
        stream.sink,
      )
    })

    return () => {
      ;(async () => {
        // Cleanup handlers 👇
        libp2p.services.pubsub.removeEventListener('message', messageCB)
        await libp2p.unhandle(FILE_EXCHANGE_PROTOCOL)
      })()
    }
  })

  return (
    <chatContext.Provider
      value={{
        roomId,
        setRoomId,
        roomType,
        setRoomType,
        messageHistory,
        setMessageHistory,
        directMessages,
        setDirectMessages,
        files,
        setFiles,
        roomUnreads,
        setRoomUnreads,
      }}
    >
      {children}
    </chatContext.Provider>
  )
}
