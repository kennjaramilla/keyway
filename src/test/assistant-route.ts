import { http } from "msw";
import { GET, POST } from "@/app/api/assistant/route";
import { server } from "@/mocks/node";

/**
 * /api/assistant is a real Next route, not a mock endpoint. In Vitest, route
 * it to the handler itself, forwarding the jsdom session cookie.
 */
export function routeAssistantToHandler() {
  server.use(
    http.get("*/api/assistant", () => GET()),
    http.post("*/api/assistant", async ({ request }) =>
      POST(
        new Request(request.url, {
          method: "POST",
          headers: { "content-type": "application/json", cookie: document.cookie },
          body: await request.text(),
        }),
      ),
    ),
  );
}
