import 'dotenv/config';
import { createRequire } from 'module';
import { WebSocketServer } from 'ws';
import pb from './pocketbaseClient.js';
import logger from './logger.js';

// Polyfill EventSource for Node.js ESM (required by PocketBase realtime subscriptions)
try {
  if (typeof globalThis.EventSource === 'undefined') {
    const require = createRequire(import.meta.url);
    const esModule = require('eventsource');
    // eventsource v3+ exports { EventSource }, v2 exports EventSource directly
    const ES = esModule.EventSource ?? esModule.default ?? esModule;
    globalThis.EventSource = ES;
    logger.info('EventSource polyfill loaded successfully');
  }
} catch (err) {
  logger.warn('EventSource polyfill failed — realtime subscriptions disabled:', err.message);
}

let wss = null;
const clients = new Map(); // Map of userId -> Set of WebSocket connections

const initWebSocket = (server) => {
  wss = new WebSocketServer({ server, path: '/ws/notifications' });

  wss.on('connection', (ws) => {
    let userId = null;

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === 'subscribe') {
          userId = message.userId;
          if (!clients.has(userId)) {
            clients.set(userId, new Set());
          }
          clients.get(userId).add(ws);
          logger.info(`WebSocket client subscribed: ${userId}`);
          ws.send(JSON.stringify({ type: 'subscribed', userId }));
        }
      } catch (error) {
        logger.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        clients.get(userId).delete(ws);
        if (clients.get(userId).size === 0) {
          clients.delete(userId);
        }
        logger.info(`WebSocket client disconnected: ${userId}`);
      }
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  });

  // Subscribe to PocketBase collection changes
  subscribeToCollectionChanges();

  return wss;
};

const subscribeToCollectionChanges = async () => {
  if (typeof globalThis.EventSource === 'undefined') {
    logger.warn('EventSource not available — PocketBase realtime subscriptions skipped');
    return;
  }

  const subscribeToCollection = async (name, handler) => {
    try {
      await pb.collection(name).subscribe('*', handler);
    } catch (err) {
      logger.warn(`Failed to subscribe to ${name}: ${err.message}`);
    }
  };

  await subscribeToCollection('care_updates', (e) => {
    if (e.action === 'create') broadcastEvent('careUpdateAdded', e.record);
  });

  await subscribeToCollection('messages', (e) => {
    if (e.action === 'create') broadcastEvent('messageReceived', e.record);
  });

  await subscribeToCollection('video_calls', (e) => {
    if (e.action === 'create') broadcastEvent('videoCallScheduled', e.record);
  });

  logger.info('WebSocket subscriptions initialized');
};

const broadcastEvent = (eventType, data) => {
  const message = JSON.stringify({
    type: 'event',
    eventType,
    data,
    timestamp: new Date().toISOString(),
  });

  // Broadcast to all connected clients
  // In production, filter by role and patient assignment
  clients.forEach((wsSet) => {
    wsSet.forEach((ws) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(message);
      }
    });
  });

  logger.debug(`Event broadcasted: ${eventType}`);
};

const sendUrgentAlert = (userId, alertData) => {
  const message = JSON.stringify({
    type: 'event',
    eventType: 'urgentAlert',
    data: alertData,
    timestamp: new Date().toISOString(),
  });

  if (clients.has(userId)) {
    clients.get(userId).forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(message);
      }
    });
  }
};

export { initWebSocket, broadcastEvent, sendUrgentAlert };
