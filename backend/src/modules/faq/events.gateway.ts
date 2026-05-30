import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[Socket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Socket] Client disconnected: ${client.id}`);
  }

  emitQuestionAdded(question: any) {
    this.server.emit('questionAdded', question);
  }

  emitAnswerAdded(answer: any) {
    this.server.emit('answerAdded', answer);
  }

  emitStatusUpdated(questionId: string, status: string) {
    this.server.emit('statusUpdated', { questionId, status });
  }

  emitFaqConverted(faq: any) {
    this.server.emit('faqConverted', faq);
  }
}
