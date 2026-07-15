type HeaderReader = { get(name: string): string | null };

export function getRequestIp(headers: HeaderReader): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip");
}
