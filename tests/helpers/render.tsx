import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import Providers from "@/components/Providers";

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, {
    wrapper: ({ children }) => <Providers>{children}</Providers>,
    ...options,
  });
}
