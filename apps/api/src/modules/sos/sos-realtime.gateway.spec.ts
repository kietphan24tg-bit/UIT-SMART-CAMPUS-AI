import { SosRealtimeGateway } from './sos-realtime.gateway';

describe('SosRealtimeGateway', () => {
  it('subscribes clients to the SOS feed room', () => {
    const client = {
      id: 'socket-1',
      join: jest.fn(),
      emit: jest.fn(),
    };
    const gateway = new SosRealtimeGateway();

    gateway.handleSubscribe(client as never, {});

    expect(client.join).toHaveBeenCalledWith('sos:feed');
    expect(client.emit).toHaveBeenCalledWith('sos:subscribed', {
      scope: 'feed',
    });
  });

  it('publishes the named event and the generic updated event', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const gateway = new SosRealtimeGateway();

    (gateway as unknown as { server: { to: typeof to } }).server = { to };

    gateway.publish('sos:cancelled', {
      sosId: 'sos-1',
      request: { id: 'sos-1', status: 'cancelled' },
    });

    expect(to).toHaveBeenCalledWith('sos:feed');
    expect(emit).toHaveBeenNthCalledWith(1, 'sos:cancelled', {
      sosId: 'sos-1',
      request: { id: 'sos-1', status: 'cancelled' },
    });
    expect(emit).toHaveBeenNthCalledWith(2, 'sos:updated', {
      sosId: 'sos-1',
      request: { id: 'sos-1', status: 'cancelled' },
    });
  });
});
