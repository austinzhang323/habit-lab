import { describe, expect, it } from "vitest";
import { normalizePgSslMode } from "@/lib/pg-connection-string";

describe("normalizePgSslMode", () => {
  it("rewrites sslmode=require to verify-full", () => {
    const url =
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require";
    expect(normalizePgSslMode(url)).toBe(
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=verify-full"
    );
  });

  it("leaves verify-full unchanged", () => {
    const url =
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=verify-full";
    expect(normalizePgSslMode(url)).toBe(url);
  });

  it("rewrites sslmode=prefer to verify-full", () => {
    const url =
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=prefer";
    expect(normalizePgSslMode(url)).toBe(
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=verify-full"
    );
  });

  it("rewrites sslmode=verify-ca to verify-full", () => {
    const url =
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=verify-ca";
    expect(normalizePgSslMode(url)).toBe(
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=verify-full"
    );
  });

  it("leaves URLs without sslmode unchanged", () => {
    const url = "postgres://user:pass@db.prisma.io:5432/postgres";
    expect(normalizePgSslMode(url)).toBe(url);
  });

  it("returns the original string when parsing fails", () => {
    expect(normalizePgSslMode("not-a-url")).toBe("not-a-url");
  });
});
