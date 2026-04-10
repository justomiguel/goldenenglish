import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { RegisterSuccessDialog } from "@/components/molecules/RegisterSuccessDialog";

describe("RegisterSuccessDialog", () => {
  it("closes from secondary action", () => {
    const onOpenChange = vi.fn();
    render(
      <RegisterSuccessDialog
        locale="es"
        open
        onOpenChange={onOpenChange}
        dict={dictEn.register}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: dictEn.register.anotherRequest }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
