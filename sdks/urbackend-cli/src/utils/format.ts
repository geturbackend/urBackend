/**
 * Formats bytes into a human-readable string (KB, MB, GB).
 */
export function formatBytes(bytes: number): string {
  if (bytes < 0) return "Unlimited";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = (bytes / Math.pow(1024, i)).toFixed(2);
  return `${value} ${units[i]}`;
}

/**
 * Formats an ISO date string to a locale-friendly short format.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Pads a string label to a fixed width for aligned terminal output.
 */
export function label(text: string, width = 14): string {
  return text.padEnd(width);
}
