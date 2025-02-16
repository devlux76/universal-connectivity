import type { PrivateKey } from '@libp2p/crypto'
import { keys } from '@libp2p/crypto'
import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { base64 } from 'multiformats/bases/base64'
import type { PeerId } from '@libp2p/interface'

const STORAGE_KEY = 'libp2p-identity-key'

export async function loadOrCreateIdentity(): Promise<PeerId> {
  // Try loading existing key
  const storedKey = localStorage.getItem(STORAGE_KEY)
  
  if (storedKey) {
    try {
      // Decode stored private key
      const privateKeyBytes = base64.decode(storedKey)
      // Import existing Ed25519 key
      const key = await keys.privateKeyFromProtobuf(privateKeyBytes)
      // Generate PeerId from key
      const peerId = await createFromPrivKey(key)
      return peerId as PeerId
    } catch (err) {
      console.error('Failed to load stored identity:', err)
      // Fall through to create new identity if load fails
    }
  }

  // Generate new Ed25519 keypair
  const key = await keys.generateKeyPair('Ed25519')
  // Export private key
  const exportedKey = await keys.privateKeyToProtobuf(key)
  // Store encoded private key
  localStorage.setItem(STORAGE_KEY, base64.encode(exportedKey))
  // Create PeerId from key
  const peerId = await createFromPrivKey(key)
  return peerId as PeerId
}