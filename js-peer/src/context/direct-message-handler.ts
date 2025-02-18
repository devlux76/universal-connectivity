import { MIME_TEXT_PLAIN } from '@/lib/constants'
import { DirectMessageEvent } from '@/lib/messages'
import type { ChatMessage, DirectMessages } from './types'

export const handleDirectMessage = (
  evt: DirectMessageEvent,
  setDirectMessages: (directMessages: DirectMessages | ((prevMessages: DirectMessages) => DirectMessages)) => void
) => {
  if (evt.detail.type === MIME_TEXT_PLAIN) {
    const newMessage: ChatMessage = {
      msgId: crypto.randomUUID(),
      msg: evt.detail.message,
      fileObjectUrl: undefined,
      peerId: evt.detail.from.toString(),
      read: false,
      receivedAt: Date.now()
    }

    setDirectMessages((prevMessages) => ({
      ...prevMessages,
      [evt.detail.from.toString()]: [
        ...(prevMessages[evt.detail.from.toString()] || []),
        newMessage
      ]
    }))
  }
}
