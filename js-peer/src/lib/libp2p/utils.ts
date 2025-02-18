import { sha256 } from 'multiformats/hashes/sha2';
import type { Message, SignedMessage, Connection } from '@libp2p/interface';

export async function msgIdFnStrictNoSign(msg: Message): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const signedMessage = msg as SignedMessage;
  const encodedSeqNum = enc.encode(signedMessage.sequenceNumber.toString());
  return await sha256.encode(encodedSeqNum);
}

export const getFormattedConnections = (connections: Connection[]) =>
  connections.map((conn) => ({
    peerId: conn.remotePeer,
    protocols: [...new Set(conn.remoteAddr.protoNames())],
  }));
