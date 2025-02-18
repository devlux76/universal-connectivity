import { useLibp2pContext } from '@/context/ctx'
import { useChatContext } from '@/context/chat-ctx'
import React from 'react'
import { CreateRoomForm } from './chat/CreateRoomForm'
import { PeerList } from './chat/PeerList'
import { RoomList } from './chat/RoomList'
import { useRoomManagement } from '@/hooks/useRoomManagement'

export function ChatPeerList() {
  const { libp2p } = useLibp2pContext()
  const { activeRoomId, setActiveRoomId, setRoomType } = useChatContext()
  const { subscribers, topics, isCreating, createRoom } = useRoomManagement()

  const handleSelectRoom = (topic: string) => {
    setActiveRoomId(topic)
    setRoomType('topic')
  }

  return (
    <div className="border-l border-gray-300 lg:col-span-1 bg-gray-800 text-white h-full">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Rooms</h2>
          <CreateRoomForm 
            onCreateRoom={createRoom}
            isCreating={isCreating}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <PeerList
            currentPeerId={libp2p.peerId}
            subscribers={subscribers}
          />
          <RoomList
            topics={topics}
            activeRoomId={activeRoomId}
            subscribers={subscribers}
            onSelectRoom={handleSelectRoom}
          />
        </div>
      </div>
    </div>
  )
}
