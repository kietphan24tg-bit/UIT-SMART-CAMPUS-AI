import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

export const SOS_REALTIME_NAMESPACE = '/sos-live';
const SOS_REALTIME_ROOM = 'sos:feed';

export type SosRealtimeEventName =
  | 'sos:created'
  | 'sos:updated'
  | 'sos:cancelled'
  | 'sos:resolved'
  | 'sos:expired';

@WebSocketGateway({
  namespace: SOS_REALTIME_NAMESPACE,
  cors: {
    origin: '*',
  },
})
export class SosRealtimeGateway {
  private readonly logger = new Logger(SosRealtimeGateway.name);

  @WebSocketServer()
  private server?: Server;

  @SubscribeMessage('sos:subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() _payload?: { scope?: 'feed' },
  ) {
    void client.join(SOS_REALTIME_ROOM);
    this.logger.debug(`Client ${client.id} subscribed to ${SOS_REALTIME_ROOM}`);
    client.emit('sos:subscribed', { scope: 'feed' });
  }

  publish(event: SosRealtimeEventName, payload: { sosId: string; request: unknown }) {
    this.server?.to(SOS_REALTIME_ROOM).emit(event, payload);
    this.server?.to(SOS_REALTIME_ROOM).emit('sos:updated', payload);
  }
}
