import 'dotenv/config';
import { WebSocketServer } from 'ws';
import pb from './pocketbaseClient.js';
import logger from './logger.js';

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
  try {
    // Subscribe to care_updates
    pb.collection('care_updates').subscribe('*', (e) => {
      if (e.action === 'create') {
        broadcastEvent('careUpdateAdded', e.record);
      }
    });

    // Subscribe to messages
    pb.collection('messages').subscribe('*', (e) => {
      if (e.action === 'create') {
        broadcastEvent('messageReceived', e.record);
      }
    });

    // Subscribe to video_calls
    pb.collection('video_calls').subscribe('*', (e) => {
      if (e.action === 'create') {
        broadcastEvent('videoCallScheduled', e.record);
      }
    });

    logger.info('WebSocket subscriptions initialized');
  } catch (error) {
    logger.error('Error subscribing to PocketBase collections:', error);
  }
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
