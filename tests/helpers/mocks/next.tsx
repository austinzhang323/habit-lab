import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import { vi } from "vitest";

export const mockPathname = vi.fn(() => "/");
export const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useSearchParams: () => mockSearchParams(),
}));

export const setMockPathname = (pathname: string) => {
  mockPathname.mockReturnValue(pathname);
};

export const setMockSearchParams = (params: Record<string, string>) => {
  mockSearchParams.mockReturnValue(new URLSearchParams(params));
};

export const MockNavigationProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
