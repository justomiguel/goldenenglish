import { vi } from "vitest";

/** Overridable in tests (default `/es`). */
export const mockPathname = vi.fn(() => "/es");
export const mockPush = vi.fn();
export const mockReplace = vi.fn();
export const mockRefresh = vi.fn();
/** Overridable in tests (default empty URLSearchParams). */
export const mockSearchParams = vi.fn(() => new URLSearchParams());
