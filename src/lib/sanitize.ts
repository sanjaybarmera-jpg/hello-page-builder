/** Trim, collapse whitespace and strip control/angle-bracket characters. */
export function sanitizeText(value: string, maxLength = 300): string {
  return value
    .replace(/[<>]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Keep only digits and a leading +, for Indian phone entry. */
export function sanitizePhone(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, "");
  return (cleaned.startsWith("+") ? `+${cleaned.slice(1).replace(/\+/g, "")}` : cleaned).slice(
    0,
    15,
  );
}

/** True when an error looks like a network drop or Supabase rate limit. */
export function isTransientError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("429") ||
    message.includes("503")
  );
}

/** User-facing message for any thrown value. */
export function friendlyError(error: unknown): string {
  if (isTransientError(error)) {
    return "Network is busy or offline. Please check your connection and retry.";
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
