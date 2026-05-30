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

  emitVoteUpdated(answerId: string, upvotes: number) {
    this.server.emit('voteUpdated', { answerId, upvotes });
  }

  emitUserUpdated(userId: string) {
    this.server.emit('userUpdated', { userId });
  }

  emitAnswerAccepted(answerId: string, questionId: string, accepted: boolean) {
    this.server.emit('answerAccepted', { answerId, questionId, accepted });
  }
}
