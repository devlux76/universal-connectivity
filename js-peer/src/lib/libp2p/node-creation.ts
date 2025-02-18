import { createLibp2p } from 'libp2p';
import { identify } from '@libp2p/identify';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { ping } from '@libp2p/ping';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { webSockets } from '@libp2p/websockets';
import { webTransport } from '@libp2p/webtransport';
import { webRTC, webRTCDirect } from '@libp2p/webrtc';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { directMessage } from '../messages';
import { TOPICS } from '../constants';
import { msgIdFnStrictNoSign } from './utils';
import type { Libp2pType } from './types';
import type { DelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client';

interface CreateNodeOptions {
  privateKey: any;
  bootstrapAddrs: string[];
  relayListenAddrs: string[];
  delegatedClient: DelegatedRoutingV1HttpApiClient;
}

export async function createNode({ privateKey, bootstrapAddrs, relayListenAddrs, delegatedClient }: CreateNodeOptions): Promise<Libp2pType> {
  const options = { privateKey };
  const node = await createLibp2p({
    ...options,
    addresses: { listen: ['/webrtc', ...relayListenAddrs] },
    transports: [
      webTransport(),
      webSockets(),
      webRTC(),
      webRTCDirect(),
      circuitRelayTransport()
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    connectionGater: { denyDialMultiaddr: async () => false },
    peerDiscovery: [
      pubsubPeerDiscovery({
        interval: 10000,
        topics: [...TOPICS.PEER_DISCOVERY],
        listenOnly: false
      }),
      bootstrap({ list: bootstrapAddrs })
    ],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        msgIdFn: msgIdFnStrictNoSign,
        ignoreDuplicatePublishError: true
      }),
      delegatedRouting: () => delegatedClient,
      identify: identify(),
      directMessage: directMessage(),
      ping: ping()
    }
  });

  if (!node) throw new Error('Failed to create libp2p node');
  return node;
}