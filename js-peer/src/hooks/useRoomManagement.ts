import { useState, useEffect, useCallback } from 'react'
import { useLibp2pContext } from '@/context/ctx'
import { TOPICS } from '@/lib/constants'
import type { PeerId } from '@libp2p/interface'
import { loadTopicsFromStorage, storeTopicsInStorage, isValidTopic, autofixTopicsStorage } from '@/lib/libp2p'
import { forComponent } from '@/lib/logger'

const log = forComponent('room-management')

export function useRoomManagement() {
  const { libp2p } = useLibp2pContext()
  const [subscribers, setSubscribers] = useState<PeerId[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    autofixTopicsStorage()
    setTopics(Array.from(loadTopicsFromStorage()))
  }, [])

  const createRoom = useCallback(async (topic: string) => {
    setIsCreating(true)
    try {
      await libp2p.services.pubsub.subscribe(topic)
      
      // Wait a moment for the subscription to take effect
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const subscribers = libp2p.services.pubsub.getSubscribers(topic)
      log(`Current subscribers for new topic ${topic}:`, subscribers.toString())
      
      const updated = new Set(topics).add(topic)
      storeTopicsInStorage(updated)
      setTopics(Array.from(updated))
      
      await libp2p.services.pubsub.publish(TOPICS.PEER_DISCOVERY[0], new TextEncoder().encode(topic))
    } finally {
      setIsCreating(false)
    }
  }, [libp2p, topics])

  useEffect(() => {
    if (!libp2p?.services?.pubsub) return

    const onSubscriptionChange = () => {
      const allSubscribers = [TOPICS.ROOMS.LOBBY].flatMap(topic => 
        libp2p.services.pubsub.getSubscribers(topic) as PeerId[]
      )
      const uniqueSubscribers = [...new Set(allSubscribers.map(p => p.toString()))]
        .map(str => allSubscribers.find(p => p.toString() === str)!)
      setSubscribers(uniqueSubscribers)
    }

    const onMessage = async (evt: CustomEvent<{ data: Uint8Array }>) => {
      try {
        const topic = new TextDecoder().decode(evt.detail.data)
        if (!isValidTopic(topic)) {
          log('Ignoring invalid topic request...')
          return
        }

        const currentTopics = new Set(topics)
        if (!currentTopics.has(topic)) {
          currentTopics.add(topic)
          storeTopicsInStorage(currentTopics)
          setTopics(Array.from(currentTopics))
          libp2p.services.pubsub.subscribe(topic)
        }
      } catch (error) {
        log('Failed to process topic message:', error)
      }
    }
    
    libp2p.services.pubsub.subscribe(TOPICS.PEER_DISCOVERY[0])
    libp2p.services.pubsub.addEventListener('message', onMessage)
    
    onSubscriptionChange()
    libp2p.services.pubsub.addEventListener('subscription-change', onSubscriptionChange)
    
    return () => {
      libp2p.services.pubsub.removeEventListener('subscription-change', onSubscriptionChange)
      libp2p.services.pubsub.removeEventListener('message', onMessage)
    }
  }, [libp2p, topics])

  return {
    subscribers,
    topics,
    isCreating,
    createRoom
  }
}