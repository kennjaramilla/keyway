import { renderInWorkspace, renderWithProviders, screen } from "@/test/render";
import { setErrorReporter } from "@/lib/report-error";
import { ErrorScreen } from "./ErrorScreen";
import { RouteError } from "./RouteError";

const crash = () => Object.assign(new Error("render failed"), { digest: "d1g3st" });

describe("error boundaries", () => {
  const reporter = vi.fn();
  beforeEach(() => setErrorReporter(reporter));
  afterEach(() => setErrorReporter(null));

  it("keeps the workspace shell, reports once and retries", async () => {
    const retry = vi.fn();
    const error = crash();
    const { user } = renderInWorkspace(<RouteError error={error} retry={retry} />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Reference: d1g3st");
    expect(reporter).toHaveBeenCalledExactlyOnceWith(error, { boundary: "workspace" });

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("shows a full-page fallback with a way home when there's no shell", async () => {
    const retry = vi.fn();
    const { user } = renderWithProviders(
      <ErrorScreen error="not an Error" retry={retry} boundary="global" />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Go to your home page" })).toHaveAttribute("href", "/");
    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
    expect(reporter).toHaveBeenCalledWith("not an Error", { boundary: "global" });

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
