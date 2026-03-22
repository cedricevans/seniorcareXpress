import 'dotenv/config';
import { createRequire } from 'module';
import { WebSocketServer } from 'ws';
import pb from './pocketbaseClient.js';
import logger from './logger.js';

// Polyfill EventSource for Node.js (required by PocketBase realtime)
if (typeof globalThis.EventSource === 'undefined') {
  try {
    const require = createRequire(import.meta.url);
    const es = require('eventsource');
    // eventsource exports { EventSource } as a named export
    globalThis.EventSource = es.EventSource ?? es.default ?? es;
  } catch {
    logger.warn('eventsource polyfill not available — realtime subscriptions disabled');
  }
}

let wss = null;
const clients = new Map(); // Map of userId -> Set of WebSocket connections
const enablePocketBaseRealtime = process.env.ENABLE_PB_REALTIME === 'true';

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

  // Subscribe to PocketBase collection changes only when explicitly enabled.
  // This avoids container-specific runtime crashes in minimal Railway images.
  if (enablePocketBaseRealtime) {
    subscribeToCollectionChanges();
  } else {
    logger.info('PocketBase realtime subscriptions disabled (set ENABLE_PB_REALTIME=true to enable)');
  }

  return wss;
};

const subscribeToCollectionChanges = async () => {
  const collections = [
    { name: 'care_updates', event: 'careUpdateAdded' },
    { name: 'messages',     event: 'messageReceived' },
    { name: 'video_calls',  event: 'videoCallScheduled' },
  ];

  for (const { name, event } of collections) {
    try {
      await pb.collection(name).subscribe('*', (e) => {
        if (e.action === 'create') broadcastEvent(event, e.record);
      });
    } catch (err) {
      logger.warn(`Realtime subscribe skipped for '${name}': ${err.message}`);
    }
  }

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
