'use strict';

const { WebSocketServer } = require('ws');
const { logger } = require('./logger');

let wss = null;

/**
 * Initialize WebSocket Server attached to HTTP server
 */
function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    logger.info({ ip: req.socket.remoteAddress }, 'WebSocket client connected');

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        logger.debug({ parsed }, 'WebSocket message received');
      } catch (err) {
        // ignore non-json messages
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      logger.error({ error: err.message }, 'WebSocket client error');
    });

    // Send connection confirmation
    ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() }));
  });

  // Heartbeat interval to clear dead connections
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  logger.info('WebSocket Server initialized on /ws');
  return wss;
}

/**
 * Broadcast an event to all connected WebSocket clients
 * @param {string} type - Event type (e.g. 'ORDER_UPDATED', 'INVENTORY_UPDATED')
 * @param {object} data - Payload data
 */
function broadcast(type, data = {}) {
  if (!wss) return;
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  
  let sentCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1 /* OPEN */) {
      client.send(payload);
      sentCount++;
    }
  });
  logger.info({ type, sentCount }, 'Broadcasted WebSocket event');
}

module.exports = {
  initWebSocket,
  broadcast
};
