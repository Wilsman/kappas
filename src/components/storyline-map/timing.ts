export interface StorylineTimingData {
  isCraft?: boolean;
  craftHours?: number;
  craftHoursMax?: number;
  isTimeGate?: boolean;
  timeGateHours?: number;
  timeGateHoursMax?: number;
}

export function formatDurationRange(
  min?: number,
  max?: number,
  suffix = ""
) {
  if (!min) {
    return undefined;
  }

  if (max && max > min) {
    return `${formatDurationValue(min)}-${formatDurationValue(max)}${suffix}`;
  }

  return `${formatDurationValue(min)}${suffix}`;
}

function formatDurationValue(hours: number) {
  const wholeHours = Math.trunc(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  if (wholeHours === 0) {
    return `${minutes}m`;
  }

  return `${wholeHours}h ${minutes}m`;
}

export function resolveTimingData(
  data: Record<string, unknown>
): StorylineTimingData {
  const explicitCraftHours =
    typeof data.craftHours === "number" ? data.craftHours : undefined;
  const explicitCraftHoursMax =
    typeof data.craftHoursMax === "number" ? data.craftHoursMax : undefined;
  const explicitTimeGateHours =
    typeof data.timeGateHours === "number" ? data.timeGateHours : undefined;
  const explicitTimeGateHoursMax =
    typeof data.timeGateHoursMax === "number" ? data.timeGateHoursMax : undefined;
  const explicitIsCraft =
    typeof data.isCraft === "boolean" ? data.isCraft : undefined;
  const explicitIsTimeGate =
    typeof data.isTimeGate === "boolean" ? data.isTimeGate : undefined;

  if (
    explicitIsCraft !== undefined ||
    explicitIsTimeGate !== undefined ||
    explicitCraftHours !== undefined ||
    explicitCraftHoursMax !== undefined ||
    explicitTimeGateHours !== undefined ||
    explicitTimeGateHoursMax !== undefined
  ) {
    return {
      isCraft: explicitIsCraft ?? explicitCraftHours !== undefined,
      craftHours: explicitCraftHours,
      craftHoursMax: explicitCraftHoursMax,
      isTimeGate: explicitIsTimeGate ?? explicitTimeGateHours !== undefined,
      timeGateHours: explicitTimeGateHours,
      timeGateHoursMax: explicitTimeGateHoursMax,
    };
  }

  const description =
    typeof data.description === "string" ? data.description : undefined;
  const note = typeof data.note === "string" ? data.note : undefined;
  const combined = `${description || ""} ${note || ""}`;

  const craftMatch = combined.match(/(\d+)\s*hour\s*craft/i);
  const isCraft = !!craftMatch || /\bcraft\b/i.test(combined);
  const craftHours = craftMatch ? parseInt(craftMatch[1], 10) : undefined;

  const hourMatch = combined.match(/(\d+)\s*hour/i);
  const hasHours = !!hourMatch;
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : undefined;
  const isTimeGate = hasHours && !isCraft;

  return {
    isCraft,
    craftHours: isCraft ? craftHours || hours : undefined,
    craftHoursMax: undefined,
    isTimeGate,
    timeGateHours: isTimeGate ? hours : undefined,
    timeGateHoursMax: undefined,
  };
}
