import { describe, expect, it } from "vitest";
import type { Session } from "next-auth";
import { attachUserIdToSession } from "@/lib/auth-session";

describe("attachUserIdToSession", () => {
  it("sets session.user.id from the database user", () => {
    const session = {
      user: { name: "Alex", email: "alex@example.com" },
      expires: "2099-01-01",
    } as Session;

    const result = attachUserIdToSession(session, { id: "user-123" });

    expect(result.user?.id).toBe("user-123");
    expect(result).toBe(session);
  });

  it("returns session unchanged when session.user is missing", () => {
    const session = { expires: "2099-01-01" } as Session;

    const result = attachUserIdToSession(session, { id: "user-123" });

    expect(result).toBe(session);
    expect(result.user).toBeUndefined();
  });
});
