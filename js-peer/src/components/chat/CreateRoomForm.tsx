import { useState } from 'react'
import { sanitizeTopicName } from '@/lib/constants'

interface CreateRoomFormProps {
  onCreateRoom: (topic: string) => Promise<void>
  isCreating: boolean
}

export function CreateRoomForm({ onCreateRoom, isCreating }: CreateRoomFormProps) {
  const [newTopic, setNewTopic] = useState('')
  const [error, setError] = useState('')

  const validateTopicName = (name: string): string | null => {
    if (!name || !name.trim()) return 'Topic name is required'
    return null
  }

  const handleCreateRoom = async () => {
    setError('')
    const validationError = validateTopicName(newTopic)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await onCreateRoom(sanitizeTopicName(newTopic))
      setNewTopic('')
    } catch (err) {
      setError('Failed to create room: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
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
        className={`w-full rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${
          isCreating ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'
        }`}
      >
        {isCreating ? 'Creating...' : 'Create Room'}
      </button>
    </div>
  )
}