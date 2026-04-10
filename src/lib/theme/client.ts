/**
 * Client-safe theme tokens — no fs access.
 * Values are injected at build time via CSS custom properties
 * from system.properties → globals.css :root block.
 */

export const theme = {
  colors: {
    primary: "var(--color-primary)",
    primaryLight: "var(--color-primary-light)",
    primaryDark: "var(--color-primary-dark)",
    primaryForeground: "var(--color-primary-foreground)",
    secondary: "var(--color-secondary)",
    secondaryLight: "var(--color-secondary-light)",
    secondaryDark: "var(--color-secondary-dark)",
    secondaryForeground: "var(--color-secondary-foreground)",
    background: "var(--color-background)",
    foreground: "var(--color-foreground)",
    muted: "var(--color-muted)",
    mutedForeground: "var(--color-muted-foreground)",
    border: "var(--color-border)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    error: "var(--color-error)",
    info: "var(--color-info)",
  },
  fonts: {
    primary: "var(--font-primary)",
    secondary: "var(--font-secondary)",
    mono: "var(--font-mono)",
  },
} as const;
