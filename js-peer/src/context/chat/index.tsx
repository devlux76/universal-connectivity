import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLibp2pContext } from '../ctx'
import type { Message } from '@libp2p/interface'
import { TOPICS, FILE_EXCHANGE_PROTOCOL, MIME_TEXT_PLAIN } from '@/lib/constants'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { pipe } from 'it-pipe'
import map from 'it-map'
import * as lp from 'it-length-prefixed'
import { forComponent } from '@/lib/logger'
import { DirectMessageEvent, directMessageEvent } from '@/lib/messages'
import { ChatContextValue, ChatMessage, ChatState } from './types'
import { produce } from 'immer'
import { rootReducer } from './reducers'

const log = forComponent('chat-context')

const initialState: ChatState = {
  rooms: { lobby: { messages: [], unread: 0, joined: true } },
  activeRoomId: 'lobby',
  roomType: 'topic',
  directMessages: {},
  files: new Map(),
  roomUnreads: {},
  messageHistory: []
}

export const chatContext = createContext<ChatContextValue>({
  ...initialState,
  setRooms: () => {},
  setActiveRoomId: () => {},
  setRoomType: () => {},
  setDirectMessages: () => {},
  setFiles: () => {},
  setRoomUnreads: () => {},
  setMessageHistory: () => {}
})

export const useChatContext = () => useContext(chatContext)

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { libp2p } = useLibp2pContext()
  const [state, setState] = useState<ChatState>(initialState)

  const updateState = useCallback((fn: (draft: ChatState) => void) => {
    setState(produce(fn))
  }, [])

  const chatMessageCB = useCallback((evt: CustomEvent<Message>, topic: string, data: Uint8Array) => {
    const msg = new TextDecoder().decode(data)
    log(`${topic}: ${msg}`)

    if (evt.detail.type === 'signed') {
      const message: ChatMessage = {
        msgId: crypto.randomUUID(),
        msg,
        fileObjectUrl: undefined,
        peerId: evt.detail.from.toString(),
        read: false,
        receivedAt: Date.now(),
        roomId: topic
      }

      updateState(draft => {
        const roomId = topic === TOPICS.ROOMS.LOBBY ? 'lobby' : 
          topic.startsWith(TOPICS.ROOMS.PREFIX) ? topic.slice(TOPICS.ROOMS.PREFIX.length) : topic

        rootReducer.addMessageToRoom(draft, roomId, message)
      })
    }
  }, [updateState])

  const chatFileMessageCB = useCallback(async (evt: CustomEvent<Message>, topic: string, data: Uint8Array) => {
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
      
      updateState(draft => {
        rootReducer.addFile(draft, fileId, {
          body,
          sender: evt.detail.from.toString()
        })

        const message: ChatMessage = {
          msgId: crypto.randomUUID(),
          msg: `File: ${fileId} (${body.length} bytes)`,
          fileObjectUrl: window.URL.createObjectURL(new Blob([body])),
          peerId: evt.detail.from.toString(),
          read: false,
          receivedAt: Date.now(),
          roomId: state.activeRoomId
        }

        rootReducer.addMessageToRoom(draft, state.activeRoomId, message)
      })
    } catch (err) {
      log('Failed to retrieve file:', err)
    }
  }, [libp2p, state.activeRoomId, updateState])

  const handleDirectMessage = useCallback((evt: CustomEvent<DirectMessageEvent>) => {
    if (evt.detail.type !== MIME_TEXT_PLAIN) return

    const message: ChatMessage = {
      msgId: crypto.randomUUID(),
      msg: evt.detail.content,
      fileObjectUrl: undefined,
      peerId: evt.detail.connection.remotePeer.toString(),
      read: false,
      receivedAt: Date.now(),
      roomId: `peer:${evt.detail.connection.remotePeer.toString()}`
    }

    updateState(draft => {
      rootReducer.addDirectMessage(draft, evt.detail.connection.remotePeer.toString(), message)
    })
  }, [updateState])

  useEffect(() => {
    if (!libp2p?.services?.pubsub) return

    // Subscribe to the lobby and file topics
    libp2p.services.pubsub.subscribe(TOPICS.ROOMS.LOBBY)
    TOPICS.FILE.forEach(topic => libp2p.services.pubsub.subscribe(topic))
    TOPICS.PEER_DISCOVERY.forEach(topic => libp2p.services.pubsub.subscribe(topic))

    // Add event listeners
    libp2p.services.pubsub.addEventListener('message', messageCB)
    libp2p.services.directMessage.addEventListener(directMessageEvent, handleDirectMessage)

    // Set up file protocol handler
    libp2p.handle(FILE_EXCHANGE_PROTOCOL, ({ stream }) => {
      pipe(
        stream.source,
        (source) => lp.decode(source),
        (source) =>
          map(source, async (msg) => {
            const fileId = uint8ArrayToString(msg.subarray())
            const file = state.files.get(fileId)!
            return file.body
          }),
        (source) => lp.encode(source),
        stream.sink
      )
    })

    return () => {
      // Cleanup
      libp2p.services.pubsub.removeEventListener('message', messageCB)
      libp2p.services.directMessage.removeEventListener(directMessageEvent, handleDirectMessage)
      libp2p.services.pubsub.unsubscribe(TOPICS.ROOMS.LOBBY)
      TOPICS.FILE.forEach(topic => libp2p.services.pubsub.unsubscribe(topic))
      TOPICS.PEER_DISCOVERY.forEach(topic => libp2p.services.pubsub.unsubscribe(topic))
      libp2p.unhandle(FILE_EXCHANGE_PROTOCOL)
    }
  }, [libp2p, messageCB, handleDirectMessage, state.files])

  const contextValue: ChatContextValue = {
    ...state,
    setRooms: (rooms) => updateState(draft => {
      draft.rooms = typeof rooms === 'function' ? rooms(draft.rooms) : rooms
    }),
    setActiveRoomId: (roomId) => updateState(draft => {
      draft.activeRoomId = roomId
    }),
    setRoomType: (type) => updateState(draft => {
      draft.roomType = type
    }),
    setDirectMessages: (messages) => updateState(draft => {
      draft.directMessages = typeof messages === 'function' ? messages(draft.directMessages) : messages
    }),
    setFiles: (files) => updateState(draft => {
      draft.files = files
    }),
    setRoomUnreads: (unreads) => updateState(draft => {
      draft.roomUnreads = typeof unreads === 'function' ? unreads(draft.roomUnreads) : unreads
    }),
    setMessageHistory: (messages) => updateState(draft => {
      draft.messageHistory = messages
    })
  }

  return (
    <chatContext.Provider value={contextValue}>
      {children}
    </chatContext.Provider>
  )
}