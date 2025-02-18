import { useCallback } from 'react'
import { useLibp2pContext } from '@/context/ctx'
import { ChatFile, ChatMessage, useChatContext } from '@/context/chat-ctx'
import { v4 as uuidv4 } from 'uuid'
import { TOPICS } from '@/lib/constants'
import { forComponent } from '@/lib/logger'
import { peerIdFromString } from '@libp2p/peer-id'

const log = forComponent('chat-messages')

export function useMessageHandling() {
  const { libp2p } = useLibp2pContext()
  const { messageHistory, setMessageHistory, directMessages, setDirectMessages } = useChatContext()

  const sendPublicMessage = useCallback(async (input: string) => {
    if (input === '') return

    const chatTopic = TOPICS.ROOMS.LOBBY
    const subscribers = libp2p.services.pubsub.getSubscribers(chatTopic)
    log(`peers in gossip for topic ${chatTopic}:`, subscribers.toString())

    const res = await libp2p.services.pubsub.publish(chatTopic, new TextEncoder().encode(input))
    log('sent message to: ', res.recipients.map((peerId) => peerId.toString()))

    const myPeerId = libp2p.peerId.toString()
    setMessageHistory([
      ...messageHistory,
      {
        msgId: crypto.randomUUID(),
        msg: input,
        fileObjectUrl: undefined,
        peerId: myPeerId,
        read: true,
        receivedAt: Date.now(),
        roomId: chatTopic
      },
    ])

    return true
  }, [libp2p, messageHistory, setMessageHistory])

  const sendDirectMessage = useCallback(async (input: string, roomId: string) => {
    try {
      const peerId = peerIdFromString(roomId)
      const res = await libp2p.services.directMessage.send(peerId, input)

      if (!res) {
        log('Failed to send message')
        return false
      }

      const myPeerId = libp2p.peerId.toString()
      const newMessage: ChatMessage = {
        msgId: crypto.randomUUID(),
        msg: input,
        fileObjectUrl: undefined,
        peerId: myPeerId,
        read: true,
        receivedAt: Date.now(),
        roomId
      }

      setDirectMessages((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), newMessage],
      }))

      return true
    } catch (e: unknown) {
      log(e)
      return false
    }
  }, [libp2p, setDirectMessages])

  const sendTopicMessage = useCallback(async (input: string, roomId: string) => {
    try {
      const subscribedTopics = libp2p.services.pubsub.getTopics()
      if (!subscribedTopics.includes(roomId)) {
        log(`Not subscribed to topic ${roomId}, subscribing now...`)
        await libp2p.services.pubsub.subscribe(roomId)
      }

      const subscribers = libp2p.services.pubsub.getSubscribers(roomId)
      log(`peers in gossip for topic ${roomId}:`, subscribers.toString())

      const res = await libp2p.services.pubsub.publish(roomId, new TextEncoder().encode(input))
      if (!res) {
        log('Failed to send message')
        return false
      }

      const myPeerId = libp2p.peerId.toString()
      setMessageHistory((prev) => [...prev, {
        msgId: crypto.randomUUID(),
        msg: input,
        fileObjectUrl: undefined,
        peerId: myPeerId,
        read: true,
        receivedAt: Date.now(),
        roomId
      }])

      return true
    } catch (e: unknown) {
      log(e)
      return false
    }
  }, [libp2p, setMessageHistory])

  const handleFile = useCallback(async (file: ArrayBuffer) => {
    const myPeerId = libp2p.peerId.toString()
    const fileId = uuidv4()
    const fileBody = new Uint8Array(file)
    
    const newFile: ChatFile = {
      id: fileId,
      body: fileBody,
      sender: myPeerId,
    }

    const fileTopic = TOPICS.FILE[0]
    const subscribers = libp2p.services.pubsub.getSubscribers(fileTopic)
    log(`peers in gossip for topic ${fileTopic}:`, subscribers.toString())

    const res = await libp2p.services.pubsub.publish(fileTopic, new TextEncoder().encode(fileId))
    log('sent file to: ', res.recipients.map((peerId) => peerId.toString()))

    const msg: ChatMessage = {
      msgId: crypto.randomUUID(),
      msg: `File: ${fileId} (${fileBody.length} bytes)`,
      fileObjectUrl: window.URL.createObjectURL(new Blob([fileBody])),
      peerId: myPeerId,
      read: true,
      receivedAt: Date.now(),
    }

    setMessageHistory((prev) => [...prev, msg])
    return true
  }, [libp2p, setMessageHistory])

  return {
    sendPublicMessage,
    sendDirectMessage,
    sendTopicMessage,
    handleFile
  }
}