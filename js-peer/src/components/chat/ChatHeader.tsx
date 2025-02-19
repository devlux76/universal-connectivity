import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import Blockies from 'react-18-blockies'
import { RoomType } from '@/context/chat/types'

const PUBLIC_CHAT_ROOM_ID = ''
const PUBLIC_CHAT_ROOM_NAME = 'The Lobby'

interface ChatHeaderProps {
  activeRoomId: string
  roomType: RoomType
  onBackToLobby: () => void
}

export function ChatHeader({ activeRoomId, roomType, onBackToLobby }: ChatHeaderProps) {
  if (roomType === 'topic' && activeRoomId === PUBLIC_CHAT_ROOM_ID) {
    return (
      <div className="relative flex items-center p-3 border-b border-gray-300">
        <span className="block ml-2 font-bold text-gray-600">{PUBLIC_CHAT_ROOM_NAME}</span>
      </div>
    )
  }

  const BackButton = () => (
    <button onClick={onBackToLobby} className="text-gray-500 flex ml-auto">
      <ChevronLeftIcon className="w-6 h-6 text-gray-500" />
      <span>Back to The Lobby</span>
    </button>
  )

  if (roomType === 'dm') {
    return (
      <div className="relative flex items-center p-3 border-b border-gray-300">
        <Blockies seed={activeRoomId} size={8} scale={3} className="rounded mr-2 max-h-10 max-w-10" />
        <span className="text-gray-500 flex">{activeRoomId.toString().slice(-7)}</span>
        <BackButton />
      </div>
    )
  }

  return (
    <div className="relative flex items-center p-3 border-b border-gray-300">
      <span className="block ml-2 font-bold text-gray-600">#{activeRoomId}</span>
      <BackButton />
    </div>
  )
}