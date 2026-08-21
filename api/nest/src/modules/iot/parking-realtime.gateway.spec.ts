import { ParkingRealtimeGateway } from './parking-realtime.gateway';

describe('ParkingRealtimeGateway', () => {
  it('emits parking updates to the gate room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const gateway = new ParkingRealtimeGateway();

    (gateway as unknown as { server: { to: typeof to } }).server = { to };

    gateway.publishParkingStatus('uit-gate-a', {
      gateId: 'uit-gate-a',
      totalSlots: 2,
      occupiedSlots: 1,
      availableSlots: 1,
      activeSessions: 0,
      lastUpdated: '2026-04-14T10:00:00.000Z',
      sensors: {
        temperature: 29,
        humidity: 65,
        rainDetected: false,
        fireDetected: false,
        deviceIp: '10.0.0.1',
        reportedAt: '2026-04-14T10:00:00.000Z',
      },
      slots: [],
    });

    expect(to).toHaveBeenCalledWith('parking:uit-gate-a');
    expect(emit).toHaveBeenCalledWith(
      'parking:status_updated',
      expect.objectContaining({
        gateId: 'uit-gate-a',
        totalSlots: 2,
      }),
    );
  });

  it('subscribes clients to the default gate room', () => {
    const client = {
      id: 'socket-1',
      join: jest.fn(),
      emit: jest.fn(),
    };
    const gateway = new ParkingRealtimeGateway();

    gateway.handleSubscribe(client as never, {});

    expect(client.join).toHaveBeenCalledWith('parking:uit-gate-a');
    expect(client.emit).toHaveBeenCalledWith('parking:subscribed', {
      gateId: 'uit-gate-a',
    });
  });
});
