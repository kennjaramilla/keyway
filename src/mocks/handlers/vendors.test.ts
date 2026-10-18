import { z } from "zod";
import { vendorSchema } from "@/features/vendors/schema";
import { api } from "@/lib/api-client";
import { statusOf as status } from "@/test/api";
import { signInAs } from "@/test/session";

describe("GET /api/vendors", () => {
  it("lists vendors serving the active building only", async () => {
    signInAs("coordinator", "bld_maple");
    const vendors = await api.get("/vendors", z.array(vendorSchema));
    expect(vendors.every((vendor) => vendor.buildingIds.includes("bld_maple"))).toBe(true);
    signInAs("usr_coord_theo");
    const linden = await api.get("/vendors", z.array(vendorSchema));
    expect(linden.map((vendor) => vendor.id)).not.toContain("ven_plumblevel");
    expect(
      await status(
        api.get("/vendors", z.array(vendorSchema), { query: { buildingId: "bld_harbor" } }),
      ),
    ).toBe(404);
    signInAs("resident");
    expect(await status(api.get("/vendors", z.array(vendorSchema)))).toBe(403);
  });
});
