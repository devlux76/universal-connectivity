import { useLibp2pContext } from '@/context/ctx'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TOPICS, getRoomTopic } from '@/lib/constants'
import { ChatFile, ChatMessage, useChatContext } from '../context/chat-ctx'
import { v4 as uuidv4 } from 'uuid'
import { Message } from './message'
import { forComponent } from '@/lib/logger'
import { ChatPeerList } from './chat-peer-list'
import { ChevronLeftIcon } from '@heroicons/react/20/solid'
import Blockies from 'react-18-blockies'
import { peerIdFromString } from '@libp2p/peer-id'

const log = forComponent('chat')

const LOBBY_NAME = 'The Lobby'

export default function ChatContainer() {
  const { libp2p } = useLibp2pContext()
  const {
    rooms,
    setRooms,
    activeRoomId,
    setActiveRoomId,
    directMessages: _directMessages,
    setDirectMessages,
    files,
    setFiles,
  } = useChatContext()
  const [input, setInput] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)
  const _currentRoom = rooms[activeRoomId] || { messages: [], unread: 0, joined: true }

  // Clear unread count when entering a room
  useEffect(() => {
    if (activeRoomId) {
      setRooms((prev) => ({
        ...prev,
        [activeRoomId]: {
          ...prev[activeRoomId],
          unread: 0,
        },
      }))
    }
  }, [activeRoomId, setRooms])

  const sendMessage = useCallback(async () => {
    if (input === '') return

    try {
      if (activeRoomId.startsWith('peer:')) {
        // Direct message path
        const peerId = peerIdFromString(activeRoomId.slice(5))
        const res = await libp2p.services.directMessage.send(peerId, input)

        if (!res) {
          log('Failed to send message')
          return
        }
      } else {
        // Topic/room path (including lobby)
        const roomTopic = getRoomTopic(activeRoomId)
        const subscribers = libp2p.services.pubsub.getSubscribers(roomTopic)
        log(`peers in gossip for topic ${roomTopic}:`, subscribers.toString())

        const res = await libp2p.services.pubsub.publish(roomTopic, new TextEncoder().encode(input))
        log(
          'sent message to: ',
          res.recipients.map((peerId) => peerId.toString()),
        )
      }

      // Add message to appropriate state store
      const myPeerId = libp2p.peerId.toString()
      const newMessage: ChatMessage = {
        msgId: crypto.randomUUID(),
        msg: input,
        fileObjectUrl: undefined,
        peerId: myPeerId,
        read: true,
        receivedAt: Date.now(),
        roomId: activeRoomId,
      }

      if (activeRoomId.startsWith('peer:')) {
        setDirectMessages((prev) => ({
          ...prev,
          [activeRoomId]: [...(prev[activeRoomId] || []), newMessage],
        }))
      } else {
        setRooms((prev) => ({
          ...prev,
          [activeRoomId]: {
            ...prev[activeRoomId],
            messages: [...(prev[activeRoomId]?.messages || []), newMessage],
          },
        }))
      }

      setInput('')
    } catch (e: unknown) {
      log(e)
    }
  }, [input, activeRoomId, libp2p, setRooms, setDirectMessages, setInput])

  const sendFile = useCallback(
    async (readerEvent: ProgressEvent<FileReader>) => {
      const fileBody = readerEvent.target?.result as ArrayBuffer

      const myPeerId = libp2p.peerId.toString()
      const file: ChatFile = {
        id: uuidv4(),
        body: new Uint8Array(fileBody),
        sender: myPeerId,
      }
      setFiles(files.set(file.id, file))

      const fileTopic = TOPICS.FILE[0] // Use the first file topic as the default
      const subscribers = libp2p.services.pubsub.getSubscribers(fileTopic)
      log(`peers in gossip for topic ${fileTopic}:`, subscribers.toString())

      const res = await libp2p.services.pubsub.publish(fileTopic, new TextEncoder().encode(file.id))
      log(
        'sent file to: ',
        res.recipients.map((peerId) => peerId.toString()),
      )

      const msg: ChatMessage = {
        msgId: crypto.randomUUID(),
        msg: newChatFileMessage(file.id, file.body),
        fileObjectUrl: window.URL.createObjectURL(new Blob([file.body])),
        peerId: myPeerId,
        read: true,
        receivedAt: Date.now(),
        roomId: activeRoomId,
      }
      setRooms((prev) => ({
        ...prev,
        [activeRoomId]: {
          ...prev[activeRoomId],
          messages: [...(prev[activeRoomId]?.messages || []), msg],
        },
      }))
    },
    [libp2p, activeRoomId, setRooms, files, setFiles],
  )

  const newChatFileMessage = (id: string, body: Uint8Array) => {
    return `File: ${id} (${body.length} bytes)`
  }

  const handleKeyUp = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        sendMessage()
      }
    },
    [sendMessage],
  )

  const handleSend = useCallback(
    async (_e: React.MouseEvent<HTMLButtonElement>) => {
      sendMessage()
    },
    [sendMessage],
  )

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value)
    },
    [setInput],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return

      const reader = new FileReader()
      reader.readAsArrayBuffer(e.target.files[0])
      reader.onload = (readerEvent) => {
        if (!readerEvent.target?.result) return
        sendFile(readerEvent)
      }
    },
    [sendFile],
  )

  const handleFileSend = useCallback(
    async (_e: React.MouseEvent<HTMLButtonElement>) => {
      fileRef?.current?.click()
    },
    [fileRef],
  )

  const handleBackToLobby = useCallback(() => {
    setActiveRoomId('lobby')
  }, [setActiveRoomId])

  return (
    <div className="container mx-auto">
      <div className="min-w-full border rounded lg:grid lg:grid-cols-6">
        <div className="lg:col-span-5 lg:block">
          <div className="w-full">
            <div className="relative flex items-center p-3 border-b border-gray-300">
              {activeRoomId === 'lobby' && <span className="block ml-2 font-bold text-gray-600">{LOBBY_NAME}</span>}
              {activeRoomId.startsWith('peer:') && (
                <>
                  <Blockies seed={activeRoomId} size={8} scale={3} className="rounded mr-2 max-h-10 max-w-10" />
                  <span className={`text-gray-500 flex`}>{activeRoomId.toString().slice(-7)}</span>
                  <button onClick={handleBackToLobby} className="text-gray-500 flex ml-auto">
                    <ChevronLeftIcon className="w-6 h-6 text-gray-500" />
                    <span>Back to The Lobby</span>
                  </button>
                </>
              )}
              {!activeRoomId.startsWith('peer:') && activeRoomId !== 'lobby' && (
                <>
                  <span className="block ml-2 font-bold text-gray-600">#{activeRoomId}</span>
                  <button onClick={handleBackToLobby} className="text-gray-500 flex ml-auto">
                    <ChevronLeftIcon className="w-6 h-6 text-gray-500" />
                    <span>Back to The Lobby</span>
                  </button>
                </>
              )}
            </div>

            <div className="relative w-full flex flex-col-reverse p-3 overflow-y-auto h-[40rem] bg-gray-100">
              <ul className="space-y-2">
                {(rooms[activeRoomId]?.messages || []).map(
                  ({ msgId, msg, fileObjectUrl, peerId, read, receivedAt }: ChatMessage) => (
                    <Message
                      key={msgId}
                      dm={activeRoomId.startsWith('peer:')}
                      msg={msg}
                      fileObjectUrl={fileObjectUrl}
                      peerId={peerId}
                      read={read}
                      msgId={msgId}
                      receivedAt={receivedAt}
                    />
                  ),
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between w-full p-3 border-t border-gray-300">
              <input
                ref={fileRef}
                className="hidden"
                type="file"
                onChange={handleFileInput}
                disabled={activeRoomId.startsWith('peer:')}
              />
              <button
                onClick={handleFileSend}
                disabled={activeRoomId.startsWith('peer:')}
                title={
                  !activeRoomId.startsWith('peer:') ? 'Upload file' : 'File uploads not allowed in direct messages'
                }
                className={!activeRoomId.startsWith('peer:') ? '' : 'cursor-not-allowed'}
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
                onChange={handleInput}
                type="text"
                placeholder="Message"
                className="block w-full py-2 pl-4 mx-3 bg-gray-100 rounded-full outline-none focus:text-gray-700"
                name="message"
                required
              />
              <button onClick={handleSend} type="submit">
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
          </div>
        </div>
        <ChatPeerList />
      </div>
    </div>
  )
}
