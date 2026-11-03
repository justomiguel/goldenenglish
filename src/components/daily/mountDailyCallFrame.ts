"use client";

export type DailyCallHandle = {
  leave: () => Promise<void>;
  destroy: () => void;
};

export async function mountDailyCallFrame(
  parent: HTMLElement,
  input: { url: string; token: string },
): Promise<DailyCallHandle> {
  const DailyIframe = (await import("@daily-co/daily-js")).default;
  const frame = DailyIframe.createFrame(parent, {
    iframeStyle: {
      width: "100%",
      height: "100%",
      border: "0",
    },
    showLeaveButton: false,
  });
  await frame.join({ url: input.url, token: input.token });
  return {
    leave: () => frame.leave(),
    destroy: () => {
      frame.destroy();
    },
  };
}
