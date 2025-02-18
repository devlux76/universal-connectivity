import { useRef, useState, useCallback } from 'react'
import { RoomType } from '@/context/chat/types'
import { useMessageHandling } from '@/hooks/useMessageHandling'

const PUBLIC_CHAT_ROOM_ID = ''

interface MessageInputProps {
  roomId: string
  roomType: RoomType
}

export function MessageInput({ roomId, roomType }: MessageInputProps) {
  const [input, setInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const { sendPublicMessage, sendDirectMessage, sendTopicMessage, handleFile } = useMessageHandling()

  const sendMessage = useCallback(async () => {
    if (input === '') return

    let success = false
    if (roomType === 'topic' && roomId === PUBLIC_CHAT_ROOM_ID) {
      success = await sendPublicMessage(input)
    } else if (roomType === 'dm') {
      success = await sendDirectMessage(input, roomId)
    } else {
      success = await sendTopicMessage(input, roomId)
    }

    if (success) {
      setInput('')
    }
  }, [input, roomId, roomType, sendPublicMessage, sendDirectMessage, sendTopicMessage])

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const reader = new FileReader()
      reader.readAsArrayBuffer(e.target.files[0])
      reader.onload = async (readerEvent) => {
        const fileBody = readerEvent.target?.result as ArrayBuffer
        if (fileBody) {
          await handleFile(fileBody)
        }
      }
    }
  }, [handleFile])

  const canUploadFiles = roomType === 'topic' && roomId === PUBLIC_CHAT_ROOM_ID

  return (
    <div className="flex items-center justify-between w-full p-3 border-t border-gray-300">
      <input
        ref={fileRef}
        className="hidden"
        type="file"
        onChange={handleFileInput}
        disabled={!canUploadFiles}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={!canUploadFiles}
        title={canUploadFiles ? 'Upload file' : "File uploads only allowed in The Lobby"}
        className={canUploadFiles ? '' : 'cursor-not-allowed'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>

      <input
        value={input}
        onKeyUp={handleKeyUp}
        onChange={(e) => setInput(e.target.value)}
        type="text"
        placeholder="Message"
        className="block w-full py-2 pl-4 mx-3 bg-gray-100 rounded-full outline-none focus:text-gray-700"
        name="message"
        required
      />

      <button onClick={sendMessage} type="submit">
        <svg
          className="w-5 h-5 text-gray-500 origin-center transform rotate-90"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </button>
    </div>
  )
}