import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMetaClassReminderTemplate } from "@/lib/whatsapp/sendMetaClassReminderTemplate";

const ORIGINAL_ENV = { ...process.env };

function setWhatsappEnv(): void {
  process.env.WHATSAPP_ACCESS_TOKEN = "tok";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "pn1";
  process.env.WHATSAPP_CLASS_REMINDER_TEMPLATE_NAME = "tpl";
}

function clearWhatsappEnv(): void {
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.WHATSAPP_CLASS_REMINDER_TEMPLATE_NAME;
}

describe("sendMetaClassReminderTemplate", () => {
  beforeEach(() => {
    clearWhatsappEnv();
  });

  afterEach(() => {
    Object.assign(process.env, ORIGINAL_ENV);
    vi.unstubAllGlobals();
  });

  it("returns whatsapp_not_configured when env is missing", async () => {
    const r = await sendMetaClassReminderTemplate({ toE164: "+5491111111111", bodyParameters: [] });
    expect(r).toEqual({ ok: false, code: "whatsapp_not_configured" });
  });

  it("returns whatsapp_api_error for too-short numbers", async () => {
    setWhatsappEnv();
    const r = await sendMetaClassReminderTemplate({ toE164: "+12", bodyParameters: [] });
    expect(r).toEqual({ ok: false, code: "whatsapp_api_error" });
  });

  it("returns ok:true on a successful Meta call", async () => {
    setWhatsappEnv();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const r = await sendMetaClassReminderTemplate({
      toE164: "+5491111111111",
      bodyParameters: ["Ada", "Section A1", "Online"],
    });

    expect(r).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/pn1/messages");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.to).toBe("5491111111111");
  });

  it("returns whatsapp_api_error when the API responds non-2xx", async () => {
    setWhatsappEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("err", { status: 400 })),
    );
    const r = await sendMetaClassReminderTemplate({
      toE164: "+5491111111111",
      bodyParameters: ["x"],
    });
    expect(r).toEqual({ ok: false, code: "whatsapp_api_error" });
  });

  it("returns whatsapp_http_error when fetch throws", async () => {
    setWhatsappEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const r = await sendMetaClassReminderTemplate({
      toE164: "+5491111111111",
      bodyParameters: [],
    });
    expect(r).toEqual({ ok: false, code: "whatsapp_http_error" });
  });

  it("truncates body parameter strings to 1024 chars", async () => {
    setWhatsappEnv();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const longText = "x".repeat(2000);
    await sendMetaClassReminderTemplate({
      toE164: "+5491111111111",
      bodyParameters: [longText],
    });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string) as {
      template: { components: Array<{ parameters: Array<{ text: string }> }> };
    };
    expect(body.template.components[0].parameters[0].text.length).toBe(1024);
  });
});
