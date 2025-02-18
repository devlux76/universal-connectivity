import { useEffect } from 'react';
import { useLibp2pContext } from '@/context/ctx';

const TOPICS_STORAGE_KEY = 'subscribedTopics';

// Checks if a topic is valid (contains only printable ASCII characters)
export function isValidTopic(topic: string): boolean {
  return /^[\x20-\x7E]+$/.test(topic);
}

// Automatically fix any corrupted topic data in localStorage
export function autofixTopicsStorage(): void {
  try {
    const data = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (!data) return;
    let needsCleanup = false;
    try {
      const topics = JSON.parse(data);
      if (!Array.isArray(topics)) {
        needsCleanup = true;
      } else {
        // Check if any topics contain invalid characters
        const validTopics = topics.filter(isValidTopic);
        if (validTopics.length !== topics.length) {
          needsCleanup = true;
          localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(validTopics));
        }
      }
    } catch (e) {
      // If we can't parse the JSON, it's definitely corrupted
      needsCleanup = true;
    }
    if (needsCleanup) {
      console.warn('[Autofix] Cleaned up corrupted topic data in localStorage');
      localStorage.setItem(TOPICS_STORAGE_KEY, '[]');
    }
  } catch (e) {
    console.error('[Autofix] Failed to fix topics storage:', e);
  }
}

export function loadTopicsFromStorage(): Set<string> {
  try {
    autofixTopicsStorage();
    const data = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (!data) return new Set();
    const topics = JSON.parse(data);
    return new Set(topics.filter(isValidTopic));
  } catch {
    return new Set();
  }
}

export function storeTopicsInStorage(topics: Set<string>) {
  const validTopics = Array.from(topics).filter(isValidTopic);
  localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(validTopics));
}

export function useAutoSubscribeToNewTopics() {
  const { libp2p } = useLibp2pContext();
  
  useEffect(() => {
    if (!libp2p?.services?.pubsub) {
      return;
    }
    
    const knownTopics = loadTopicsFromStorage();
    for (const t of libp2p.services.pubsub.getTopics()) {
      knownTopics.add(t);
    }

    const onSubscriptionChange = () => {
      for (const topic of libp2p.services.pubsub.getTopics()) {
        if (!knownTopics.has(topic) && isValidTopic(topic)) {
          knownTopics.add(topic);
          libp2p.services.pubsub.subscribe(topic);
          storeTopicsInStorage(knownTopics);
        }
      }
    };

    libp2p.services.pubsub.addEventListener('subscription-change', onSubscriptionChange);
    
    knownTopics.forEach((t) => {
      if (!libp2p.services.pubsub.getTopics().includes(t)) {
        try {
          libp2p.services.pubsub.subscribe(t);
        } catch (err) {
          console.error(`Failed to resubscribe to topic ${t}:`, err);
        }
      }
    });
    
    storeTopicsInStorage(knownTopics);
    
    return () => {
      libp2p.services.pubsub.removeEventListener('subscription-change', onSubscriptionChange);
    };
  }, [libp2p?.services?.pubsub]);
  
  return null;
}