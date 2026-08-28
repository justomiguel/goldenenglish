function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildRegistrationPayBlock(input: {
  payUrl: string;
  amountLabel: string;
  ctaLabel: string;
  noFeeNote: string;
}): string {
  const url = input.payUrl.trim();
  if (!url) {
    return `<p style="margin:0;">${escapeHtml(input.noFeeNote)}</p>`;
  }
  const amount = input.amountLabel.trim();
  const amountHtml = amount
    ? `<p style="margin:0 0 12px;">${escapeHtml(amount)}</p>`
    : "";
  return `${amountHtml}<p style="margin:0;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 16px;background:#103A5C;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(input.ctaLabel)}</a></p>`;
}
