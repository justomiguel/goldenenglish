import { Node, mergeAttributes } from "@tiptap/core";

function httpsSrc(element: HTMLElement): string | false {
  const own = element.getAttribute("src")?.trim() ?? "";
  if (/^https:\/\//i.test(own)) return own;
  const nested = element.querySelector("source")?.getAttribute("src")?.trim() ?? "";
  return /^https:\/\//i.test(nested) ? nested : false;
}

function fileMediaNode(name: "academicFileVideo" | "academicFileAudio", tag: "video" | "audio") {
  return Node.create({
    name,
    group: "block",
    atom: true,
    selectable: true,
    draggable: true,
    addOptions() {
      return { removeLabel: "Remove" };
    },
    addAttributes() {
      return {
        src: { default: null },
      };
    },
    parseHTML() {
      return [
        {
          tag: `${tag}[src]`,
          getAttrs: (element) => {
            if (!(element instanceof HTMLElement)) return false;
            const src = httpsSrc(element);
            return src ? { src } : false;
          },
        },
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        tag,
        mergeAttributes(HTMLAttributes, { controls: "true", preload: "metadata" }),
      ];
    },
    addKeyboardShortcuts() {
      return {
        Backspace: ({ editor }) =>
          editor.isActive(name) ? editor.commands.deleteSelection() : false,
        Delete: ({ editor }) =>
          editor.isActive(name) ? editor.commands.deleteSelection() : false,
      };
    },
    addNodeView() {
      const removeLabel = this.options?.removeLabel ?? "Remove";
      return ({ editor, getPos, node }) => {
        const dom = document.createElement("div");
        dom.dataset.academicFileMedia = tag;
        dom.className = "relative";
        const media = document.createElement(tag);
        const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
        media.setAttribute("src", src);
        media.setAttribute("controls", "true");
        media.setAttribute("preload", "none");
        media.draggable = false;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.setAttribute("aria-label", removeLabel);
        remove.title = removeLabel;
        remove.textContent = "×";
        remove.className =
          "absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-lg leading-none text-[var(--color-foreground)] shadow-[var(--shadow-soft)]";
        let removed = false;
        const removeNode = (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
          if (removed) return;
          const pos = typeof getPos === "function" ? getPos() : undefined;
          if (typeof pos !== "number") return;
          removed = true;
          editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
        };
        remove.addEventListener("pointerdown", removeNode);
        remove.addEventListener("click", removeNode);
        dom.append(media, remove);
        return {
          dom,
          ignoreMutation: () => true,
          stopEvent: (event: Event) => {
            const target = event?.target;
            return target instanceof globalThis.Node && remove.contains(target);
          },
        };
      };
    },
  });
}

export const AcademicFileVideo = fileMediaNode("academicFileVideo", "video");
export const AcademicFileAudio = fileMediaNode("academicFileAudio", "audio");
