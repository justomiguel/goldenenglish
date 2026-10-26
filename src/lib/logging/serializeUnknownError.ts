function includeStack(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Normalize unknown throws for logs and optional tests. */
export function serializeUnknownError(err: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      ...(includeStack() && err.stack
        ? { stack: err.stack.split("\n").slice(0, 8).join("\n") }
        : {}),
    };
  }
  return { name: "NonError", message: typeof err === "string" ? err : JSON.stringify(err) };
}
