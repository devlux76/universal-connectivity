import { createDelegatedRoutingV1HttpApiClient, DelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client';
import { createLibp2p } from 'libp2p';
import { identify } from '@libp2p/identify';
import { peerIdFromString } from '@libp2p/peer-id';
import type { PeerId } from '@libp2p/interface';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { Multiaddr } from '@multiformats/multiaddr';
import { generateKeyPair, privateKeyFromProtobuf, privateKeyToProtobuf } from '@libp2p/crypto/keys';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { ping } from '@libp2p/ping';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { webSockets } from '@libp2p/websockets';
import { webTransport } from '@libp2p/webtransport';
import { webRTC, webRTCDirect } from '@libp2p/webrtc';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { forComponent, enable } from '../logger';
import { directMessage } from '../direct-message';
import { TOPICS, BOOTSTRAP_PEER_IDS, loadUserTopics } from '../constants';
import { retryWithBackoff, dialWebRTCMaddrs, MAX_RETRIES, INITIAL_BACKOFF_MS } from './dial.js';
import type { Libp2pType } from './types.js';
import first from 'it-first';
import { msgIdFnStrictNoSign } from './utils';

interface BootstrapsMultiaddrs {
  bootstrapAddrs: string[];
  relayListenAddrs: string[];
}

const LIBP2P_STORAGE_KEY = 'libp2p-key';
const log = forComponent('libp2p');

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
  enable('ui*,libp2p*,-libp2p:connection-manager*,-*:trace');
  const delegatedClient = createDelegatedRoutingV1HttpApiClient('https://delegated-ipfs.dev');
  const { bootstrapAddrs, relayListenAddrs } = await getBootstrapMultiaddrs(delegatedClient);
  log('starting libp2p with bootstrapAddrs %o and relayListenAddrs: %o', bootstrapAddrs, relayListenAddrs);
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
    const options = { privateKey };
    const node = await createLibp2p({
      ...options,
      addresses: { listen: ['/webrtc', ...relayListenAddrs] },
      transports: [webTransport(), webSockets(), webRTC(), webRTCDirect(), circuitRelayTransport()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      connectionGater: { denyDialMultiaddr: async () => false },
      peerDiscovery: [pubsubPeerDiscovery({ interval: 10000, topics: [...TOPICS.PEER_DISCOVERY], listenOnly: false }), bootstrap({ list: bootstrapAddrs })],
      services: { pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, msgIdFn: msgIdFnStrictNoSign, ignoreDuplicatePublishError: true }), delegatedRouting: () => delegatedClient, identify: identify(), directMessage: directMessage(), ping: ping() },
    });
    if (!node) throw new Error('Failed to create libp2p node');
    return node;
  };
  const libp2p = await retryWithBackoff(createNode, MAX_RETRIES, INITIAL_BACKOFF_MS, 
    (attempt: number, error: Error) => {
      log.error(`Failed to start libp2p (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
      const event = new CustomEvent('libp2p:connection:retry', { 
        detail: { attempt, error: error.message } 
      });
      window.dispatchEvent(event);
    }
  );
  const userTopics = loadUserTopics();
  const allTopics = { CHAT: [...TOPICS.CHAT, ...(userTopics.CHAT || [])], FILE: [...TOPICS.FILE, ...(userTopics.FILE || [])], PEER_DISCOVERY: [...TOPICS.PEER_DISCOVERY, ...(userTopics.PEER_DISCOVERY || [])], STREAMING: [...TOPICS.STREAMING, ...(userTopics.STREAMING || [])] };
  for (const topic of allTopics.CHAT) libp2p.services.pubsub.subscribe(topic);
  for (const topic of allTopics.FILE) libp2p.services.pubsub.subscribe(topic);
  for (const topic of allTopics.PEER_DISCOVERY) libp2p.services.pubsub.subscribe(topic);
  for (const topic of allTopics.STREAMING) libp2p.services.pubsub.subscribe(topic);
  libp2p.addEventListener('self:peer:update', ({ detail: { peer } }: { detail: { peer: { id: PeerId, addresses: Array<{ multiaddr: Multiaddr }> } } }) => {
    const multiaddrs = peer.addresses.map(({ multiaddr }) => multiaddr);
    log(`changed multiaddrs: peer ${peer.id.toString()} multiaddrs: ${multiaddrs}`);
  });
  libp2p.addEventListener('peer:discovery', (event: { detail: { multiaddrs: Multiaddr[], id: PeerId } }) => {
    const { multiaddrs, id } = event.detail;
    if (libp2p.getConnections(id)?.length > 0) {
      log(`Already connected to peer %s. Will not try dialling`, id);
      return;
    }
    dialWebRTCMaddrs(libp2p, multiaddrs);
  });
  return libp2p;
}

async function getBootstrapMultiaddrs(client: DelegatedRoutingV1HttpApiClient): Promise<BootstrapsMultiaddrs> {
  const peers = await Promise.all(BOOTSTRAP_PEER_IDS.map((peerId) => first(client.getPeers(peerIdFromString(peerId)))));
  const bootstrapAddrs = [];
  const relayListenAddrs = [];
  for (const p of peers) {
    if (p && p.Addrs.length > 0) {
      for (const maddr of p.Addrs) {
        const protos = maddr.protoNames();
        if ((protos.includes('webtransport') || protos.includes('webrtc-direct')) && protos.includes('certhash')) {
          if (maddr.nodeAddress().address === '127.0.0.1') continue;
          bootstrapAddrs.push(maddr.toString());
          relayListenAddrs.push(getRelayListenAddr(maddr, p.ID));
        }
      }
    }
  }
  return { bootstrapAddrs, relayListenAddrs };
}

const getRelayListenAddr = (maddr: Multiaddr, peer: PeerId): string => `${maddr.toString()}/p2p/${peer.toString()}/p2p-circuit`;
