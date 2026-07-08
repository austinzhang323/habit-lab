import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMany, PrismaAdapter, prismaAuthMock } = vi.hoisted(() => {
  const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const prismaAuthMock = { session: { deleteMany } };
  const PrismaAdapter = vi.fn(() => ({
    createUser: vi.fn(),
    getSessionAndUser: vi.fn(),
  }));
  return { deleteMany, PrismaAdapter, prismaAuthMock };
});

vi.mock("@/lib/prisma-auth", () => ({
  default: prismaAuthMock,
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

  it("passes prismaAuth to PrismaAdapter", () => {
    prismaAuthAdapter();
    expect(PrismaAdapter).toHaveBeenCalledTimes(1);
    expect(PrismaAdapter).toHaveBeenCalledWith(prismaAuthMock);
  });

  it("forwards base adapter methods from PrismaAdapter", () => {
    const createUser = vi.fn();
    const getSessionAndUser = vi.fn();
    PrismaAdapter.mockReturnValueOnce({ createUser, getSessionAndUser });

    const adapter = prismaAuthAdapter();

    expect(adapter.createUser).toBe(createUser);
    expect(adapter.getSessionAndUser).toBe(getSessionAndUser);
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
