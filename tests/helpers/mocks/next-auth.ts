import type { Session } from "next-auth";
import { vi } from "vitest";

type SessionStatus = "authenticated" | "loading" | "unauthenticated";

type MockSessionState = {
  data: Session | null;
  status: SessionStatus;
};

export const mockSignIn = vi.fn();
export const mockSignOut = vi.fn();
export const mockUseSession = vi.fn(
  (): MockSessionState => ({
    data: null,
    status: "unauthenticated",
  })
);

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

export const setMockSession = (state: MockSessionState) => {
  mockUseSession.mockReturnValue(state);
};

export const setMockAuthenticatedSession = (
  user: { name?: string | null; email?: string | null } = {
    name: "Test User",
    email: "test@example.com",
  }
) => {
  setMockSession({
    data: {
      user,
      expires: "2099-01-01T00:00:00.000Z",
    } as Session,
    status: "authenticated",
  });
};

export const setMockLoadingSession = () => {
  setMockSession({ data: null, status: "loading" });
};

export const setMockUnauthenticatedSession = () => {
  setMockSession({ data: null, status: "unauthenticated" });
};
