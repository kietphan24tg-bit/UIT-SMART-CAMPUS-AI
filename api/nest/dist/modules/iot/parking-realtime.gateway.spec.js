"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parking_realtime_gateway_1 = require("./parking-realtime.gateway");
describe('ParkingRealtimeGateway', function () {
    it('emits parking updates to the gate room', function () {
        var emit = jest.fn();
        var to = jest.fn().mockReturnValue({ emit: emit });
        var gateway = new parking_realtime_gateway_1.ParkingRealtimeGateway();
        gateway.server = { to: to };
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
        expect(emit).toHaveBeenCalledWith('parking:status_updated', expect.objectContaining({
            gateId: 'uit-gate-a',
            totalSlots: 2,
        }));
    });
    it('subscribes clients to the default gate room', function () {
        var client = {
            id: 'socket-1',
            join: jest.fn(),
            emit: jest.fn(),
        };
        var gateway = new parking_realtime_gateway_1.ParkingRealtimeGateway();
        gateway.handleSubscribe(client, {});
        expect(client.join).toHaveBeenCalledWith('parking:uit-gate-a');
        expect(client.emit).toHaveBeenCalledWith('parking:subscribed', {
            gateId: 'uit-gate-a',
        });
    });
});
