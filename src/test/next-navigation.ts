import { vi } from "vitest";

/** Shared next/navigation mock (installed in setup.ts). Assert on these in tests. */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

export const navigationState = { pathname: "/requests" };

export const nextNavigationMock = {
  useRouter: () => mockRouter,
  usePathname: () => navigationState.pathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
};
