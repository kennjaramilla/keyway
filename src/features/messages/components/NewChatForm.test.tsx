import { http, HttpResponse } from "msw";
import { getDb } from "@/mocks/db";
import { server } from "@/mocks/node";
import { mockRouter } from "@/test/next-navigation";
import { renderInWorkspace, screen } from "@/test/render";
import { NewChatForm } from "./NewChatForm";

describe("NewChatForm", () => {
  it("starts a chat and opens it", async () => {
    const { user } = renderInWorkspace(<NewChatForm />, { as: "resident" });
    await user.type(await screen.findByLabelText(/^Subject/), "Bike storage key");
    await user.type(screen.getByLabelText(/^Message/), "Where do I get a key for the bike room?");
    await user.click(screen.getByRole("button", { name: "Start chat" }));

    expect(await screen.findByText("Chat started")).toBeInTheDocument();
    const created = getDb().threads.find((thread) => thread.subject === "Bike storage key");
    expect(created).toMatchObject({ requestId: null, coordinatorId: "usr_coord_grace" });
    expect(mockRouter.push).toHaveBeenCalledWith(`/messages/${created?.id}`);
  });

  it("shows inline errors and sends nothing when fields are missing", async () => {
    const { user } = renderInWorkspace(<NewChatForm />, { as: "resident" });
    await user.click(await screen.findByRole("button", { name: "Start chat" }));
    expect(await screen.findByText("Add a subject (at least 3 characters).")).toBeInTheDocument();
    expect(screen.getByText("Write a message first.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Subject/)).toHaveAttribute("aria-invalid", "true");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("explains a server failure", async () => {
    server.use(
      http.post("*/api/threads", () =>
        HttpResponse.json({ title: "Server error", status: 500 }, { status: 500 }),
      ),
    );
    const { user } = renderInWorkspace(<NewChatForm />, { as: "resident" });
    await user.type(await screen.findByLabelText(/^Subject/), "Bike storage key");
    await user.type(screen.getByLabelText(/^Message/), "Where is the key?");
    await user.click(screen.getByRole("button", { name: "Start chat" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't start the chat.");
  });
});
