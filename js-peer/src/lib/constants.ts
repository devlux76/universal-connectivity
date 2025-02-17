export const TOPICS = {
  CHAT: ['universal-connectivity'],
  FILE: ['universal-connectivity-file'],
  PEER_DISCOVERY: ['universal-connectivity-browser-peer-discovery'],
  STREAMING: ['universal-connectivity-streams']
} as const;

export function loadUserTopics(): Record<string, string[]> {
  const userTopics = localStorage.getItem('user-topics');
  return userTopics ? JSON.parse(userTopics) : {};
}

export function saveUserTopics(topics: Record<string, string[]>): void {
  localStorage.setItem('user-topics', JSON.stringify(topics));
}

export const FILE_EXCHANGE_PROTOCOL = '/universal-connectivity-file/1'
export const DIRECT_MESSAGE_PROTOCOL = '/universal-connectivity/dm/1.0.0'

export const CIRCUIT_RELAY_CODE = 290

export const MIME_TEXT_PLAIN = 'text/plain'

// 👇 App specific dedicated bootstrap PeerIDs
// Their multiaddrs are ephemeral so peer routing is used to resolve multiaddr
export const WEBTRANSPORT_BOOTSTRAP_PEER_ID = '12D3KooWFhXabKDwALpzqMbto94sB7rvmZ6M28hs9Y9xSopDKwQr'

export const BOOTSTRAP_PEER_IDS = [WEBTRANSPORT_BOOTSTRAP_PEER_ID]
