export type ParkingSubscriptionStatus =
  | 'inactive'
  | 'pending'
  | 'active'
  | 'expired';

export interface ParkingSensorSummary {
  temperature: number | null;
  humidity: number | null;
  rainDetected: boolean;
  fireDetected: boolean;
  deviceIp: string | null;
  reportedAt: string | null;
}

export interface ParkingSlotState {
  slotNumber: string;
  zone: string;
  isOccupied: boolean;
  vehiclePlate?: string | null;
  lastUpdated: string;
}

export interface ParkingStatus {
  gateId: string;
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  activeSessions: number;
  lastUpdated: string | null;
  sensors: ParkingSensorSummary;
  slots: ParkingSlotState[];
}

export interface ParkingSubscriptionInfo {
  id: string;
  status: ParkingSubscriptionStatus;
  monthlyFee: number;
  startDate: string | null;
  endDate: string | null;
  lastPaymentAt: string | null;
}

export interface RegisteredVehicle {
  id: string;
  plateNumber: string;
  rfidTag: string;
  label?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subscription: ParkingSubscriptionInfo;
}

export interface CreateVehicleRequest {
  plateNumber: string;
  rfidTag: string;
  label?: string;
}

export interface PaymentCheckout {
  transactionId: string;
  provider: string;
  mode: 'sandbox';
  amount: number;
  orderId: string;
  checkoutUrl: string;
}
