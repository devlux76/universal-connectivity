import {
  createDelegatedRoutingV1HttpApiClient,
  DelegatedRoutingV1HttpApiClient,
} from '@helia/delegated-routing-v1-http-api-client'
import { createLibp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
import { peerIdFromString } from '@libp2p/peer-id'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { Multiaddr } from '@multiformats/multiaddr'
import { sha256 } from 'multiformats/hashes/sha2'
import type { Connection, Message, SignedMessage, PeerId, Libp2p } from '@libp2p/interface'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { webSockets } from '@libp2p/websockets'
import { webTransport } from '@libp2p/webtransport'
import { webRTC, webRTCDirect } from '@libp2p/webrtc'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { ping } from '@libp2p/ping'
import { TOPICS, BOOTSTRAP_PEER_IDS, loadUserTopics } from './constants'
import first from 'it-first'
import { forComponent, enable } from './logger'
import { directMessage } from './direct-message'
import type { Libp2pType } from '@/context/ctx'
import { generateKeyPair, privateKeyFromProtobuf, privateKeyToProtobuf } from '@libp2p/crypto/keys'
import { useEffect } from 'react'
import { useLibp2pContext } from '@/context/ctx'

const log = forComponent('libp2p')

const MAX_RETRIES = 30;
const INITIAL_BACKOFF_MS = 1000;

const TOPICS_STORAGE_KEY = 'subscribedTopics'

// Checks if a topic is valid (contains only printable ASCII characters)
function isValidTopic(topic: string): boolean {
  return /^[\x20-\x7E]+$/.test(topic)
}

// Automatically fix any corrupted topic data in localStorage
function autofixTopicsStorage(): void {
  try {
    const data = localStorage.getItem(TOPICS_STORAGE_KEY)
    if (!data) return

    let needsCleanup = false
    try {
      const topics = JSON.parse(data)
      if (!Array.isArray(topics)) {
        needsCleanup = true
      } else {
        // Check if any topics contain invalid characters
        const validTopics = topics.filter(isValidTopic)
        if (validTopics.length !== topics.length) {
          needsCleanup = true
          localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(validTopics))
        }
      }
    } catch (e) {
      // If we can't parse the JSON, it's definitely corrupted
      needsCleanup = true
    }

    // If data was corrupted, clean it up
    if (needsCleanup) {
      console.warn('[Autofix] Cleaned up corrupted topic data in localStorage')
      localStorage.setItem(TOPICS_STORAGE_KEY, '[]')
    }
  } catch (e) {
    console.error('[Autofix] Failed to fix topics storage:', e)
  }
}

export function loadTopicsFromStorage(): Set<string> {
  try {
    // Run autofix before loading topics
    autofixTopicsStorage()

    const data = localStorage.getItem(TOPICS_STORAGE_KEY)
    if (!data) return new Set()
    const topics = JSON.parse(data)
    // Filter out any invalid topics (those that contain non-printable characters)
    return new Set(topics.filter(isValidTopic))
  } catch {
    return new Set()
  }
}

export function storeTopicsInStorage(topics: Set<string>) {
  // Filter out any invalid topics before storing
  const validTopics = Array.from(topics).filter(isValidTopic)
  localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(validTopics))
}

export function useAutoSubscribeToNewTopics() {
  const { libp2p } = useLibp2pContext()

  useEffect(() => {
    // Don't run the effect until libp2p is initialized
    if (!libp2p?.services?.pubsub) {
      return;
    }

    const knownTopics = loadTopicsFromStorage()
    for (const t of libp2p.services.pubsub.getTopics()) {
      knownTopics.add(t)
    }

    const onSubscriptionChange = () => {
      for (const topic of libp2p.services.pubsub.getTopics()) {
        // Only add valid topics (containing printable ASCII characters)
        if (!knownTopics.has(topic) && isValidTopic(topic)) {
          knownTopics.add(topic)
          libp2p.services.pubsub.subscribe(topic)
          storeTopicsInStorage(knownTopics)
        }
      }
    }

    libp2p.services.pubsub.addEventListener('subscription-change', onSubscriptionChange)

    // Re-subscribe to stored topics
    knownTopics.forEach((t) => {
      if (!libp2p.services.pubsub.getTopics().includes(t)) {
        try {
          libp2p.services.pubsub.subscribe(t)
        } catch (err) {
          console.error(`Failed to resubscribe to topic ${t}:`, err)
        }
      }
    })

    storeTopicsInStorage(knownTopics)

    return () => {
      libp2p.services.pubsub.removeEventListener('subscription-change', onSubscriptionChange)
    }
  }, [libp2p?.services?.pubsub]) // Only re-run when pubsub service changes

  return null
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  backoff = INITIAL_BACKOFF_MS,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    
    if (onRetry) {
      onRetry(MAX_RETRIES - retries + 1, error as Error);
    }

    await new Promise(resolve => setTimeout(resolve, backoff));
    return retryWithBackoff(operation, retries - 1, backoff * 2, onRetry);
  }
}

const LIBP2P_STORAGE_KEY = 'libp2p-key';

export function loadLibp2pKey(): Uint8Array | null {
  try {
    const storedKey = localStorage.getItem(LIBP2P_STORAGE_KEY);
    return storedKey ? new Uint8Array(JSON.parse(storedKey)) : null;
  } catch (error) {
    console.error('Failed to load libp2p key from localStorage:', error);
    return null;
  }
}

export function saveLibp2pKey(privateKey: Uint8Array): void {
  try {
    localStorage.setItem(LIBP2P_STORAGE_KEY, JSON.stringify(Array.from(privateKey)));
  } catch (error) {
    console.error('Failed to save libp2p key to localStorage:', error);
  }
}

export async function startLibp2p(): Promise<Libp2pType> {
  // enable verbose logging in browser console to view debug logs
  enable('ui*,libp2p*,-libp2p:connection-manager*,-*:trace')

  const delegatedClient = createDelegatedRoutingV1HttpApiClient('https://delegated-ipfs.dev')

  const { bootstrapAddrs, relayListenAddrs } = await getBootstrapMultiaddrs(delegatedClient)
  log('starting libp2p with bootstrapAddrs %o and relayListenAddrs: %o', bootstrapAddrs, relayListenAddrs)

  let privateKey;
  try {
    const storedKey = loadLibp2pKey();
    privateKey = storedKey ? privateKeyFromProtobuf(storedKey) : await generateKeyPair('Ed25519');
    if (!storedKey) saveLibp2pKey(privateKeyToProtobuf(privateKey));
  } catch {
    privateKey = await generateKeyPair('Ed25519');
    saveLibp2pKey(privateKeyToProtobuf(privateKey));
  }

  const createNode = async () => {
    const options = {
      privateKey
    }
    const node = await createLibp2p({
      ...options,
      addresses: {
        listen: [
          // Listen for webRTC connection
          '/webrtc',
          ...relayListenAddrs,
        ],
      },
      transports: [
        webTransport(),
        webSockets(),
        webRTC(),
        // Required to estalbish connections with peers supporting WebRTC-direct, e.g. the Rust-peer
        webRTCDirect(),
        // Required to create circuit relay reservations in order to hole punch browser-to-browser WebRTC connections
        circuitRelayTransport(),
      ],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      connectionGater: {
        denyDialMultiaddr: async () => false,
      },
      peerDiscovery: [
        pubsubPeerDiscovery({
          interval: 10_000,
          topics: [...TOPICS.PEER_DISCOVERY],
          listenOnly: false,
        }),
        bootstrap({
          // The app-specific bootstrappers that use WebTransport and WebRTC-direct and have ephemeral multiadrrs
          // that are resolved above using the delegated routing API
          list: bootstrapAddrs,
        }),
      ],
      services: {
        pubsub: gossipsub({
          allowPublishToZeroTopicPeers: true,
          msgIdFn: msgIdFnStrictNoSign,
          ignoreDuplicatePublishError: true,
        }),
        // Delegated routing helps us discover the ephemeral multiaddrs of the dedicated go and rust bootstrap peers
        // This relies on the public delegated routing endpoint https://docs.ipfs.tech/concepts/public-utilities/#delegated-routing
        delegatedRouting: () => delegatedClient,
        identify: identify(),
        // Custom protocol for direct messaging
        directMessage: directMessage(),
        ping: ping(),
      },
    })

    if (!node) {
      throw new Error('Failed to create libp2p node')
    }

    return node;
  }

  const libp2p = await retryWithBackoff(
    createNode,
    MAX_RETRIES,
    INITIAL_BACKOFF_MS,
    (attempt, error) => {
      log.error(`Failed to start libp2p (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
      // You could emit an event here that the UI can listen to for showing notifications
      const event = new CustomEvent('libp2p:connection:retry', {
        detail: { attempt, error: error.message }
      });
      window.dispatchEvent(event);
    }
  );

  const userTopics = loadUserTopics();
  const allTopics = {
    CHAT: [...TOPICS.CHAT, ...(userTopics.CHAT || [])],
    FILE: [...TOPICS.FILE, ...(userTopics.FILE || [])],
    PEER_DISCOVERY: [...TOPICS.PEER_DISCOVERY, ...(userTopics.PEER_DISCOVERY || [])],
    STREAMING: [...TOPICS.STREAMING, ...(userTopics.STREAMING || [])]
  };

  for (const topic of allTopics.CHAT) {
    libp2p.services.pubsub.subscribe(topic);
  }
  for (const topic of allTopics.FILE) {
    libp2p.services.pubsub.subscribe(topic);
  }
  for (const topic of allTopics.PEER_DISCOVERY) {
    libp2p.services.pubsub.subscribe(topic);
  }
  for (const topic of allTopics.STREAMING) {
    libp2p.services.pubsub.subscribe(topic);
  }

  libp2p.addEventListener('self:peer:update', ({ detail: { peer } }) => {
    const multiaddrs = peer.addresses.map(({ multiaddr }) => multiaddr)
    log(`changed multiaddrs: peer ${peer.id.toString()} multiaddrs: ${multiaddrs}`)
  })

  // explicitly dial peers discovered via pubsub
  libp2p.addEventListener('peer:discovery', (event) => {
    const { multiaddrs, id } = event.detail

    if (libp2p.getConnections(id)?.length > 0) {
      log(`Already connected to peer %s. Will not try dialling`, id)
      return
    }

    dialWebRTCMaddrs(libp2p, multiaddrs)
  })

  return libp2p
}

// message IDs are used to dedupe inbound messages
// every agent in network should use the same message id function
// messages could be perceived as duplicate if this isnt added (as opposed to rust peer which has unique message ids)
export async function msgIdFnStrictNoSign(msg: Message): Promise<Uint8Array> {
  const enc = new TextEncoder()

  const signedMessage = msg as SignedMessage
  const encodedSeqNum = enc.encode(signedMessage.sequenceNumber.toString())
  return await sha256.encode(encodedSeqNum)
}

// Function which dials one maddr at a time to avoid establishing multiple connections to the same peer
async function dialWebRTCMaddrs(libp2p: Libp2p, multiaddrs: Multiaddr[]): Promise<void> {
  const webRTCMadrs = multiaddrs.filter((maddr) => maddr.protoNames().includes('webrtc'))
  log(`dialing WebRTC multiaddrs: %o`, webRTCMadrs)

  for (const addr of webRTCMadrs) {
    try {
      log(`attempting to dial webrtc multiaddr: %o`, addr)
      await retryWithBackoff(
        async () => await libp2p.dial(addr),
        MAX_RETRIES,
        INITIAL_BACKOFF_MS,
        (attempt, error) => {
          log.error(`Failed to dial webrtc multiaddr (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
          const event = new CustomEvent('libp2p:dial:retry', {
            detail: { attempt, error: error.message, addr: addr.toString() }
          });
          window.dispatchEvent(event);
        }
      );
      return;
    } catch (error: unknown) {
      log.error(`failed to dial webrtc multiaddr after all retries: %o`, addr);
    }
  }
}

export const connectToMultiaddr = (libp2p: Libp2p) => async (multiaddr: Multiaddr) => {
  log(`dialling: %a`, multiaddr)
  try {
    const conn = await libp2p.dial(multiaddr)
    log('connected to %p on %a', conn.remotePeer, conn.remoteAddr)
    return conn
  } catch (e: unknown) {
    console.error(e)
    throw e
  }
}

// Function which resolves PeerIDs of rust/go bootstrap nodes to multiaddrs dialable from the browser
// Returns both the dialable multiaddrs in addition to the relay
async function getBootstrapMultiaddrs(client: DelegatedRoutingV1HttpApiClient): Promise<BootstrapsMultiaddrs> {
  const peers = await Promise.all(BOOTSTRAP_PEER_IDS.map((peerId) => first(client.getPeers(peerIdFromString(peerId)))))

  const bootstrapAddrs = []
  const relayListenAddrs = []
  for (const p of peers) {
    if (p && p.Addrs.length > 0) {
      for (const maddr of p.Addrs) {
        const protos = maddr.protoNames()
        if ((protos.includes('webtransport') || protos.includes('webrtc-direct')) && protos.includes('certhash')) {
          if (maddr.nodeAddress().address === '127.0.0.1') continue // skip loopback
          bootstrapAddrs.push(maddr.toString())
          relayListenAddrs.push(getRelayListenAddr(maddr, p.ID))
        }
      }
    }
  }
  return { bootstrapAddrs, relayListenAddrs }
}

interface BootstrapsMultiaddrs {
  // Multiaddrs that are dialable from the browser
  bootstrapAddrs: string[]

  // multiaddr string representing the circuit relay v2 listen addr
  relayListenAddrs: string[]
}

// Constructs a multiaddr string representing the circuit relay v2 listen address for a relayed connection to the given peer.
const getRelayListenAddr = (maddr: Multiaddr, peer: PeerId): string =>
  `${maddr.toString()}/p2p/${peer.toString()}/p2p-circuit`

export const getFormattedConnections = (connections: Connection[]) =>
  connections.map((conn) => ({
    peerId: conn.remotePeer,
    protocols: [...new Set(conn.remoteAddr.protoNames())],
  }))