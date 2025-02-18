import { ChatMessage } from '@/context/chat-ctx'
import { Message } from '../message'
import { RoomType } from '@/context/chat/types'

interface MessageListProps {
  messages: ChatMessage[]
  roomType: RoomType
}

export function MessageList({ messages, roomType }: MessageListProps) {
  return (
    <div className="relative w-full flex flex-col-reverse p-3 overflow-y-auto h-[40rem] bg-gray-100">
      <ul className="space-y-2">
        {messages.map(({ msgId, msg, fileObjectUrl, peerId, read, receivedAt }: ChatMessage) => (
          <Message
            key={msgId}
            dm={roomType === 'dm'}
            msg={msg}
            fileObjectUrl={fileObjectUrl}
            peerId={peerId}
            read={read}
            msgId={msgId}
            receivedAt={receivedAt}
          />
        ))}
      </ul>
    </div>
  )
}