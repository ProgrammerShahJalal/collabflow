import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Array<{ event: string; callback: (...args: any[]) => void }> = [];

  constructor() {
    // Pre-initialize socket if possible or handle listener buffering
  }

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    // Re-attach all listeners that were registered before connection
    this.listeners.forEach(({ event, callback }) => {
      this.socket?.on(event, callback);
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.listeners.push({ event, callback });
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.listeners = this.listeners.filter(
      (l) => l.event !== event || (callback && l.callback !== callback),
    );
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any) {
    if (!this.socket) {
      console.warn('Socket not connected. Event not emitted.');
      return;
    }
    this.socket.emit(event, data);
  }
}

export const socketService = new SocketService();
