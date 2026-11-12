// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import type { VariantEditorField } from "@/lib/design-variants/sectionVariant";
import { SectionTab } from "@/components/desktop/organisms/theme-document-editor/section/SectionTab";

const chrome = en.admin.designEditor.section;
const fieldLabels = {
  title: "Title",
  body: "Body",
  tone: "Tone",
  live: "Live",
  lines: "Lines",
  line: "Line",
  photo: "Photo",
};

const readFile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/client/readFileAsDataUrlBase64", () => ({
  readFileAsDataUrlBase64: readFile,
}));

function section(props: ThemeSection["props"]): ThemeSection {
  return { id: "hero", variantId: "hero.bleed", major: 1, props };
}

function renderField(field: VariantEditorField, props: ThemeSection["props"]) {
  const onApply = vi.fn();
  render(
    <SectionTab
      scope="home"
      section={section(props)}
      fields={[field]}
      fieldLabels={fieldLabels}
      labels={chrome}
      onApply={onApply}
    />,
  );
  return onApply;
}

describe("SectionTab", () => {
  it("shows a counter and a cap on a text field", () => {
    renderField({ key: "title", kind: "text", labelKey: "title", maxLength: 20 }, { title: "North" });
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveProperty("maxLength", 20);
    expect(screen.getByText(chrome.counter.replace("{count}", "5").replace("{max}", "20"))).toBeTruthy();
  });

  it("uses a textarea for long text", () => {
    renderField({ key: "body", kind: "longText", labelKey: "body" }, { body: "A quiet line" });
    expect(screen.getByRole("textbox", { name: "Body" }).tagName).toBe("TEXTAREA");
  });

  it("shows the select options", () => {
    renderField({ key: "tone", kind: "select", labelKey: "tone", options: ["calm", "bright"] }, { tone: "calm" });
    const picker = screen.getByRole("combobox", { name: "Tone" });
    expect([...picker.querySelectorAll("option")].map((option) => option.value)).toEqual(["calm", "bright"]);
  });

  it("renders a toggle with its label", () => {
    const onApply = renderField({ key: "live", kind: "toggle", labelKey: "live" }, { live: false });
    fireEvent.click(screen.getByRole("switch", { name: "Live" }));
    expect(onApply).toHaveBeenCalledWith({
      kind: "setField",
      scope: "home",
      sectionId: "hero",
      field: "live",
      value: true,
    });
  });

  it("adds and removes list items", () => {
    const onApply = renderField(
      {
        key: "lines",
        kind: "list",
        labelKey: "lines",
        itemFields: [{ key: "text", kind: "text", labelKey: "line" }],
      },
      { lines: [{ text: "One" }] },
    );
    fireEvent.click(screen.getByRole("button", { name: chrome.addItem }));
    expect(onApply).toHaveBeenCalledWith({
      kind: "setField",
      scope: "home",
      sectionId: "hero",
      field: "lines",
      value: [{ text: "One" }, { text: "" }],
    });
    fireEvent.click(screen.getByRole("button", { name: chrome.removeItem.replace("{index}", "1") }));
    expect(onApply).toHaveBeenLastCalledWith({
      kind: "setField",
      scope: "home",
      sectionId: "hero",
      field: "lines",
      value: [],
    });
  });

  it("shows the upload bar only while a file is read", async () => {
    let release: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    readFile.mockImplementation(async (_file: File, options?: { onProgress?: (ratio: number) => void }) => {
      options?.onProgress?.(0.4);
      await pending;
      return { base64: "abc", mime: "image/png" };
    });
    renderField({ key: "photo", kind: "image", labelKey: "photo" }, { photo: "" });
    expect(screen.queryByRole("progressbar")).toBeNull();
    const input = screen.getByLabelText("Photo");
    fireEvent.change(input, { target: { files: [new File(["x"], "a.png", { type: "image/png" })] } });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
    release();
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
  });

  it("shows Spanish, English, and Portuguese inputs for a localized field", () => {
    renderField(
      { key: "title", kind: "text", labelKey: "title", maxLength: 40 },
      { title: { es: "Hola", en: "Hello", pt: "Olá" } },
    );
    expect(screen.getByRole("textbox", { name: "Title Spanish" })).toHaveProperty("value", "Hola");
    expect(screen.getByRole("textbox", { name: "Title English" })).toHaveProperty("value", "Hello");
    expect(screen.getByRole("textbox", { name: "Title Portuguese" })).toHaveProperty("value", "Olá");
  });
});
