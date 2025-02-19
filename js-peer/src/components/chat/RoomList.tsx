import type { PeerId } from '@libp2p/interface'
import { formatTopicNameForDisplay } from '@/lib/constants'

interface RoomListProps {
  topics: string[]
  activeRoomId: string
  subscribers: PeerId[]
  onSelectActiveRoom: (topic: string) => void
}

export function RoomList({ topics, activeRoomId, subscribers, onSelectActiveRoom }: RoomListProps) {
  return (
    <div className="px-3 py-2">
      {topics.map((topic) => {
        const isActive = activeRoomId === topic
        const peerCount = subscribers.filter((sub) => sub.toString() === topic).length
        
        return (
          <button
            key={topic}
            onClick={() => onSelectActiveRoom(topic)}
            className={`w-full group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive ? 'bg-gray-700' : 'hover:bg-gray-700/50'
            }`}
          >
            <span className={`flex-1 truncate text-left ${isActive ? 'font-medium' : ''}`}>
              # {formatTopicNameForDisplay(topic)}
            </span>
            {peerCount > 0 && (
              <span className="text-xs text-gray-400 group-hover:text-gray-300">
                {peerCount} {peerCount === 1 ? 'peer' : 'peers'}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}