import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import Header from "@/components/Header";
import { setMockPathname } from "@tests/helpers/mocks/next";
import {
  mockSignOut,
  setMockAuthenticatedSession,
  setMockLoadingSession,
  setMockUnauthenticatedSession,
} from "@tests/helpers/mocks/next-auth";

describe("Header", () => {
  beforeEach(() => {
    setMockPathname("/");
    setMockUnauthenticatedSession();
  });

  it("renders primary navigation links", () => {
    render(<Header />);

    expect(screen.getAllByRole("link", { name: "Dashboard" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Tracker" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Habits" }).length).toBeGreaterThan(0);
  });

  it("highlights the active route", () => {
    setMockPathname("/tracker");
    render(<Header />);

    const desktopTrackerLink = screen.getAllByRole("link", { name: "Tracker" })[0];
    expect(desktopTrackerLink.className).toContain("text-primary");
  });

  it("shows sign in when unauthenticated", () => {
    render(<Header />);

    const signInLinks = screen.getAllByRole("link", { name: "Sign in" });
    expect(signInLinks[0]).toHaveAttribute("href", "/login");
  });

  it("shows display name and sign out when authenticated", async () => {
    const user = userEvent.setup();
    setMockAuthenticatedSession({ name: "Austin", email: "austin@example.com" });

    render(<Header />);

    expect(screen.getAllByText("Austin").length).toBeGreaterThan(0);

    const signOutButtons = screen.getAllByRole("button", { name: "Sign out" });
    await user.click(signOutButtons[0]);

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("hides auth controls while session is loading", () => {
    setMockLoadingSession();
    render(<Header />);

    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("toggles the mobile menu", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const toggleButton = screen.getByRole("button", { name: "Toggle menu" });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    const mobileNav = screen.getAllByRole("link", { name: "Dashboard" }).at(-1);
    expect(mobileNav?.className).toContain("rounded-lg");
  });
});
