import { isValidTopic, autofixTopicsStorage, loadTopicsFromStorage, storeTopicsInStorage, useAutoSubscribeToNewTopics } from './libp2p/topics.js';
import { retryWithBackoff, dialWebRTCMaddrs, connectToMultiaddr } from './libp2p/dial.js';
import { msgIdFnStrictNoSign, getFormattedConnections } from './libp2p/utils.js';
import { loadLibp2pKey, saveLibp2pKey, startLibp2p } from './libp2p/start.js';
import type { Libp2pType } from './libp2p/types';

export {
  isValidTopic,
  autofixTopicsStorage,
  loadTopicsFromStorage,
  storeTopicsInStorage,
  useAutoSubscribeToNewTopics,
  retryWithBackoff,
  dialWebRTCMaddrs,
  connectToMultiaddr,
  msgIdFnStrictNoSign,
  getFormattedConnections,
  loadLibp2pKey,
  saveLibp2pKey,
  startLibp2p,
};

export type { Libp2pType };