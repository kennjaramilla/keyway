import { http, HttpResponse } from "msw";
import { z } from "zod";
import { server } from "@/mocks/node";
import { ApiError, api, buildUrl } from "./api-client";

const itemSchema = z.object({ id: z.string(), name: z.string() });

describe("api client", () => {
  it("builds URLs against the API base and drops empty query values", () => {
    expect(buildUrl("/requests", { status: "new", q: "", page: 2, missing: undefined })).toBe(
      "http://localhost:3000/api/requests?status=new&page=2",
    );
  });

  it("parses a successful response with the schema", async () => {
    server.use(http.get("*/api/items/1", () => HttpResponse.json({ id: "1", name: "Sink" })));
    await expect(api.get("/items/1", itemSchema)).resolves.toEqual({ id: "1", name: "Sink" });
  });

  it("sends a JSON body on writes", async () => {
    server.use(
      http.post("*/api/items", async ({ request }) =>
        HttpResponse.json({ id: "2", ...((await request.json()) as object) }),
      ),
    );
    await expect(api.post("/items", itemSchema, { name: "Door" })).resolves.toEqual({
      id: "2",
      name: "Door",
    });
  });

  it("supports patch and delete", async () => {
    server.use(
      http.patch("*/api/items/1", () => HttpResponse.json({ id: "1", name: "Renamed" })),
      http.delete("*/api/items/1", () => new HttpResponse(null, { status: 204 })),
    );
    await expect(api.patch("/items/1", itemSchema, { name: "Renamed" })).resolves.toMatchObject({
      name: "Renamed",
    });
    await expect(api.delete("/items/1", z.null())).resolves.toBeNull();
  });

  it("turns problem details into a typed ApiError", async () => {
    server.use(
      http.get("*/api/items/9", () =>
        HttpResponse.json(
          { title: "Not found", status: 404, detail: "No such item." },
          { status: 404 },
        ),
      ),
    );
    const error = await api.get("/items/9", itemSchema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      message: "No such item.",
      isNotFound: true,
      isForbidden: false,
    });
  });

  it("falls back to the status text when the error body is not problem details", async () => {
    server.use(
      http.get(
        "*/api/items/x",
        () => new HttpResponse("nope", { status: 403, statusText: "Forbidden" }),
      ),
    );
    const error = await api.get("/items/x", itemSchema).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 403, message: "Forbidden", isForbidden: true });
  });

  it("rejects a response that does not match the schema", async () => {
    server.use(http.get("*/api/items/1", () => HttpResponse.json({ id: 1 })));
    await expect(api.get("/items/1", itemSchema)).rejects.toMatchObject({
      status: 502,
      problem: { title: "Unexpected response" },
    });
  });

  it("reports network failures as status 0", async () => {
    server.use(http.get("*/api/items/1", () => HttpResponse.error()));
    await expect(api.get("/items/1", itemSchema)).rejects.toMatchObject({
      status: 0,
      problem: { title: "Network error" },
    });
  });
});
