/**
 * pg v8+ warns when sslmode is require/prefer/verify-ca because those map to
 * verify-full today but will follow libpq semantics in pg v9. Use verify-full
 * explicitly to match current behavior and silence the warning.
 */
export function normalizePgSslMode(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode === "require" || sslmode === "prefer" || sslmode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}
