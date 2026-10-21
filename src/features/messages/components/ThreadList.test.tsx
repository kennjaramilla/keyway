import { delay, http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { renderInWorkspace, screen, within } from "@/test/render";
import { MessageThreadLink } from "./MessageThreadLink";
import { ThreadList } from "./ThreadList";

describe("ThreadList", () => {
  it("lists the coordinator's active-building threads with unread counts as text", async () => {
    server.use(
      http.get(
        "*/api/threads",
        async () => {
          await delay(100);
        },
        { once: true },
      ),
    );
    renderInWorkspace(<ThreadList />, { as: "coordinator" });
    expect(await screen.findByText("Loading conversations")).toBeInTheDocument();
    const list = await screen.findByRole("list", { name: "Conversations" });
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent("KW-1017");
    expect(links[0]).toHaveTextContent("1 unread");
    expect(links[0]).toHaveTextContent("Diego Santillán");
    expect(links[0]).toHaveAttribute("href", "/messages/req_017");
  });

  it("switches with the active building", async () => {
    renderInWorkspace(<ThreadList />, { as: "coordinator", buildingId: "bld_maple" });
    const list = await screen.findByRole("list", { name: "Conversations" });
    expect(within(list).getByText(/KW-1029/)).toBeInTheDocument();
    expect(within(list).getByText("2 unread")).toBeInTheDocument();
    expect(within(list).queryByText("KW-1017")).not.toBeInTheDocument();
  });

  it("shows a resident only their own threads, previewing the last message", async () => {
    renderInWorkspace(<ThreadList />, { as: "resident" });
    const list = await screen.findByRole("list", { name: "Conversations" });
    expect(within(list).getAllByRole("link")).toHaveLength(2);
    expect(within(list).getByText("1 unread")).toBeInTheDocument();
  });

  it("lists a general chat by its subject, linked by thread id", async () => {
    renderInWorkspace(<ThreadList />, { as: "resident" });
    const chat = await screen.findByRole("link", { name: /Guest parking this weekend/ });
    expect(chat).toHaveTextContent("Chat");
    expect(chat).toHaveAttribute("href", "/messages/thr_028");
  });

  it("offers residents a new chat when they have no conversations", async () => {
    server.use(http.get("*/api/threads", () => HttpResponse.json([])));
    renderInWorkspace(<ThreadList />, { as: "resident" });
    expect(await screen.findByRole("link", { name: "New chat" })).toHaveAttribute(
      "href",
      "/messages/new",
    );
  });

  it("shows an empty state", async () => {
    server.use(http.get("*/api/threads", () => HttpResponse.json([])));
    renderInWorkspace(<ThreadList />, { as: "coordinator" });
    expect(
      await screen.findByRole("heading", { name: "No conversations in Harbor View Lofts" }),
    ).toBeInTheDocument();
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get(
        "*/api/threads",
        () => HttpResponse.json({ title: "Boom", status: 500 }, { status: 500 }),
        {
          once: true,
        },
      ),
    );
    const { user } = renderInWorkspace(<ThreadList />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load conversations");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("list", { name: "Conversations" })).toBeInTheDocument();
  });
});

describe("MessageThreadLink", () => {
  it("labels the link for the role and hides it for the manager", async () => {
    const { unmount } = renderInWorkspace(<MessageThreadLink requestId="req_023" />);
    expect(await screen.findByRole("link", { name: "Message coordinator" })).toHaveAttribute(
      "href",
      "/messages/req_023",
    );
    unmount();
    renderInWorkspace(<MessageThreadLink requestId="req_023" />, { as: "manager" });
    await screen.findByRole("main");
    expect(screen.queryByRole("link", { name: /^Message/ })).not.toBeInTheDocument();
  });
});
