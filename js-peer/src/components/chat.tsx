import { useEffect, useState } from 'react'
import { useChatContext } from '@/context/chat'
import { ChatMessage } from '@/context/chat/types'
import { ChatHeader } from './chat/ChatHeader'
import { MessageList } from './chat/MessageList'
import { MessageInput } from './chat/MessageInput'
import { ChatPeerList } from './chat-peer-list'

export const PUBLIC_CHAT_ROOM_ID = ''

export default function ChatContainer() {
  const { activeRoomId, setActiveRoomId, setRoomType, roomType } = useChatContext()
  const { messageHistory, directMessages } = useChatContext()
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const handleBackToLobby = () => {
    setActiveRoomId(PUBLIC_CHAT_ROOM_ID)
    setRoomType('topic')
    setMessages(messageHistory)
  }

  useEffect(() => {
    if (roomType === 'topic' && activeRoomId === PUBLIC_CHAT_ROOM_ID) {
      setMessages(messageHistory)
    } else if (roomType === 'dm') {
      setMessages(directMessages[activeRoomId] || [])
    } else {
      setMessages(messageHistory.filter(m => m.roomId === activeRoomId))
    }
  }, [activeRoomId, roomType, directMessages, messageHistory])

  return (
    <div className="container mx-auto">
      <div className="min-w-full border rounded lg:grid lg:grid-cols-6">
        <div className="lg:col-span-5 lg:block">
          <div className="w-full">
            <ChatHeader 
              activeRoomId={activeRoomId}
              roomType={roomType}
              onBackToLobby={handleBackToLobby}
            />
            <MessageList
              messages={messages}
              roomType={roomType}
            />
            <MessageInput
              activeRoomId={activeRoomId}
              roomType={roomType}
            />
          </div>
        </div>
        <ChatPeerList />
      </div>
    </div>
  )
}
