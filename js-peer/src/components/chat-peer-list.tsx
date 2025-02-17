import { useLibp2pContext } from '@/context/ctx'
import { TOPICS } from '@/lib/constants'
import React, { useEffect, useState } from 'react'
import type { PeerId } from '@libp2p/interface'
import { PeerWrapper } from './peer'
import { loadTopicsFromStorage, storeTopicsInStorage } from '../lib/libp2p'
import { Button } from './button'

export function ChatPeerList() {
  const { libp2p } = useLibp2pContext()
  const [subscribers, setSubscribers] = useState<PeerId[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState('')

  useEffect(() => {
    setTopics(Array.from(loadTopicsFromStorage()))
  }, [])

  const handleCreateRoom = () => {
    if (newTopic.trim()) {
      const topic = newTopic.trim()
      const updated = new Set(topics).add(topic)
      storeTopicsInStorage(updated)
      setTopics(Array.from(updated))
      // Subscribe to the new topic and publish its existence
      libp2p.services.pubsub.subscribe(topic)
      libp2p.services.pubsub.publish(TOPICS.PEER_DISCOVERY[0], new TextEncoder().encode(topic))
      setNewTopic('')
    }
  }

  useEffect(() => {
    if (!libp2p?.services?.pubsub) return

    const onSubscriptionChange = () => {
      // Get subscribers from all chat topics and deduplicate them
      const allSubscribers = TOPICS.CHAT.flatMap(topic => 
        libp2p.services.pubsub.getSubscribers(topic) as PeerId[]
      )
      const uniqueSubscribers = [...new Set(allSubscribers.map(p => p.toString()))]
        .map(str => allSubscribers.find(p => p.toString() === str)!)
      setSubscribers(uniqueSubscribers)
    }

    const onMessage = async (msg: any) => {
      try {
        const topic = new TextDecoder().decode(msg.data)
        const currentTopics = new Set(topics)
        if (!currentTopics.has(topic)) {
          currentTopics.add(topic)
          storeTopicsInStorage(currentTopics)
          setTopics(Array.from(currentTopics))
          // Auto-subscribe to newly discovered topics
          libp2p.services.pubsub.subscribe(topic)
        }
      } catch (error) {
        console.error('Failed to process topic message:', error)
      }
    }
    
    // Subscribe to peer discovery topic to receive new room announcements
    libp2p.services.pubsub.subscribe(TOPICS.PEER_DISCOVERY[0])
    libp2p.services.pubsub.addEventListener('message', onMessage)
    
    onSubscriptionChange()
    libp2p.services.pubsub.addEventListener('subscription-change', onSubscriptionChange)
    
    return () => {
      libp2p.services.pubsub.removeEventListener('subscription-change', onSubscriptionChange)
      libp2p.services.pubsub.removeEventListener('message', onMessage)
    }
  }, [libp2p, topics])

  return (
    <div className="border-l border-gray-300 lg:col-span-1">
      <div className="overflow-auto h-[32rem]">
        <div className="px-3 py-2 border-b border-gray-300">
          <h2 className="text-lg font-semibold text-gray-600">Peers</h2>
          <div className="mt-2">
            {<PeerWrapper peer={libp2p.peerId} self withName={true} withUnread={false} />}
          </div>
          {subscribers.map((p) => (
            <div key={p.toString()} className="mt-2">
              <PeerWrapper peer={p} self={false} withName={true} withUnread={true} />
            </div>
          ))}
        </div>
        
        <div className="px-3 py-4">
          <h2 className="text-lg font-semibold text-gray-600 mb-3">Rooms</h2>
          <div className="space-y-2">
            {topics.map(topic => (
              <div key={topic} className="flex items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100">
                <span className="flex-1 text-sm text-gray-700">{topic}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleCreateRoom()}
              placeholder="New room name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleCreateRoom}>Create</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
