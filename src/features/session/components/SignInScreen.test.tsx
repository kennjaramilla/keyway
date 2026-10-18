import { http, HttpResponse } from "msw";
import { readSessionCookie } from "@/lib/auth/session-cookie";
import { server } from "@/mocks/node";
import { renderWithProviders, screen, within } from "@/test/render";
import { mockRouter } from "@/test/next-navigation";
import { SignInScreen } from "./SignInScreen";

describe("SignInScreen", () => {
  it("labels itself as a demo and groups seeded people by role", async () => {
    renderWithProviders(<SignInScreen />);
    expect(screen.getByText(/no passwords/i)).toBeInTheDocument();

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
});
