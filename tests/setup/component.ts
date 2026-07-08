import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import "@tests/helpers/mocks/next";
import "@tests/helpers/mocks/next-auth";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
