export const DEFAULT_PARKING_GATE_ID = 'uit-gate-a';

const DEFAULT_ACTIVE_PARKING_SLOT_NUMBERS = ['A1', 'A2'] as const;

const ACTIVE_PARKING_SLOT_NUMBERS_BY_GATE: Record<string, readonly string[]> = {
  [DEFAULT_PARKING_GATE_ID]: DEFAULT_ACTIVE_PARKING_SLOT_NUMBERS,
};

export function getActiveParkingSlotNumbers(gateId = DEFAULT_PARKING_GATE_ID) {
  return [...(ACTIVE_PARKING_SLOT_NUMBERS_BY_GATE[gateId] ?? DEFAULT_ACTIVE_PARKING_SLOT_NUMBERS)];
}

export function getDefaultParkingSlotBitmap(gateId = DEFAULT_PARKING_GATE_ID) {
  return '0'.repeat(getActiveParkingSlotNumbers(gateId).length);
}

export function normalizeParkingSlotNumber(value: string) {
  return String(value || '').trim().toUpperCase();
}
