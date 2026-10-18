import { http, HttpResponse } from "msw";
import { getDb } from "@/mocks/db";
import { server } from "@/mocks/node";
import { mockRouter } from "@/test/next-navigation";
import userEvent from "@testing-library/user-event";
import { renderInWorkspace, screen, waitFor, within } from "@/test/render";
import { addDays, localDate } from "../time";
import { RequestForm } from "./RequestForm";

const tomorrow = () => addDays(localDate(new Date(), "America/New_York"), 1);

async function renderForm() {
  const view = renderInWorkspace(<RequestForm />, { as: "resident" });
  await screen.findByRole("button", { name: "Submit request" });
  return view;
}

async function fillValid(user: Awaited<ReturnType<typeof renderForm>>["user"]) {
  await user.selectOptions(screen.getByLabelText(/^Category/), "electrical");
  await user.type(screen.getByLabelText(/^Title/), "Bathroom exhaust fan rattles");
  await user.type(screen.getByLabelText(/^Description/), "It rattles loudly whenever it runs.");
  await user.selectOptions(screen.getByLabelText(/^Location in unit/), "bathroom");
  await user.type(screen.getByLabelText("Date 1"), tomorrow());
  await user.selectOptions(screen.getByLabelText("Time of day 1"), "morning");
  await user.click(screen.getByRole("radio", { name: "Yes" }));
}

describe("RequestForm", () => {
  it("shows inline errors linked to their fields and focuses the first one", async () => {
    const { user } = await renderForm();
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    const category = screen.getByLabelText(/^Category/);
    expect(await screen.findByText("Choose a category.")).toBeInTheDocument();
    expect(category).toHaveAttribute("aria-invalid", "true");
    expect(category).toHaveAccessibleDescription("Choose a category.");
    expect(category).toHaveFocus();
    expect(screen.getByLabelText(/^Title/)).toHaveAccessibleDescription(
      expect.stringContaining("Use at least 5 characters."),
    );
    expect(screen.getByText("Choose at least one time window.")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /can we enter/i })).toHaveAccessibleDescription(
      "Choose yes or no.",
    );
  });

  it("warns about emergencies and makes preferred times optional", async () => {
    const { user } = await renderForm();
    await user.selectOptions(screen.getByLabelText(/^Urgency/), "emergency");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "If there's fire, smoke or a gas smell, leave and call 911 first.",
    );
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    await screen.findByText("Choose a category.");
    expect(screen.queryByText("Choose at least one time window.")).not.toBeInTheDocument();
  });

  it("adds and removes up to 3 preferred times", async () => {
    const { user } = await renderForm();
    await user.click(screen.getByRole("button", { name: "Add another time" }));
    await user.click(screen.getByRole("button", { name: "Add another time" }));
    expect(screen.getByLabelText("Date 3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add another time" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove time 3" }));
    expect(screen.queryByLabelText("Date 3")).not.toBeInTheDocument();
  });

  it("previews a photo locally, rejects other files, and removes it", async () => {
    const drawImage = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 200, height: 100, close: vi.fn() })),
    );
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    const { user } = await renderForm();
    const input = screen.getByLabelText("Photo (optional)");
    expect(input).toHaveAccessibleDescription(expect.stringContaining("It isn't uploaded."));

    // The accept attribute normally filters these out; check the fallback validation too.
    await userEvent
      .setup({ applyAccept: false })
      .upload(input, new File(["x"], "notes.pdf", { type: "application/pdf" }));
    expect(screen.getByText("Choose a JPG, PNG or WebP image.")).toBeInTheDocument();

    await user.upload(input, new File(["x"], "leak.png", { type: "image/png" }));
    expect(screen.getByRole("img", { name: "Preview of leak.png" })).toBeInTheDocument();
    await waitFor(() => expect(drawImage).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(input).toHaveFocus();
    getContext.mockRestore();
    vi.unstubAllGlobals();
  });

  it("explains an image it can't read", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => Promise.reject(new Error("bad"))),
    );
    const { user } = await renderForm();
    await user.upload(
      screen.getByLabelText("Photo (optional)"),
      new File(["x"], "broken.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByText(/couldn't read that image/i)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("submits, toasts and opens the new request", async () => {
    const { user } = await renderForm();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Submit request" }));

    const toast = await screen.findByText("Request submitted");
    expect(toast).toBeInTheDocument();
    const created = getDb().requests.find((item) => item.number === "KW-1031");
    expect(created).toMatchObject({
      unitId: "unit_hvl_4b",
      status: "new",
      permissionToEnter: true,
    });
    expect(created?.preferredWindows).toEqual([{ date: tomorrow(), slot: "morning" }]);
    expect(mockRouter.push).toHaveBeenCalledWith(`/requests/${created?.id}`);
  });

  it("explains a failed submit and keeps the values", async () => {
    server.use(
      http.post("*/api/requests", () =>
        HttpResponse.json({ title: "Boom", status: 500 }, { status: 500 }),
      ),
    );
    const { user } = await renderForm();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/couldn't submit your request/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Title/)).toHaveValue("Bathroom exhaust fan rattles");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("puts server field errors on the matching inputs", async () => {
    server.use(
      http.post("*/api/requests", () =>
        HttpResponse.json(
          { title: "Validation failed", status: 422, errors: { title: ["That title is taken."] } },
          { status: 422 },
        ),
      ),
    );
    const { user } = await renderForm();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Submit request" }));
    expect(await screen.findByText("That title is taken.")).toBeInTheDocument();
  });
});
