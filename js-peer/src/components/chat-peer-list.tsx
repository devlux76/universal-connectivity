import { useLibp2pContext } from '@/context/ctx'
import { TOPICS } from '@/lib/constants'
import React, { useEffect, useState } from 'react'
import type { PeerId } from '@libp2p/interface'
import { PeerWrapper } from './peer'
import { loadTopicsFromStorage, storeTopicsInStorage } from '../lib/libp2p';

export function ChatPeerList() {
  const { libp2p } = useLibp2pContext()
  const [subscribers, setSubscribers] = useState<PeerId[]>([])
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    setTopics(Array.from(loadTopicsFromStorage()));
  }, []);

  const handleCreateRoom = () => {
    if (newTopic.trim()) {
      const updated = new Set(topics).add(newTopic.trim());
      storeTopicsInStorage(updated);
      setTopics(Array.from(updated));
      setNewTopic('');
    }
  };

  useEffect(() => {
    const onSubscriptionChange = () => {
      // Get subscribers from all chat topics and deduplicate them
      const allSubscribers = TOPICS.CHAT.flatMap(topic => 
        libp2p.services.pubsub.getSubscribers(topic) as PeerId[]
      );
      const uniqueSubscribers = [...new Set(allSubscribers.map(p => p.toString()))]
        .map(str => allSubscribers.find(p => p.toString() === str)!);
      setSubscribers(uniqueSubscribers);
    }
    
    onSubscriptionChange()
    libp2p.services.pubsub.addEventListener('subscription-change', onSubscriptionChange)
    return () => {
      libp2p.services.pubsub.removeEventListener('subscription-change', onSubscriptionChange)
    }
  }, [libp2p, setSubscribers])

  return (
    <div className="border-l border-gray-300 lg:col-span-1">
      <h2 className="my-2 mb-2 ml-2 text-lg text-gray-600">Peers</h2>
      <div className="overflow-auto h-[32rem]">
        <div className="px-3 py-2 border-b border-gray-300 focus:outline-none">
          {<PeerWrapper peer={libp2p.peerId} self withName={true} withUnread={false} />}
        </div>
        {subscribers.map((p) => (
          <div key={p.toString()} className="px-3 py-2 border-b border-gray-300 focus:outline-none">
            <PeerWrapper peer={p} self={false} withName={true} withUnread={true} />
          </div>
        ))}
      </div>
      <h2>Rooms</h2>
      <ul>
        {topics.map(topic => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <div>
        <input
          value={newTopic}
          onChange={e => setNewTopic(e.target.value)}
          placeholder="New room name"
        />
        <button onClick={handleCreateRoom}>Create</button>
      </div>
    </div>
  )
}
