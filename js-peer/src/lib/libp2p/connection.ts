import type { Libp2p, PeerId, Connection } from '@libp2p/interface'
import { generateKeyPair, privateKeyToProtobuf } from '@libp2p/crypto/keys'
import type { Multiaddr } from '@multiformats/multiaddr'
import { forComponent } from '../logger'
import { EventEmitter } from 'events'

const log = forComponent('libp2p:connection')
const LIBP2P_STORAGE_KEY = 'libp2p-key'

export class ConnectionManager extends EventEmitter {
  private libp2p: Libp2p

  constructor(libp2p: Libp2p) {
    super()
    this.libp2p = libp2p
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.libp2p.addEventListener('self:peer:update', this.handlePeerUpdate.bind(this))
    this.libp2p.addEventListener('peer:discovery', this.handlePeerDiscovery.bind(this))
  }

  private handlePeerUpdate({
    detail: { peer },
  }: {
    detail: { peer: { id: PeerId; addresses: Array<{ multiaddr: Multiaddr }> } }
  }): void {
    const multiaddrs = peer.addresses.map(({ multiaddr }) => multiaddr)
    log(`Changed multiaddrs: peer ${peer.id.toString()} multiaddrs: ${multiaddrs}`)
    this.emit('peer:update', { peer })
  }

  private handlePeerDiscovery(event: { detail: { multiaddrs: Multiaddr[]; id: PeerId } }): void {
    const { multiaddrs, id } = event.detail
    if (this.libp2p.getConnections(id)?.length > 0) {
      log(`Already connected to peer %s. Will not try dialling`, id)
      return
    }
    this.emit('peer:discovered', { multiaddrs, id })
  }

  public getConnections(peerId?: PeerId): Connection[] {
    return this.libp2p.getConnections(peerId)
  }

  public async disconnect(peerId: PeerId): Promise<void> {
    await this.libp2p.hangUp(peerId)
  }

  public cleanup(): void {
    this.removeAllListeners()
  }
}

export async function loadOrCreatePrivateKey(): Promise<Uint8Array> {
  try {
    const storedKey = loadLibp2pKey()
    if (storedKey) {
      return storedKey
    }
    const privateKey = await generateKeyPair('Ed25519')
    const keyBytes = privateKeyToProtobuf(privateKey)
    saveLibp2pKey(keyBytes)
    return keyBytes
  } catch (error) {
    const privateKey = await generateKeyPair('Ed25519')
    const keyBytes = privateKeyToProtobuf(privateKey)
    saveLibp2pKey(keyBytes)
    return keyBytes
  }
}

function loadLibp2pKey(): Uint8Array | null {
  try {
    const storedKey = localStorage.getItem(LIBP2P_STORAGE_KEY)
    return storedKey ? new Uint8Array(JSON.parse(storedKey)) : null
  } catch (error) {
    console.error('Failed to load libp2p key from localStorage:', error)
    return null
  }
}

function saveLibp2pKey(privateKey: Uint8Array): void {
  try {
    localStorage.setItem(LIBP2P_STORAGE_KEY, JSON.stringify(Array.from(privateKey)))
  } catch (error) {
    console.error('Failed to save libp2p key to localStorage:', error)
  }
}
