import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

interface ClientMeta {
  id: string;
  connectedAt: number;
  lastPing: number;
}

export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientMeta> = new Map();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const id = crypto.randomUUID();
      const now = Date.now();

      this.clients.set(ws, { id, connectedAt: now, lastPing: now });

      ws.send(JSON.stringify({ type: 'welcome', connectionId: id, timestamp: now }));

      ws.on('pong', () => {
        const meta = this.clients.get(ws);
        if (meta) meta.lastPing = Date.now();
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    this.pingInterval = setInterval(() => {
      const now = Date.now();
      for (const [ws, meta] of this.clients) {
        if (now - meta.lastPing > 120_000) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }
        ws.ping();
      }
    }, 30_000);
  }

  broadcast(event: object): void {
    if (!this.wss) return;
    const message = JSON.stringify(event);
    for (const [ws] of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  get connectionCount(): number {
    return this.clients.size;
  }

  shutdown(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    for (const [ws] of this.clients) {
      ws.terminate();
    }
    this.clients.clear();
    this.wss?.close();
    this.wss = null;
  }
}

export const wsManager = new WebSocketManager();
