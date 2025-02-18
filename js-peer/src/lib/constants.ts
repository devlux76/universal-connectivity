// Topic name validation and sanitization
export const TOPIC_NAME_MIN_LENGTH = 3;
export const TOPIC_NAME_MAX_LENGTH = 64;

// Sanitize topic name for storage
export function sanitizeTopicName(name: string): string {
  // Replace any character that's not alphanumeric, hyphen, or underscore with a space
  let sanitized = name.replace(/[^a-zA-Z0-9-_ ]/g, ' ');
  
  // Replace multiple spaces with a single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Trim spaces from start and end
  sanitized = sanitized.trim();
  
  // Replace spaces with hyphens
  sanitized = sanitized.replace(/\s/g, '-');
  
  // Ensure it starts with a letter or number (if it doesn't, prepend 'room-')
  if (!/^[a-zA-Z0-9]/.test(sanitized)) {
    sanitized = 'room-' + sanitized;
  }
  
  // Truncate if too long
  if (sanitized.length > TOPIC_NAME_MAX_LENGTH) {
    sanitized = sanitized.slice(0, TOPIC_NAME_MAX_LENGTH);
  }
  
  // If too short, pad with random chars
  while (sanitized.length < TOPIC_NAME_MIN_LENGTH) {
    sanitized += '-' + Math.random().toString(36).substring(2, 3);
  }
  
  return sanitized;
}

// Format topic name for display
export function formatTopicNameForDisplay(name: string): string {
  return name.replace(/-/g, ' ');
}

export const TOPICS = {
  ROOMS: {
    LOBBY: 'universal-connectivity', // The default room, for backward compatibility
    PREFIX: 'universal-connectivity-room/', // Prefix for all other rooms
  },
  FILE: ['universal-connectivity-file'],
  PEER_DISCOVERY: ['universal-connectivity-browser-peer-discovery'],
  STREAMING: ['universal-connectivity-streams']
} as const;

// Helper to get room topic
export const getRoomTopic = (roomId: string) => {
  return roomId === 'lobby' ? TOPICS.ROOMS.LOBBY : `${TOPICS.ROOMS.PREFIX}${roomId}`;
};

export function loadUserTopics(): Record<string, string[]> {
  try {
    const userTopics = localStorage.getItem('user-topics');
    if (!userTopics) return {};

    const topics = JSON.parse(userTopics);
    const validTopics: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(topics)) {
      if (Array.isArray(value) && value.every(topic => typeof topic === 'string' && topic.trim() !== '')) {
        validTopics[key] = value;
      } else {
        console.warn(`Corrupted topic found and removed: ${key}`);
      }
    }

    return validTopics;
  } catch (error) {
    console.error('Failed to load user topics from localStorage:', error);
    return {};
  }
}

export function saveUserTopics(topics: Record<string, string[]>): void {
  try {
    localStorage.setItem('user-topics', JSON.stringify(topics));
  } catch (error) {
    console.error('Failed to save user topics to localStorage:', error);
  }
}

export const FILE_EXCHANGE_PROTOCOL = '/universal-connectivity-file/1'
export const DIRECT_MESSAGE_PROTOCOL = '/universal-connectivity/dm/1.0.0'

export const CIRCUIT_RELAY_CODE = 290

export const MIME_TEXT_PLAIN = 'text/plain'

// 👇 App specific dedicated bootstrap PeerIDs
// Their multiaddrs are ephemeral so peer routing is used to resolve multiaddr
export const WEBTRANSPORT_BOOTSTRAP_PEER_ID = '12D3KooWFhXabKDwALpzqMbto94sB7rvmZ6M28hs9Y9xSopDKwQr'

export const BOOTSTRAP_PEER_IDS = [WEBTRANSPORT_BOOTSTRAP_PEER_ID]
