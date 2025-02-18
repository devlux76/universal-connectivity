import type { Libp2p } from '@libp2p/interface';
import { Multiaddr } from '@multiformats/multiaddr';
import { forComponent } from '../logger';

export const MAX_RETRIES = 30;
export const INITIAL_BACKOFF_MS = 1000;
const log = forComponent('libp2p:dial');

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  backoff = INITIAL_BACKOFF_MS,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    if (onRetry) onRetry(MAX_RETRIES - retries + 1, error as Error);
    await new Promise(resolve => setTimeout(resolve, backoff));
    return retryWithBackoff(operation, retries - 1, backoff * 2, onRetry);
  }
}

export async function dialWebRTCMaddrs(libp2p: Libp2p, multiaddrs: Multiaddr[]): Promise<void> {
  const webRTCMadrs = multiaddrs.filter((maddr) => maddr.protoNames().includes('webrtc'));
  log(`dialing WebRTC multiaddrs: %o`, webRTCMadrs);
  for (const addr of webRTCMadrs) {
    try {
      log(`attempting to dial webrtc multiaddr: %o`, addr);
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
  log(`dialling: %a`, multiaddr);
  try {
    const conn = await libp2p.dial(multiaddr);
    log('connected to %p on %a', conn.remotePeer, conn.remoteAddr);
    return conn;
  } catch (e: unknown) {
    console.error(e);
    throw e;
  }
};
