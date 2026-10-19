"use client";

import { useLayoutEffect } from "react";

function labelStackableTables(root: ParentNode) {
  root.querySelectorAll("table.ge-stack-cards").forEach((table) => {
    const headers = Array.from(table.querySelectorAll(":scope > thead th, :scope > thead td")).map(
      (cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? "",
    );
    table.querySelectorAll(":scope > tbody > tr").forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (!(cell instanceof HTMLElement)) return;
        const label = headers[index];
        if (label) cell.dataset.label = label;
      });
    });
  });
}

/** Copies each column header onto its cells so the phone card layout can name every field. */
export function AdminStackableTableLabels() {
  useLayoutEffect(() => {
    const root = document.querySelector("[data-admin-main]") ?? document.body;
    labelStackableTables(root);
    const observer = new MutationObserver(() => labelStackableTables(root));
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
