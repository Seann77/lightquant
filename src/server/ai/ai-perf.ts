type AiPerfDetails = Record<string, unknown>;

export function getAiPerfNow() {
  return Date.now();
}

export function logAiPerf(event: string, details: AiPerfDetails = {}) {
  console.info("[ai-perf]", {
    event,
    ...sanitizeAiPerfDetails(details)
  });
}

export async function measureAiPerf<T>(
  event: string,
  details: AiPerfDetails,
  callback: () => Promise<T>
) {
  const startedAt = getAiPerfNow();

  try {
    return await callback();
  } finally {
    logAiPerf(event, {
      ...details,
      durationMs: getAiPerfNow() - startedAt
    });
  }
}

function sanitizeAiPerfDetails(details: AiPerfDetails) {
  const safe: AiPerfDetails = {};

  for (const [key, value] of Object.entries(details)) {
    const normalized = key.toLowerCase();

    if (
      normalized.includes("prompt") ||
      normalized.includes("inputcode") ||
      normalized.includes("apikey") ||
      normalized.includes("secret") ||
      normalized.includes("cookie") ||
      normalized.includes("phone")
    ) {
      continue;
    }

    safe[key] = value;
  }

  return safe;
}
