export type DailyRoomClient = {
  createPrivateRoom(input: {
    apiKey: string;
    roomName: string;
  }): Promise<{ ok: true; url: string } | { ok: false; code: "daily_failed" }>;
  deleteRoom(input: {
    apiKey: string;
    roomName: string;
  }): Promise<{ ok: true } | { ok: false; code: "daily_failed" }>;
  createMeetingToken(input: {
    apiKey: string;
    roomName: string;
    expUnix: number;
    isOwner: boolean;
    userName: string;
  }): Promise<{ ok: true; token: string } | { ok: false; code: "daily_failed" }>;
};

const DAILY_API = "https://api.daily.co/v1";

function bearerJsonHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function readJsonObject(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const json: unknown = await response.json();
    if (!json || typeof json !== "object") return null;
    return json as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function createFetchDailyRoomClient(fetchImpl: typeof fetch): DailyRoomClient {
  return {
    async createPrivateRoom({ apiKey, roomName }) {
      const response = await fetchImpl(`${DAILY_API}/rooms`, {
        method: "POST",
        headers: bearerJsonHeaders(apiKey),
        body: JSON.stringify({
          name: roomName,
          privacy: "private",
          properties: { enable_knocking: false },
        }),
      });
      if (!response.ok) return { ok: false, code: "daily_failed" };
      const json = await readJsonObject(response);
      const url = typeof json?.url === "string" ? json.url : "";
      if (!url) return { ok: false, code: "daily_failed" };
      return { ok: true, url };
    },
    async deleteRoom({ apiKey, roomName }) {
      const response = await fetchImpl(`${DAILY_API}/rooms/${roomName}`, {
        method: "DELETE",
        headers: bearerJsonHeaders(apiKey),
      });
      if (!response.ok) return { ok: false, code: "daily_failed" };
      return { ok: true };
    },
    async createMeetingToken({ apiKey, roomName, expUnix, isOwner, userName }) {
      const response = await fetchImpl(`${DAILY_API}/meeting-tokens`, {
        method: "POST",
        headers: bearerJsonHeaders(apiKey),
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            exp: expUnix,
            is_owner: isOwner,
            user_name: userName,
          },
        }),
      });
      if (!response.ok) return { ok: false, code: "daily_failed" };
      const json = await readJsonObject(response);
      const token = typeof json?.token === "string" ? json.token : "";
      if (!token) return { ok: false, code: "daily_failed" };
      return { ok: true, token };
    },
  };
}
