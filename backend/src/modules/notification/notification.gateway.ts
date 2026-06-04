import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    // Silent — no-op for demo
  }

  handleDisconnect(client: any) {
    // Silent — no-op for demo
  }

  /**
   * Broadcast an event to all connected clients.
   * Called by services when data changes.
   */
  broadcast(event: string, data: any) {
    this.server?.emit(event, data);
  }
}