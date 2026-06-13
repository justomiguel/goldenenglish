import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { subscribeToPush, unsubscribeFromPush, urlBase64ToUint8Array } from "@/lib/push/subscribePushClient";

function stubPushEnv(options: {
  permission?: NotificationPermission;
  requestPermission?: () => Promise<NotificationPermission>;
  swReady?: Promise<ServiceWorkerRegistration> | "reject";
  existingSubscription?: PushSubscription | null;
  subscribeResult?: PushSubscription;
  fetchOk?: boolean;
  fetchThrows?: boolean;
  hasNotification?: boolean;
  hasServiceWorker?: boolean;
  hasPushManager?: boolean;
}) {
  const {
    permission = "granted",
    requestPermission = vi.fn().mockResolvedValue("granted"),
    swReady = Promise.resolve({
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(options.existingSubscription ?? null),
        subscribe: vi.fn().mockResolvedValue(
          options.subscribeResult ?? {
            toJSON: () => ({
              endpoint: "https://push.example/e",
              keys: { p256dh: "p", auth: "a" },
            }),
          },
        ),
      },
    } as unknown as ServiceWorkerRegistration),
    fetchOk = true,
    fetchThrows = false,
    hasNotification = true,
    hasServiceWorker = true,
    hasPushManager = true,
  } = options;

  if (hasNotification) {
    vi.stubGlobal("Notification", { permission, requestPermission });
  } else {
    Reflect.deleteProperty(globalThis, "Notification");
  }

  if (hasServiceWorker) {
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: swReady === "reject" ? Promise.reject(new Error("no sw")) : swReady,
      },
    });
  } else {
    vi.stubGlobal("navigator", {});
  }

  if (hasPushManager) {
    vi.stubGlobal("PushManager", class {});
  } else {
    Reflect.deleteProperty(globalThis, "PushManager");
  }

  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(() => {
      if (fetchThrows) return Promise.reject(new Error("network"));
      return Promise.resolve({ ok: fetchOk } as Response);
    }),
  );
}

describe("urlBase64ToUint8Array", () => {
  it("decodes url-safe base64 with padding", () => {
    const bytes = urlBase64ToUint8Array("AQ-I");
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("decodes standard base64", () => {
    const bytes = urlBase64ToUint8Array("AQID");
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
  });
});

describe("subscribeToPush", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "AQID" };
  });

  afterEach(() => {
    process.env = env;
    vi.unstubAllGlobals();
  });

  it("returns vapid_unconfigured without public key", async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    await expect(subscribeToPush()).resolves.toEqual({ ok: false, code: "vapid_unconfigured" });
  });

  it("returns unsupported when service worker or PushManager missing", async () => {
    stubPushEnv({ hasServiceWorker: false });
    await expect(subscribeToPush()).resolves.toEqual({ ok: false, code: "unsupported" });

    vi.unstubAllGlobals();
    stubPushEnv({ hasPushManager: false });
    await expect(subscribeToPush()).resolves.toEqual({ ok: false, code: "unsupported" });
  });

  it("requests permission when default", async () => {
    const requestPermission = vi.fn().mockResolvedValue("granted");
    stubPushEnv({ permission: "default", requestPermission });
    await expect(subscribeToPush()).resolves.toEqual({ ok: true });
    expect(requestPermission).toHaveBeenCalled();
  });

  it("returns denied when permission is not granted", async () => {
    stubPushEnv({ permission: "denied" });
    await expect(subscribeToPush()).resolves.toEqual({ ok: false, code: "denied" });
  });

  it("returns denied when requestPermission rejects grant", async () => {
    stubPushEnv({
      permission: "default",
      requestPermission: vi.fn().mockResolvedValue("denied"),
    });
    await expect(subscribeToPush()).resolves.toEqual({ ok: false, code: "denied" });
  });

  it("returns no_sw when service worker is not ready", async () => {
    stubPushEnv({ swReady: "reject" });
    await expect(subscribeToPush()).resolves.toEqual({ ok: false, code: "no_sw" });
  });

  it("reuses existing subscription without subscribe call", async () => {
    const existing = {
      toJSON: () => ({
        endpoint: "https://push.example/existing",
        keys: { p256dh: "p", auth: "a" },
      }),
    } as PushSubscription;
    const subscribe = vi.fn();
    stubPushEnv({
      existingSubscription: existing,
      swReady: Promise.resolve({
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(existing),
          subscribe,
        },
      } as unknown as ServiceWorkerRegistration),
    });
    await expect(subscribeToPush()).resolves.toEqual({ ok: true });
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("returns network when fetch fails", async () => {
    stubPushEnv({ fetchOk: false });
    await expect(subscribeToPush()).resolves.toEqual({ ok: false, code: "network" });
  });

  it("returns network when fetch throws", async () => {
    stubPushEnv({ fetchThrows: true });
    await expect(subscribeToPush()).resolves.toEqual({ ok: false, code: "network" });
  });

  it("throws on invalid subscription payload", async () => {
    stubPushEnv({
      subscribeResult: {
        toJSON: () => ({ endpoint: "", keys: {} }),
      } as PushSubscription,
    });
    await expect(subscribeToPush()).rejects.toThrow("invalid_push_subscription");
  });
});

describe("unsubscribeFromPush", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no-ops without service worker", async () => {
    vi.stubGlobal("navigator", {});
    await expect(unsubscribeFromPush()).resolves.toBeUndefined();
  });

  it("unsubscribes when subscription exists", async () => {
    const unsubscribe = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue({ unsubscribe }),
          },
        }),
      },
    });
    await unsubscribeFromPush();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("swallows errors from unsubscribe", async () => {
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.reject(new Error("fail")),
      },
    });
    await expect(unsubscribeFromPush()).resolves.toBeUndefined();
  });
});
