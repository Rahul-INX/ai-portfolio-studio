type ApiErrorPayload = {
  error?: unknown;
  message?: unknown;
  requestId?: unknown;
};

function readableValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (!value) return undefined;
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & ApiErrorPayload)
    | null;

  if (response.ok) {
    if (payload === null) {
      throw new Error("The server returned an empty response.");
    }
    return payload;
  }

  const detail =
    readableValue(payload?.message) ??
    readableValue(payload?.error) ??
    response.statusText ??
    "The request failed.";
  const requestId =
    typeof payload?.requestId === "string" ? ` Reference: ${payload.requestId}.` : "";

  if (response.status === 401) {
    throw new Error(`Your admin session has expired. Sign in again.${requestId}`);
  }

  throw new Error(`${detail}${requestId}`);
}
