export type AuctionPhase = "closed" | "waiting" | "collecting" | "monitoring" | "finished";

export function getAuctionPhase(now = new Date()): AuctionPhase {
  const parts = getShanghaiParts(now);

  if (parts.weekday === 0 || parts.weekday === 6) {
    return "closed";
  }

  const seconds = parts.hour * 60 * 60 + parts.minute * 60 + parts.second;

  if (seconds < toSeconds(9, 15)) {
    return "waiting";
  }

  if (seconds < toSeconds(9, 20)) {
    return "collecting";
  }

  if (seconds < toSeconds(9, 30)) {
    return "monitoring";
  }

  return "finished";
}

function getShanghaiParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const values = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

  return {
    weekday: weekdayToNumber(values.weekday ?? ""),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function weekdayToNumber(value: string) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value);
}

function toSeconds(hour: number, minute: number) {
  return hour * 60 * 60 + minute * 60;
}
