import { computeEventCapacityState } from "@/lib/events/computeEventCapacityState";

export interface EventSaleSnapshotInput {
  capacity: number;
  confirmedCount: number;
  pendingPaymentCount: number;
  approvedPaymentCount: number;
}

export interface EventSaleSnapshot {
  capacity: number;
  confirmedCount: number;
  pendingPaymentCount: number;
  approvedPaymentCount: number;
  occupiedSeats: number;
  seatsLeft: number;
  /** Null when no seats are free, or when the free share rounds below 1%. */
  freePercent: number | null;
  freeSeatsUnderOnePercent: boolean;
}

export function summarizeEventSale(input: EventSaleSnapshotInput): EventSaleSnapshot {
  const capacity = Math.max(0, input.capacity);
  const confirmedCount = Math.max(0, input.confirmedCount);
  const pendingPaymentCount = Math.max(0, input.pendingPaymentCount);
  const approvedPaymentCount = Math.max(0, input.approvedPaymentCount);
  const state = computeEventCapacityState({
    capacity,
    confirmedCount,
    pendingPaymentCount,
    waitlistCount: 0,
  });
  const rawPercent = capacity > 0 ? (state.seatsLeft / capacity) * 100 : 0;
  const freeSeatsUnderOnePercent = state.seatsLeft > 0 && rawPercent < 0.5;
  const rounded = Math.round(rawPercent);
  const freePercent =
    state.seatsLeft > 0 && !freeSeatsUnderOnePercent ? Math.min(100, rounded) : null;

  return {
    capacity,
    confirmedCount,
    pendingPaymentCount,
    approvedPaymentCount,
    occupiedSeats: state.occupiedSeats,
    seatsLeft: state.seatsLeft,
    freePercent,
    freeSeatsUnderOnePercent,
  };
}
