import { useCallback } from 'react'
import { useChatContext } from '@/context/chat'
import type { ChatMessage, ChatFile, ChatState, DirectMessages, RoomUnreads } from '@/context/chat/types'
import { TOPICS, getRoomTopic } from '@/lib/constants'
import { useLibp2pContext } from '@/context/ctx'
import { forComponent } from '@/lib/logger'
import { peerIdFromString } from '@libp2p/peer-id'

const log = forComponent('chat-hooks')

export const useMessageHandling = () => {
  const { libp2p } = useLibp2pContext()
  const { setRooms, setDirectMessages, activeRoomId } = useChatContext()

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        if (activeRoomId.startsWith('peer:')) {
          // Direct message path
          const peerId = peerIdFromString(activeRoomId.slice(5))
          const res = await libp2p.services.directMessage.send(peerId, content)

          if (!res) {
            log('Failed to send message')
            return false
          }
        } else {
          // Topic/room path
          const roomTopic = getRoomTopic(activeRoomId)
          const subscribers = libp2p.services.pubsub.getSubscribers(roomTopic)
          log(`peers in gossip for topic ${roomTopic}:`, subscribers.toString())

          const res = await libp2p.services.pubsub.publish(roomTopic, new TextEncoder().encode(content))
          log(
            'sent message to: ',
            res.recipients.map((peerId) => peerId.toString()),
          )
        }

        // Add message to appropriate state store
        const myPeerId = libp2p.peerId.toString()
        const newMessage: ChatMessage = {
          msgId: crypto.randomUUID(),
          msg: content,
          fileObjectUrl: undefined,
          peerId: myPeerId,
          read: true,
          receivedAt: Date.now(),
          roomId: activeRoomId,
        }

        if (activeRoomId.startsWith('peer:')) {
          setDirectMessages((prev: DirectMessages) => ({
            ...prev,
            [activeRoomId]: [...(prev[activeRoomId] || []), newMessage],
          }))
        } else {
          setRooms((prev: ChatState['rooms']) => ({
            ...prev,
            [activeRoomId]: {
              ...prev[activeRoomId],
              messages: [...(prev[activeRoomId]?.messages || []), newMessage],
            },
          }))
        }

        return true
      } catch (e) {
        log(e)
        return false
      }
    },
    [activeRoomId, libp2p, setRooms, setDirectMessages],
  )

  return { sendMessage }
}

export const useFileHandling = () => {
  const { libp2p } = useLibp2pContext()
  const { files, setFiles, activeRoomId, setRooms } = useChatContext()

  const sendFile = useCallback(
    async (fileData: ArrayBuffer) => {
      const myPeerId = libp2p.peerId.toString()
      const file: ChatFile = {
        id: crypto.randomUUID(),
        body: new Uint8Array(fileData),
        sender: myPeerId,
      }
      setFiles(files.set(file.id, file))

      const fileTopic = TOPICS.FILE[0]
      const subscribers = libp2p.services.pubsub.getSubscribers(fileTopic)
      log(`peers in gossip for topic ${fileTopic}:`, subscribers.toString())

      const res = await libp2p.services.pubsub.publish(fileTopic, new TextEncoder().encode(file.id))
      log(
        'sent file to: ',
        res.recipients.map((peerId) => peerId.toString()),
      )

      const msg: ChatMessage = {
        msgId: crypto.randomUUID(),
        msg: `File: ${file.id} (${file.body.length} bytes)`,
        fileObjectUrl: window.URL.createObjectURL(new Blob([file.body])),
        peerId: myPeerId,
        read: true,
        receivedAt: Date.now(),
        roomId: activeRoomId,
      }

      setRooms((prev) => ({
        ...prev,
        [activeRoomId]: {
          ...prev[activeRoomId],
          messages: [...(prev[activeRoomId]?.messages || []), msg],
        },
      }))

      return file.id
    },
    [libp2p, files, setFiles, activeRoomId, setRooms],
  )

  return { sendFile }
}

export const useRoomManagement = () => {
  const { libp2p } = useLibp2pContext()
  const { setRooms, setActiveRoomId, setRoomUnreads } = useChatContext()

  const joinRoom = useCallback(
    async (roomId: string) => {
      try {
        await libp2p.services.pubsub.subscribe(getRoomTopic(roomId))

        setRooms((prev: ChatState['rooms']) => ({
          ...prev,
          [roomId]: {
            messages: [],
            unread: 0,
            joined: true,
          },
        }))

        setActiveRoomId(roomId)
        return true
      } catch (err) {
        log('Failed to join room:', err)
        return false
      }
    },
    [libp2p, setRooms, setActiveRoomId],
  )

  const leaveRoom = useCallback(
    async (roomId: string) => {
      try {
        await libp2p.services.pubsub.unsubscribe(getRoomTopic(roomId))

        setRooms((prev: ChatState['rooms']) => {
          const newRooms = { ...prev }
          delete newRooms[roomId]
          return newRooms
        })

        return true
      } catch (err) {
        log('Failed to leave room:', err)
        return false
      }
    },
    [libp2p, setRooms],
  )

  const switchRoom = useCallback(
    (roomId: string) => {
      setActiveRoomId(roomId)
      // Clear unread count when switching rooms
      setRoomUnreads((prev: RoomUnreads) => ({ ...prev, [roomId]: 0 }))
    },
    [setActiveRoomId, setRoomUnreads],
  )

  return {
    joinRoom,
    leaveRoom,
    switchRoom,
  }
}

export const useUnreadManagement = () => {
  const { setRoomUnreads } = useChatContext()

  const markAsRead = useCallback(
    (roomId: string) => {
      setRoomUnreads((prev: RoomUnreads) => ({ ...prev, [roomId]: 0 }))
    },
    [setRoomUnreads],
  )

  const incrementUnread = useCallback(
    (roomId: string) => {
      setRoomUnreads((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }))
    },
    [setRoomUnreads],
  )

  return {
    markAsRead,
    incrementUnread,
  }
}
