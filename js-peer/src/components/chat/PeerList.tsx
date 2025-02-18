import type { PeerId } from '@libp2p/interface'
import { PeerWrapper } from '../peer'

interface PeerListProps {
  currentPeerId: PeerId
  subscribers: PeerId[]
}

export function PeerList({ currentPeerId, subscribers }: PeerListProps) {
  return (
    <div className="px-3 py-2 border-b border-gray-700">
      <h2 className="text-lg font-semibold text-gray-300">Online Peers</h2>
      <div className="mt-2">
        <div className="space-y-2">
          <PeerWrapper 
            peer={currentPeerId} 
            self 
            withName={true} 
            withUnread={false} 
          />
          {subscribers.map((p) => (
            <PeerWrapper 
              key={p.toString()} 
              peer={p} 
              self={false} 
              withName={true} 
              withUnread={true} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}