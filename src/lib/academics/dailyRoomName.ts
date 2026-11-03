import { randomBytes } from "node:crypto";

export function createDailyRoomName(): string {
  return `s${randomBytes(16).toString("hex")}`;
}
