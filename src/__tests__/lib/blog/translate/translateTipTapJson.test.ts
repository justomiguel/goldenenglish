import { describe, expect, it } from "vitest";
import { translateTipTapJson } from "@/lib/blog/translate/translateTipTapJson";

describe("translateTipTapJson", () => {
  it("translates only text nodes preserving structure", async () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "hello" },
            { type: "text", text: "world", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };

    const translated = await translateTipTapJson(doc, async (text) => `${text}-es`);
    expect(translated.content[0].content[0].text).toBe("hello-es");
    expect(translated.content[0].content[1].text).toBe("world-es");
    expect(translated.content[0].content[1].marks).toEqual([{ type: "bold" }]);
  });
});
