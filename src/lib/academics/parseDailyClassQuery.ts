const START_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseDailyClassQuery(input: {
  day?: string;
  start?: string;
}): { dayOfWeek: number; startTime: string } | null {
  const dayRaw = input.day ?? "";
  if (!/^[0-6]$/.test(dayRaw)) return null;
  const start = input.start ?? "";
  if (!START_TIME.test(start)) return null;
  return { dayOfWeek: Number(dayRaw), startTime: start };
}
