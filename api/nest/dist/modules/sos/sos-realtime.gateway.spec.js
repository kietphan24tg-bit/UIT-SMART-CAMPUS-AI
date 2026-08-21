"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sos_realtime_gateway_1 = require("./sos-realtime.gateway");
describe('SosRealtimeGateway', function () {
    it('subscribes clients to the SOS feed room', function () {
        var client = {
            id: 'socket-1',
            join: jest.fn(),
            emit: jest.fn(),
        };
        var gateway = new sos_realtime_gateway_1.SosRealtimeGateway();
        gateway.handleSubscribe(client, {});
        expect(client.join).toHaveBeenCalledWith('sos:feed');
        expect(client.emit).toHaveBeenCalledWith('sos:subscribed', {
            scope: 'feed',
        });
    });
    it('publishes the named event and the generic updated event', function () {
        var emit = jest.fn();
        var to = jest.fn().mockReturnValue({ emit: emit });
        var gateway = new sos_realtime_gateway_1.SosRealtimeGateway();
        gateway.server = { to: to };
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
