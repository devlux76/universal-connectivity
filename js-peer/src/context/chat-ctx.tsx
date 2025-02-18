import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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

// Simplified - we only need to distinguish DMs from topic-based messages
export type RoomType = 'dm' | 'topic'

export interface RoomUnreads {
  [roomId: string]: number
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
}

export const chatContext = createContext<ChatContextInterface>({
  rooms: { lobby: { messages: [], unread: 0, joined: true } },
  setRooms: () => {},
  activeRoomId: 'lobby',
  setActiveRoomId: () => {},
  roomType: 'topic',
  setRoomType: () => {},
  directMessages: {},
  setDirectMessages: () => {},
  files: new Map<string, ChatFile>(),
  setFiles: () => {},
  roomUnreads: {},
  setRoomUnreads: () => {}
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
  const [roomType, setRoomType] = useState<RoomType>('topic')
  const [roomUnreads, setRoomUnreads] = useState<RoomUnreads>({})

  const { libp2p } = useLibp2pContext()

  const chatMessageCB = useCallback((evt: CustomEvent<Message>, topic: string, data: Uint8Array) => {
    const msg = new TextDecoder().decode(data)
    log(`${topic}: ${msg}`)

    // Append signed messages, otherwise discard
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

      // Determine which room this message belongs to using standard topic handling
      const roomId = topic === TOPICS.ROOMS.LOBBY ? 'lobby' : 
        topic.startsWith(TOPICS.ROOMS.PREFIX) ? topic.slice(TOPICS.ROOMS.PREFIX.length) : topic;

      // Add message to room and update unread count if not in the active room
      setRooms(prev => ({
        ...prev,
        [roomId]: {
          ...prev[roomId] || { messages: [], unread: 0, joined: true },
          messages: [...(prev[roomId]?.messages || []), newMessage],
          unread: roomId !== activeRoomId ? (prev[roomId]?.unread || 0) + 1 : 0
        }
      }));
    }
  }, [activeRoomId, setRooms])

  const chatFileMessageCB = async (evt: CustomEvent<Message>, topic: string, data: Uint8Array) => {
    const newChatFileMessage = (id: string, body: Uint8Array) => {
      return `File: ${id} (${body.length} bytes)`
    }
    const fileId = new TextDecoder().decode(data)

    if (evt.detail.type !== 'signed') {
      return
    }

    try {
      const stream = await libp2p.dialProtocol(evt.detail.from, FILE_EXCHANGE_PROTOCOL)
      const chunks = await pipe(
        [fileId],
        (source) => map(source, (str) => uint8ArrayFromString(str)),
        stream,
        async (source) => {
          const chunks: Uint8Array[] = []
          for await (const chunk of source) {
            // Convert Uint8ArrayList to Uint8Array
            chunks.push(new Uint8Array(chunk.subarray()))
          }
          return chunks
        },
      )

      const body = chunks[0]
      const chatFile: ChatFile = {
        id: fileId,
        body,
        sender: evt.detail.from.toString(),
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

      setRooms(prev => ({
        ...prev,
        [activeRoomId]: {
          ...prev[activeRoomId],
          messages: [...(prev[activeRoomId]?.messages || []), newMessage],
          unread: 0
        }
      }));
    } catch (err) {
      log('Failed to retrieve file:', err)
    }
  }

  const messageCB = useCallback((evt: CustomEvent<Message>) => {
    const { topic, data } = evt.detail
    
    // Using type guards to check topic membership
    if (topic === TOPICS.ROOMS.LOBBY || topic.startsWith(TOPICS.ROOMS.PREFIX)) {
      chatMessageCB(evt, topic, data)
    } else if (topic === TOPICS.FILE[0]) {
      chatFileMessageCB(evt, topic, data)
    } else if (topic === TOPICS.PEER_DISCOVERY[0]) {
      // Do nothing for peer discovery topics
    } else {
      // Handle custom topic messages
      chatMessageCB(evt, topic, data)
    }
  }, [chatMessageCB])

  const handleDirectMessage = useCallback((evt: CustomEvent<DirectMessageEvent>) => {
    if (evt.detail.type !== MIME_TEXT_PLAIN) {
      return
    }

    const newMessage: ChatMessage = {
      msgId: crypto.randomUUID(),
      msg: evt.detail.content,
      fileObjectUrl: undefined,
      peerId: evt.detail.connection.remotePeer.toString(),
      read: false,
      receivedAt: Date.now(),
      roomId: `peer:${evt.detail.connection.remotePeer.toString()}`
    }

    setDirectMessages(prev => ({
      ...prev,
      [evt.detail.connection.remotePeer.toString()]: [...(prev[evt.detail.connection.remotePeer.toString()] || []), newMessage]
    }))
  }, [setDirectMessages])

  useEffect(() => {
    if (!libp2p?.services?.pubsub) return

    // Subscribe to the lobby and file topics
    libp2p.services.pubsub.subscribe(TOPICS.ROOMS.LOBBY)
    TOPICS.FILE.forEach(topic => libp2p.services.pubsub.subscribe(topic))
    TOPICS.PEER_DISCOVERY.forEach(topic => libp2p.services.pubsub.subscribe(topic))

    // Add event listeners
    libp2p.services.pubsub.addEventListener('message', messageCB)
    libp2p.services.directMessage.addEventListener(directMessageEvent, handleDirectMessage)

    return () => {
      // Cleanup event listeners
      libp2p.services.pubsub.removeEventListener('message', messageCB)
      libp2p.services.directMessage.removeEventListener(directMessageEvent, handleDirectMessage)

      // Unsubscribe from topics
      libp2p.services.pubsub.unsubscribe(TOPICS.ROOMS.LOBBY)
      TOPICS.FILE.forEach(topic => libp2p.services.pubsub.unsubscribe(topic))
      TOPICS.PEER_DISCOVERY.forEach(topic => libp2p.services.pubsub.unsubscribe(topic))
    }
  }, [libp2p, messageCB, handleDirectMessage])

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
        rooms,
        setRooms,
        activeRoomId,
        setActiveRoomId,
        roomType,
        setRoomType,
        directMessages,
        setDirectMessages,
        files,
        setFiles,
        roomUnreads,
        setRoomUnreads
      }}
    >
      {children}
    </chatContext.Provider>
  )
}
