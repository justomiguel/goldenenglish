export function diffLostSeatSelection(input: {
  selectedSeatKeys: readonly string[];
  unavailableSeatKeys: readonly string[];
}): { kept: string[]; lost: string[] } {
  const unavailable = new Set(input.unavailableSeatKeys);
  const kept: string[] = [];
  const lost: string[] = [];
  for (const key of input.selectedSeatKeys) {
    if (unavailable.has(key)) lost.push(key);
    else kept.push(key);
  }
  return { kept, lost };
}
