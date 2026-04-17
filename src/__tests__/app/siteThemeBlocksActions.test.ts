/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAssertAdmin,
  recordSystemAudit,
  revalidatePath,
  updateTag,
  randomUuid,
} = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  randomUuid: vi.fn().mockReturnValue("11111111-1111-4111-8111-111111111111"),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));
vi.mock("next/cache", () => ({ revalidatePath, updateTag }));
vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return { ...actual, randomUUID: () => randomUuid() };
});

import {
  addLandingBlockAction,
  moveLandingBlockAction,
  removeLandingBlockAction,
  setSiteThemeKindAction,
  updateLandingBlockAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeBlocksActions";

const VALID_ID = "00000000-0000-4000-8000-000000000222";
const BLOCK_ID = "22222222-2222-4222-8222-222222222222";

interface FakeRow {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  archived_at: string | null;
  template_kind: string;
  properties: Record<string, string>;
  content: Record<string, unknown>;
  blocks: unknown;
}

function makeSupabase(initialRow: FakeRow | null) {
  const updates: Array<Record<string, unknown>> = [];
  const builder = {
    select: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    maybeSingle: vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ data: initialRow, error: null }),
      ),
    update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      updates.push(payload);
      return builder;
    }),
    then: undefined as unknown,
  } as unknown as Record<string, ReturnType<typeof vi.fn>> & {
    then?: (cb: (v: unknown) => unknown) => Promise<unknown>;
  };
  builder.then = (cb) =>
    Promise.resolve({ data: null, error: null }).then(cb);
  return {
    from: vi.fn().mockReturnValue(builder),
    updates,
  };
}

const baseRow: FakeRow = {
  id: VALID_ID,
  slug: "default",
  name: "Default",
  is_active: true,
  archived_at: null,
  template_kind: "classic",
  properties: {},
  content: {},
  blocks: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("addLandingBlockAction", () => {
  it("rejects unauthorized callers", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("nope"));
    const result = await addLandingBlockAction({
      locale: "en",
      id: VALID_ID,
      section: "modalidades",
      kind: "card",
      copy: { es: { title: "ES" }, en: { title: "EN" } },
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects invalid Zod payloads", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const result = await addLandingBlockAction({
      locale: "en",
      id: VALID_ID,
      section: "unknown",
      kind: "card",
      copy: { es: { title: "x" }, en: {} },
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("rejects when both locales are empty", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const result = await addLandingBlockAction({
      locale: "en",
      id: VALID_ID,
      section: "modalidades",
      kind: "card",
      copy: { es: {}, en: {} },
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("appends a new block with a generated id and persists the array", async () => {
    const supabase = makeSupabase(baseRow);
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "u" } });
    const result = await addLandingBlockAction({
      locale: "es",
      id: VALID_ID,
      section: "modalidades",
      kind: "card",
      copy: { es: { title: "Hola" }, en: { title: "Hello" } },
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    const blocks = (supabase.updates[0] as { blocks: ReadonlyArray<{ id: string; section: string; position: number }> })
      .blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe("11111111-1111-4111-8111-111111111111");
    expect(blocks[0].section).toBe("modalidades");
    expect(blocks[0].position).toBe(0);
    expect(updateTag).toHaveBeenCalledWith("site-theme-active");
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "site_theme_blocks_updated" }),
    );
  });
});

describe("updateLandingBlockAction", () => {
  it("returns not_found when the block id is unknown", async () => {
    const supabase = makeSupabase(baseRow);
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "u" } });
    const result = await updateLandingBlockAction({
      locale: "en",
      id: VALID_ID,
      blockId: BLOCK_ID,
      copy: { es: { title: "x" }, en: {} },
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("updates an existing block", async () => {
    const row: FakeRow = {
      ...baseRow,
      blocks: [
        {
          id: BLOCK_ID,
          section: "inicio",
          kind: "card",
          position: 0,
          copy: { es: { title: "old" }, en: {} },
        },
      ],
    };
    const supabase = makeSupabase(row);
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "u" } });
    const result = await updateLandingBlockAction({
      locale: "en",
      id: VALID_ID,
      blockId: BLOCK_ID,
      copy: { es: { title: "new" }, en: { body: "Body" } },
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    const persisted = (supabase.updates[0] as {
      blocks: Array<{ id: string; copy: { es: { title?: string }; en: { body?: string } } }>;
    }).blocks;
    expect(persisted[0].id).toBe(BLOCK_ID);
    expect(persisted[0].copy.es.title).toBe("new");
    expect(persisted[0].copy.en.body).toBe("Body");
  });
});

describe("removeLandingBlockAction", () => {
  it("removes the block and re-numbers positions", async () => {
    const row: FakeRow = {
      ...baseRow,
      blocks: [
        { id: BLOCK_ID, section: "inicio", kind: "card", position: 0, copy: { es: { title: "a" }, en: {} } },
        { id: "33333333-3333-4333-8333-333333333333", section: "inicio", kind: "card", position: 1, copy: { es: { title: "b" }, en: {} } },
      ],
    };
    const supabase = makeSupabase(row);
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "u" } });
    const result = await removeLandingBlockAction({
      locale: "en",
      id: VALID_ID,
      blockId: BLOCK_ID,
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    const persisted = (supabase.updates[0] as {
      blocks: Array<{ id: string; position: number }>;
    }).blocks;
    expect(persisted).toHaveLength(1);
    expect(persisted[0].position).toBe(0);
  });
});

describe("moveLandingBlockAction", () => {
  const SECOND = "33333333-3333-4333-8333-333333333333";

  it("rejects payloads with an invalid direction", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const result = await moveLandingBlockAction({
      locale: "en",
      id: VALID_ID,
      blockId: BLOCK_ID,
      direction: 0,
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("returns not_found when the block id is unknown", async () => {
    const supabase = makeSupabase(baseRow);
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "u" } });
    const result = await moveLandingBlockAction({
      locale: "en",
      id: VALID_ID,
      blockId: BLOCK_ID,
      direction: 1,
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("swaps positions inside the same section and persists", async () => {
    const row: FakeRow = {
      ...baseRow,
      blocks: [
        { id: BLOCK_ID, section: "inicio", kind: "card", position: 0, copy: { es: { title: "a" }, en: {} } },
        { id: SECOND, section: "inicio", kind: "card", position: 1, copy: { es: { title: "b" }, en: {} } },
      ],
    };
    const supabase = makeSupabase(row);
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "u" } });
    const result = await moveLandingBlockAction({
      locale: "en",
      id: VALID_ID,
      blockId: BLOCK_ID,
      direction: 1,
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    const persisted = (supabase.updates[0] as {
      blocks: Array<{ id: string; position: number }>;
    }).blocks;
    expect(persisted.map((b) => b.id)).toEqual([SECOND, BLOCK_ID]);
    expect(persisted.map((b) => b.position)).toEqual([0, 1]);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "site_theme_blocks_updated",
        payload: expect.objectContaining({ op: "move", direction: 1 }),
      }),
    );
  });
});

describe("setSiteThemeKindAction", () => {
  it("rejects when the kind is outside the enum", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const result = await setSiteThemeKindAction({
      locale: "en",
      id: VALID_ID,
      kind: "brutalist",
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("persists the new kind and emits audit/cache invalidation", async () => {
    const supabase = makeSupabase(baseRow);
    mockAssertAdmin.mockResolvedValue({ supabase, user: { id: "u" } });
    const result = await setSiteThemeKindAction({
      locale: "es",
      id: VALID_ID,
      kind: "editorial",
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(supabase.updates[0]).toEqual(
      expect.objectContaining({ template_kind: "editorial" }),
    );
    expect(updateTag).toHaveBeenCalledWith("site-theme-active");
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "site_theme_kind_updated" }),
    );
  });
});
