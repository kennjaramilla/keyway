import { http, HttpResponse } from "msw";
import { readSessionCookie } from "@/lib/auth/session-cookie";
import { server } from "@/mocks/node";
import { renderWithProviders, screen, within } from "@/test/render";
import { mockRouter } from "@/test/next-navigation";
import { SignInScreen } from "./SignInScreen";

describe("SignInScreen", () => {
  it("groups seeded people by role", async () => {
    renderWithProviders(<SignInScreen />);
    const residents = await screen.findByRole("region", { name: "Resident" });
    expect(within(residents).getAllByRole("button")).toHaveLength(6);
    expect(
      within(residents).getByRole("button", { name: /Amara Okafor\s*Harbor View Lofts · 4B/ }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Coordinator" })).getByRole("button", {
        name: /Grace Adeyemi\s*Harbor View Lofts, Maple Court/,
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Property manager" })).getByRole("button", {
        name: /Helena Brightwater\s*All buildings/,
      }),
    ).toBeInTheDocument();
  });

  it("signs in and goes to the role's home page", async () => {
    const { user } = renderWithProviders(<SignInScreen />);
    await user.click(await screen.findByRole("button", { name: /Helena Brightwater/ }));
    await vi.waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard"));
    expect(readSessionCookie()).toMatchObject({ userId: "usr_mgr_helena", role: "manager" });
  });

  it("returns to a safe ?next path after signing in", async () => {
    window.history.replaceState(null, "", "/sign-in?next=%2Frequests%3Fstatus%3Dnew");
    const { user } = renderWithProviders(<SignInScreen />);
    await user.click(await screen.findByRole("button", { name: /Amara Okafor/ }));
    await vi.waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/requests?status=new"));
    window.history.replaceState(null, "", "/");
  });

  it.each(["//evil.example", "/%5Cevil.example/x"])(
    "ignores an off-site ?next=%s",
    async (next) => {
      window.history.replaceState(null, "", `/sign-in?next=${next}`);
      const { user } = renderWithProviders(<SignInScreen />);
      await user.click(await screen.findByRole("button", { name: /Amara Okafor/ }));
      await vi.waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/requests"));
      window.history.replaceState(null, "", "/");
    },
  );

  it("shows an error with retry when people fail to load", async () => {
    server.use(
      http.get("*/api/demo/people", () =>
        HttpResponse.json({ title: "Down", status: 500 }, { status: 500 }),
      ),
    );
    renderWithProviders(<SignInScreen />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("explains a failed sign-in", async () => {
    server.use(
      http.post("*/api/session", () =>
        HttpResponse.json({ title: "Down", status: 500 }, { status: 500 }),
      ),
    );
    const { user } = renderWithProviders(<SignInScreen />);
    await user.click(await screen.findByRole("button", { name: /Amara Okafor/ }));
    expect(await screen.findByText(/Couldn't sign in/)).toBeInTheDocument();
  });

  it("labels the people picker as demo accounts with fake data", async () => {
    renderWithProviders(<SignInScreen />);
    expect(await screen.findByText("Demo accounts · fake data")).toBeInTheDocument();
  });

  describe("with demo mode off", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("hides the people picker and points to single sign-on", () => {
      vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "off");
      vi.stubEnv("NEXT_PUBLIC_SSO_URL", "https://login.example.com/keyway");
      renderWithProviders(<SignInScreen />);
      expect(screen.queryByText("Demo accounts · fake data")).not.toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Resident" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Continue with single sign-on" })).toHaveAttribute(
        "href",
        "https://login.example.com/keyway",
      );
    });

    it("says so when single sign-on isn't configured", () => {
      vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "off");
      renderWithProviders(<SignInScreen />);
      expect(screen.getByRole("status")).toHaveTextContent("Single sign-on isn't configured");
      expect(screen.queryByRole("link", { name: /single sign-on/ })).not.toBeInTheDocument();
    });
  });
});
