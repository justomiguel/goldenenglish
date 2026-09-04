import type { ShopLineInput } from "@/lib/shop/types";

function assertValidLine(line: ShopLineInput): void {
  if (line.quantity <= 0 || line.unitPrice <= 0) {
    throw new Error("invalid_line");
  }
}

export function sumShopLines(lines: readonly ShopLineInput[]): number {
  return lines.reduce((total, line) => {
    assertValidLine(line);
    return total + line.quantity * line.unitPrice;
  }, 0);
}
