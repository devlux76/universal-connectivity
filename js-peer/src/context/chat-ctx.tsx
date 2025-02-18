import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useLibp2pContext } from './ctx'
import type { Message } from '@libp2p/interface'
import { TOPICS } from '@/lib/constants'
import { forComponent } from '@/lib/logger'
import { directMessageEvent } from '@/lib/messages'
import type { ChatContextInterface, DirectMessages, RoomState, RoomType, RoomUnreads, ChatMessage } from './types'
import { handleChatMessage } from './message-handlers'
import { handleDirectMessage } from './direct-message-handler'
import { handleFileMessage } from './file-handler'
import type { ChatFile } from './file-handler'

const log = forComponent('chat-context')

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
  setRoomUnreads: () => {},
  messageHistory: [],
  setMessageHistory: () => {},
})

export const useChatContext = () => useContext(chatContext)

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [rooms, setRooms] = useState<Record<string, RoomState>>({
    lobby: { messages: [], unread: 0, joined: true },
  })
  const [directMessages, setDirectMessages] = useState<DirectMessages>({})
  const [files, setFiles] = useState<Map<string, ChatFile>>(new Map())
  const [activeRoomId, setActiveRoomId] = useState<string>('lobby')
  const [roomType, setRoomType] = useState<RoomType>('topic')
  const [roomUnreads, setRoomUnreads] = useState<RoomUnreads>({})
  const [messageHistory, setMessageHistory] = useState<ChatMessage[]>([])
  const { libp2p } = useLibp2pContext()

  const chatMessageCB = useCallback(
    (evt: CustomEvent<Message>, topic: string, data: Uint8Array) => {
      log(`${topic}: ${new TextDecoder().decode(data)}`)
      handleChatMessage(evt, topic, data, activeRoomId, setRooms)
    },
    [activeRoomId]
  )

  const chatFileMessageCB = useCallback(
    (evt: CustomEvent<Message>, topic: string, data: Uint8Array) => {
      handleFileMessage(evt, topic, data, libp2p, activeRoomId, files, setFiles, setRooms)
    },
    [libp2p, activeRoomId, files]
  )

  useEffect(() => {
    if (!libp2p) return

    const unsubscribeChat = libp2p.services.pubsub.subscribe(TOPICS.CHAT_TOPIC)
    const unsubscribeFile = libp2p.services.pubsub.subscribe(TOPICS.CHAT_FILE_TOPIC)

    libp2p.services.pubsub.addEventListener('message', (evt: CustomEvent<Message>) => {
      const { topic } = evt.detail
      if (topic === TOPICS.CHAT_TOPIC) {
        chatMessageCB(evt, topic, evt.detail.data)
      } else if (topic === TOPICS.CHAT_FILE_TOPIC) {
        chatFileMessageCB(evt, topic, evt.detail.data)
      }
    })

    window.addEventListener(directMessageEvent, ((evt: CustomEvent) => {
      handleDirectMessage(evt, setDirectMessages)
    }) as EventListener)

    return () => {
      unsubscribeChat()
      unsubscribeFile()
    }
  }, [libp2p, chatMessageCB, chatFileMessageCB])

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
        setRoomUnreads,
        messageHistory,
        setMessageHistory,
      }}
    >
      {children}
    </chatContext.Provider>
  )
}
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
    },
    [chatMessageCB, chatFileMessageCB],
  )

  const handleDirectMessage = useCallback(
    (evt: CustomEvent<DirectMessageEvent>) => {
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
        roomId: `peer:${evt.detail.connection.remotePeer.toString()}`,
      }

      setDirectMessages((prev) => ({
        ...prev,
        [evt.detail.connection.remotePeer.toString()]: [
          ...(prev[evt.detail.connection.remotePeer.toString()] || []),
          newMessage,
        ],
      }))
    },
    [setDirectMessages],
  )

  useEffect(() => {
    if (!libp2p?.services?.pubsub) return

    // Subscribe to the lobby and file topics
    libp2p.services.pubsub.subscribe(TOPICS.ROOMS.LOBBY)
    TOPICS.FILE.forEach((topic) => libp2p.services.pubsub.subscribe(topic))
    TOPICS.PEER_DISCOVERY.forEach((topic) => libp2p.services.pubsub.subscribe(topic))

    // Add event listeners
    libp2p.services.pubsub.addEventListener('message', messageCB)
    libp2p.services.directMessage.addEventListener(directMessageEvent, handleDirectMessage)

    return () => {
      // Cleanup event listeners
      libp2p.services.pubsub.removeEventListener('message', messageCB)
      libp2p.services.directMessage.removeEventListener(directMessageEvent, handleDirectMessage)

      // Unsubscribe from topics
      libp2p.services.pubsub.unsubscribe(TOPICS.ROOMS.LOBBY)
      TOPICS.FILE.forEach((topic) => libp2p.services.pubsub.unsubscribe(topic))
      TOPICS.PEER_DISCOVERY.forEach((topic) => libp2p.services.pubsub.unsubscribe(topic))
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
        setRoomUnreads,
        messageHistory,
        setMessageHistory,
      }}
    >
      {children}
    </chatContext.Provider>
  )
}
