import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import LoginForm from "@/app/login/LoginForm";
import { setMockSearchParams } from "@tests/helpers/mocks/next";
import { mockSignIn } from "@tests/helpers/mocks/next-auth";

describe("LoginForm", () => {
  beforeEach(() => {
    setMockSearchParams({});
  });

  it("renders the Google sign-in button", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("button", { name: "Sign in with Google" })
    ).toBeInTheDocument();
  });

  it("signs in with the default callback URL", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(mockSignIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/dashboard",
    });
  });

  it("uses callbackUrl from search params when provided", async () => {
    const user = userEvent.setup();
    setMockSearchParams({ callbackUrl: "/tracker" });

    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(mockSignIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/tracker",
    });
  });
});
