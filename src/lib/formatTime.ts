/**
 * Formats a message timestamp based on how long ago it was sent.
 */
export function formatMessageTime(ms: number): string {
  const date = new Date(ms);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const isThisYear = date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return time;

  const dateStr = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...(isThisYear ? {} : { year: "numeric" }),
  });

  return `${dateStr}, ${time}`;
}
