export interface EventCapacityStateInput {
  capacity: number;
  confirmedCount: number;
  pendingPaymentCount: number;
  waitlistCount: number;
}

export interface EventCapacityState {
  occupiedSeats: number;
  seatsLeft: number;
  isFull: boolean;
  waitlistCount: number;
}

export function computeEventCapacityState(input: EventCapacityStateInput): EventCapacityState {
  const occupiedSeats = Math.max(0, input.confirmedCount) + Math.max(0, input.pendingPaymentCount);
  const seatsLeft = Math.max(0, input.capacity - occupiedSeats);
  return {
    occupiedSeats,
    seatsLeft,
    isFull: seatsLeft <= 0,
    waitlistCount: Math.max(0, input.waitlistCount),
  };
}
