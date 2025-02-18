import { isValidTopic, autofixTopicsStorage, loadTopicsFromStorage, storeTopicsInStorage, useAutoSubscribeToNewTopics } from './topics.js';
import { retryWithBackoff, dialWebRTCMaddrs, connectToMultiaddr } from './dial.js';
import { msgIdFnStrictNoSign, getFormattedConnections } from './utils.js';
import { loadLibp2pKey, saveLibp2pKey, startLibp2p } from './start.js';
import { createDelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client';
import { privateKeyFromProtobuf } from '@libp2p/crypto/keys';
import { forComponent, enable } from '../logger';
import { BOOTSTRAP_PEER_IDS, loadUserTopics } from '../constants';
import { retryWithBackoff, dialWebRTCMaddrs, MAX_RETRIES, INITIAL_BACKOFF_MS } from './dial';
import type { Libp2pType } from './types';
import { createNode } from './node-creation';
import { getBootstrapMultiaddrs } from './peer-discovery';
import { ConnectionManager, loadOrCreatePrivateKey } from './connection';
import { StreamManager } from './stream';

const log = forComponent('libp2p');

export async function startLibp2p(): Promise<Libp2pType> {
  // Enable logging
  enable('ui*,libp2p*,-libp2p:connection-manager*,-*:trace');

  // Initialize delegated routing client
  const delegatedClient = createDelegatedRoutingV1HttpApiClient('https://delegated-ipfs.dev');

  // Get bootstrap addresses
  const { bootstrapAddrs, relayListenAddrs } = await getBootstrapMultiaddrs(delegatedClient, BOOTSTRAP_PEER_IDS);

  // Load or create private key
  const privateKeyBytes = await loadOrCreatePrivateKey();
  const privateKey = privateKeyFromProtobuf(privateKeyBytes);

  // Create and start the node with retries
  const libp2p = await retryWithBackoff(
    async () => createNode({ 
      privateKey, 
      bootstrapAddrs, 
      relayListenAddrs, 
      delegatedClient 
    }),
    MAX_RETRIES,
    INITIAL_BACKOFF_MS,
    (attempt: number, error: Error) => {
      log.error(`Failed to start libp2p (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);
      const event = new CustomEvent('libp2p:connection:retry', {
        detail: { attempt, error: error.message }
      });
      window.dispatchEvent(event);
    }
  );

  // Initialize managers
  const connectionManager = new ConnectionManager(libp2p);
  const streamManager = new StreamManager(libp2p);

  // Subscribe to topics
  const userTopics = loadUserTopics();
  const allTopics = {
    CHAT: [...TOPICS.CHAT, ...(userTopics.CHAT || [])],
    FILE: [...TOPICS.FILE, ...(userTopics.FILE || [])],
    PEER_DISCOVERY: [...TOPICS.PEER_DISCOVERY, ...(userTopics.PEER_DISCOVERY || [])],
    STREAMING: [...TOPICS.STREAMING, ...(userTopics.STREAMING || [])]
  };

  // Subscribe to all topics
  for (const category of Object.values(allTopics)) {
    for (const topic of category) {
      libp2p.services.pubsub.subscribe(topic);
    }
  }

  // Handle peer discovery for WebRTC connections
  connectionManager.on('peer:discovered', ({ multiaddrs }) => {
    dialWebRTCMaddrs(libp2p, multiaddrs);
  });

  return libp2p;
}

export { ConnectionManager, StreamManager };
