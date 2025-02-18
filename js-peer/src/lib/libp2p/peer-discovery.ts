import { DelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client';
import { peerIdFromString } from '@libp2p/peer-id';
import type { PeerId } from '@libp2p/interface';
import { Multiaddr } from '@multiformats/multiaddr';
import first from 'it-first';
import { forComponent } from '../logger';

const log = forComponent('libp2p:discovery');

export interface BootstrapsMultiaddrs {
  bootstrapAddrs: string[];
  relayListenAddrs: string[];
}

export async function getBootstrapMultiaddrs(client: DelegatedRoutingV1HttpApiClient, bootstrapPeerIds: string[]): Promise<BootstrapsMultiaddrs> {
  const peers = await Promise.all(bootstrapPeerIds.map((peerId) => first(client.getPeers(peerIdFromString(peerId)))));
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
  
  log('Found bootstrap addresses %o and relay addresses: %o', bootstrapAddrs, relayListenAddrs);
  return { bootstrapAddrs, relayListenAddrs };
}

const getRelayListenAddr = (maddr: Multiaddr, peer: PeerId): string => 
  `${maddr.toString()}/p2p/${peer.toString()}/p2p-circuit`;