import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { ParkingStatus } from '@smart-campus/shared';
import type { Server, Socket } from 'socket.io';

import { DEFAULT_PARKING_GATE_ID } from '../parking/parking-slot-layout';

export const PARKING_REALTIME_NAMESPACE = '/parking-live';

function resolveGateId(gateId?: string | null) {
  const normalized = String(gateId || '').trim();
  return normalized || DEFAULT_PARKING_GATE_ID;
}

export function getParkingRealtimeRoom(gateId?: string | null) {
  return `parking:${resolveGateId(gateId)}`;
}

@WebSocketGateway({
  namespace: PARKING_REALTIME_NAMESPACE,
  cors: {
    origin: '*',
  },
})
export class ParkingRealtimeGateway {
  private readonly logger = new Logger(ParkingRealtimeGateway.name);

  @WebSocketServer()
  private server?: Server;

  @SubscribeMessage('parking:subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload?: { gateId?: string },
  ) {
    const gateId = resolveGateId(payload?.gateId);
    const room = getParkingRealtimeRoom(gateId);

    void client.join(room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    client.emit('parking:subscribed', { gateId });
  }

  publishParkingStatus(gateId: string | undefined, status: ParkingStatus) {
    this.server?.to(getParkingRealtimeRoom(gateId)).emit(
      'parking:status_updated',
      status,
    );
  }

  publishTelemetrySnapshot(gateId: string | undefined, snapshot: unknown) {
    this.server?.to(getParkingRealtimeRoom(gateId)).emit(
      'parking:telemetry_updated',
      snapshot,
    );
  }
}
