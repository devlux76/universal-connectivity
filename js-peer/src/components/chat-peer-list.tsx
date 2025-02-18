import { useLibp2pContext } from '@/context/ctx'
import { useChatContext } from '@/context/chat-ctx'
import { TOPICS, sanitizeTopicName, formatTopicNameForDisplay, getRoomTopic } from '@/lib/constants'
import React, { useEffect, useState } from 'react'
import type { PeerId } from '@libp2p/interface'
import { PeerWrapper } from './peer'
import { loadTopicsFromStorage, storeTopicsInStorage } from '../lib/libp2p'
import { isValidTopic, autofixTopicsStorage } from '@/lib/libp2p/topics'
import { forComponent } from '@/lib/logger'

const log = forComponent('chat-peer-list')

type RoomUnreads = { [roomId: string]: number }

export function ChatPeerList() {
  const { libp2p } = useLibp2pContext()
  const { rooms, setRooms, activeRoomId, setActiveRoomId, roomUnreads, setRoomUnreads } = useChatContext()
  const [subscribers, setSubscribers] = useState<PeerId[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    autofixTopicsStorage();
    setTopics(Array.from(loadTopicsFromStorage()))
  }, [])

  const validateTopicName = (name: string): string | null => {
    if (!name || !name.trim()) return 'Topic name is required';
    const sanitized = sanitizeTopicName(name);
    if (topics.includes(sanitized)) return 'A room with this name already exists';
    return null;
  };

  const handleCreateRoom = async () => {
    setError('');
    const validationError = validateTopicName(newTopic);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    try {
      const roomId = sanitizeTopicName(newTopic);
      
      // First subscribe to the topic
      await libp2p.services.pubsub.subscribe(roomId);
      
      // Wait a moment for the subscription to take effect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get current subscribers to verify subscription worked
      const subscribers = libp2p.services.pubsub.getSubscribers(roomId);
      log(`Current subscribers for new topic ${roomId}:`, subscribers.toString());
      
      // Add the new room to state
      setRooms(prev => ({
        ...prev,
        [roomId]: {
          messages: [],
          unread: 0,
          joined: true
        }
      }));
      
      // Switch to the new room
      setActiveRoomId(roomId);
      
      // Update local state and storage
      const updatedTopics = [...topics, roomId];
      setTopics(updatedTopics);
      storeTopicsInStorage(new Set(updatedTopics));
      
      // Announce the new topic to other peers
      await libp2p.services.pubsub.publish(TOPICS.PEER_DISCOVERY[0], new TextEncoder().encode(roomId));
      
      setNewTopic('');
    } catch (err) {
      setError('Failed to create room: ' + (err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!libp2p?.services?.pubsub) return

    const onSubscriptionChange = () => {
      // Get subscribers from all chat topics 
      const subscribers = libp2p.services.pubsub
        .getTopics()
        .filter(topic => topic === TOPICS.ROOMS.LOBBY || topic.startsWith(TOPICS.ROOMS.PREFIX))
        .flatMap(topic => libp2p.services.pubsub.getSubscribers(topic))

      const uniqueSubscribers = [...new Set(subscribers.map(p => p.toString()))]
        .map(str => subscribers.find(p => p.toString() === str)!)
      setSubscribers(uniqueSubscribers)
    }

    const onMessage = async (evt: CustomEvent<{ data: Uint8Array }>) => {
      try {
        const topic = new TextDecoder().decode(evt.detail.data)
        if (!isValidTopic(topic)) {
          console.warn(`Ignoring invalid topic request...`)
          // Send acknowledgment for invalid topic
          const invalidTopicAck = new TextEncoder().encode(`Invalid topic: ${topic}`)
          await libp2p.services.pubsub.publish(topic, invalidTopicAck)

          return
        }
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

  const handleRoomSelect = (roomId: string) => {
    setActiveRoomId(roomId);
    // Clear unread count when selecting a room
    setRoomUnreads((prev: RoomUnreads) => ({ ...prev, [roomId]: 0 }));
  };

  return (
    <div className="border-l border-gray-300 lg:col-span-1 bg-gray-800 text-white h-full">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Rooms Section */}
          <div className="px-3 py-2 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-300">Rooms</h2>
            <div className="mt-2 space-y-2">
              {/* Lobby Room */}
              <button
                onClick={() => handleRoomSelect('lobby')}
                className={`w-full group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${activeRoomId === 'lobby' ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
              >
                <span className={`flex-1 truncate text-left ${activeRoomId === 'lobby' ? 'font-medium' : ''}`}>
                  # The Lobby
                </span>
                {roomUnreads['lobby'] > 0 && (
                  <span className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-full">
                    {roomUnreads['lobby']}
                  </span>
                )}
              </button>

              {/* Topic Rooms */}
              {topics.map((topic) => {
                const isActive = activeRoomId === topic;
                const roomTopic = getRoomTopic(topic);
                const peerCount = libp2p.services.pubsub.getSubscribers(roomTopic).length;
                const unreadCount = roomUnreads[topic] || 0;
                
                return (
                  <button
                    key={topic}
                    onClick={() => handleRoomSelect(topic)}
                    className={`w-full group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                  >
                    <span className={`flex-1 truncate text-left ${isActive ? 'font-medium' : ''}`}>
                      # {formatTopicNameForDisplay(topic)}
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-full">
                          {unreadCount}
                        </span>
                      )}
                      {peerCount > 0 && (
                        <span className="text-xs text-gray-400 group-hover:text-gray-300">
                          {peerCount} {peerCount === 1 ? 'peer' : 'peers'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Create Room Form */}
          <div className="px-3 py-2">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                placeholder="Create a new room"
                className="w-full rounded-md border-0 py-2 px-3 bg-gray-700 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className={`w-full rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${isCreating ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}`}
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
          {/* Online Peers */}
          <div className="px-3 py-2 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-300">Online Peers</h2>
            <div className="mt-2">
              <div className="space-y-2">
                <PeerWrapper peer={libp2p.peerId} self withName={true} withUnread={false} />
                {subscribers.map((p) => (
                  <PeerWrapper 
                    key={p.toString()} 
                    peer={p} 
                    self={false} 
                    withName={true} 
                    withUnread={true} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
