import { delay, http, HttpResponse } from "msw";
import { messageKeys } from "@/features/messages/api";
import type { ThreadDetail } from "@/features/messages/schema";
import { getDb, updateDb } from "@/mocks/db";
import { armFailure } from "@/mocks/demo-failures";
import { server } from "@/mocks/node";
import { act, renderInWorkspace, screen, waitFor, within } from "@/test/render";
import { MessageThread } from "./MessageThread";

const conversation = () => screen.findByRole("list", { name: "Conversation" });

describe("MessageThread", () => {
  it("shows a loading state, then the thread oldest first with author and time", async () => {
    server.use(
      http.get(
        "*/api/threads/:requestId/messages",
        async () => {
          await delay(100);
        },
        { once: true },
      ),
    );
    renderInWorkspace(<MessageThread requestId="req_017" />, { as: "coordinator" });
    expect(await screen.findByText("Loading messages")).toBeInTheDocument();
    const items = within(await conversation()).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items.at(-1)).toHaveTextContent("Great, thank you!");
    expect(items.at(-1)).toHaveTextContent("Diego Santillán");
    expect(items.at(-1)?.querySelector("time")).not.toBeNull();
  });

  it("shows the empty state for a request without messages", async () => {
    renderInWorkspace(<MessageThread requestId="req_030" />, { as: "resident" });
    expect(await screen.findByRole("heading", { name: "No messages yet" })).toBeInTheDocument();
    expect(screen.getByLabelText("Message Grace Adeyemi")).toBeInTheDocument();
  });

  it("sends optimistically: Sending…, then sent, with the box cleared and focused", async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post("*/api/threads/:requestId/messages", async () => {
        await gate;
        return HttpResponse.json(
          {
            id: "msg_new",
            threadId: "thr_002",
            authorId: "usr_coord_grace",
            body: "Plumber confirmed.",
            createdAt: new Date().toISOString(),
          },
          { status: 201 },
        );
      }),
    );
    const { user } = renderInWorkspace(<MessageThread requestId="req_017" />, {
      as: "coordinator",
    });
    const box = await screen.findByLabelText("Message Diego Santillán");
    await user.type(box, "Plumber confirmed.{Enter}");

    expect(await screen.findByText("Sending…")).toBeInTheDocument();
    expect(box).toHaveValue("");
    expect(box).toHaveFocus();
    release();
    await waitFor(() => expect(screen.queryByText("Sending…")).not.toBeInTheDocument());
    expect(screen.getByText("Plumber confirmed.")).toBeInTheDocument();
  });

  it("keeps a sent message when an older poll lands after it", async () => {
    const { user, queryClient } = renderInWorkspace(<MessageThread requestId="req_017" />, {
      as: "coordinator",
    });
    await conversation();
    const stale = queryClient.getQueryData<ThreadDetail>(messageKeys.thread("req_017"));
    let release = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.get(
        "*/api/threads/:requestId/messages",
        async () => {
          await gate;
          return HttpResponse.json(stale);
        },
        { once: true },
      ),
    );
    void queryClient.refetchQueries({ queryKey: messageKeys.thread("req_017") });

    await user.type(await screen.findByLabelText("Message Diego Santillán"), "On my way.{Enter}");
    await waitFor(() => expect(screen.queryByText("Sending…")).not.toBeInTheDocument());
    await act(async () => {
      release();
      await delay(20);
    });
    expect(screen.getByText("On my way.")).toBeInTheDocument();
    expect(within(await conversation()).getAllByRole("listitem")).toHaveLength(6);
  });

  it("adds a new line with Shift+Enter instead of sending", async () => {
    const { user } = renderInWorkspace(<MessageThread requestId="req_017" />, {
      as: "coordinator",
    });
    const box = await screen.findByLabelText("Message Diego Santillán");
    await user.type(box, "Line one{Shift>}{Enter}{/Shift}Line two");
    expect(box).toHaveValue("Line one\nLine two");
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  it("does not send whitespace-only messages", async () => {
    const { user } = renderInWorkspace(<MessageThread requestId="req_017" />, {
      as: "coordinator",
    });
    const box = await screen.findByLabelText("Message Diego Santillán");
    await user.type(box, "   {Enter}");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(within(await conversation()).getAllByRole("listitem")).toHaveLength(5);
  });

  it("rolls back a failed send: Not sent, Retry, a toast and the text back in the box", async () => {
    armFailure("messages");
    const { user } = renderInWorkspace(<MessageThread requestId="req_017" />, {
      as: "coordinator",
    });
    const box = await screen.findByLabelText("Message Diego Santillán");
    await user.type(box, "Can you check tonight?{Enter}");

    expect(await screen.findByText("Not sent")).toBeInTheDocument();
    expect(await screen.findByText("Message not sent")).toBeInTheDocument();
    expect(box).toHaveValue("Can you check tonight?");

    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.queryByText("Not sent")).not.toBeInTheDocument());
    expect(box).toHaveValue("");
    expect(getDb().messages.at(-1)?.body).toBe("Can you check tonight?");
  });

  it("announces new messages from the other person", async () => {
    const { queryClient } = renderInWorkspace(<MessageThread requestId="req_017" />, {
      as: "coordinator",
    });
    await conversation();
    updateDb((db) => {
      db.messages.push({
        id: "msg_poll",
        threadId: "thr_002",
        authorId: "usr_res_diego",
        body: "Still dripping a little.",
        createdAt: new Date().toISOString(),
      });
    });
    await act(() => queryClient.invalidateQueries({ queryKey: messageKeys.thread("req_017") }));
    expect(await screen.findByText(/New message from Diego Santillán/)).toBeInTheDocument();
    expect(screen.getByText("Still dripping a little.")).toBeInTheDocument();
  });

  it("marks the thread read when opened", async () => {
    renderInWorkspace(<MessageThread requestId="req_017" />, { as: "coordinator" });
    await conversation();
    await waitFor(() => {
      const thread = getDb().threads.find((t) => t.requestId === "req_017");
      expect(Date.parse(thread?.lastReadAt.usr_coord_grace ?? "")).toBeGreaterThan(
        Date.parse(thread?.lastMessageAt ?? ""),
      );
    });
  });

  it("shows not found for another unit's conversation", async () => {
    renderInWorkspace(<MessageThread requestId="req_023" />, { as: "usr_res_diego" });
    expect(
      await screen.findByRole("heading", { name: "Conversation not found" }),
    ).toBeInTheDocument();
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get(
        "*/api/threads/:requestId/messages",
        () => HttpResponse.json({ title: "Boom", status: 500 }, { status: 500 }),
        { once: true },
      ),
    );
    const { user } = renderInWorkspace(<MessageThread requestId="req_017" />, {
      as: "coordinator",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load messages");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await conversation()).toBeInTheDocument();
  });

  it("renders nothing for the manager", async () => {
    renderInWorkspace(<MessageThread requestId="req_017" />, { as: "manager" });
    await screen.findByRole("main");
    expect(screen.queryByRole("region", { name: "Messages" })).not.toBeInTheDocument();
  });
});
