import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMany, PrismaAdapter } = vi.hoisted(() => {
  const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const PrismaAdapter = vi.fn(() => ({
    createUser: vi.fn(),
    getSessionAndUser: vi.fn(),
  }));
  return { deleteMany, PrismaAdapter };
});

vi.mock("@/lib/prisma-auth", () => ({
  default: {
    session: { deleteMany },
  },
}));

vi.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter,
}));

import { prismaAuthAdapter } from "@/lib/prisma-auth-adapter";

describe("prismaAuthAdapter", () => {
  beforeEach(() => {
    deleteMany.mockClear();
    PrismaAdapter.mockClear();
    deleteMany.mockResolvedValue({ count: 0 });
  });

  it("deleteSession uses deleteMany for idempotent sign-out", async () => {
    const adapter = prismaAuthAdapter();
    await adapter.deleteSession!("tok-abc");

    expect(deleteMany).toHaveBeenCalledWith({
      where: { sessionToken: "tok-abc" },
    });
  });

  it("deleteSession resolves when no session row exists", async () => {
    deleteMany.mockResolvedValue({ count: 0 });
    const adapter = prismaAuthAdapter();

    await expect(adapter.deleteSession!("missing")).resolves.toBeUndefined();
  });
});
