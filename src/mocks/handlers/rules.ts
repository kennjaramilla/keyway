import { http, HttpResponse } from "msw";
import { compareSections } from "@/features/house-rules/schema";
import { getDb } from "../db";
import { API, deny, notFound, sessionUser, unauthorized } from "./utils";

export const ruleHandlers = [
  // GET /api/rules?buildingId: the building's house rules, in section order.
  http.get(`${API}/rules`, ({ request, cookies }) => {
    const user = sessionUser(cookies);
    if (!user) return unauthorized();
    const buildingId = new URL(request.url).searchParams.get("buildingId") ?? user.activeBuildingId;
    const denied = deny(user, "rules:view", { buildingId });
    if (denied) return denied;
    const db = getDb();
    const document = db.ruleDocuments.find((item) => item.buildingId === buildingId);
    if (!document) return notFound("Rules");
    const passages = db.rulePassages
      .filter((passage) => passage.documentId === document.id)
      .sort((a, b) => compareSections(a.section, b.section));
    return HttpResponse.json({ document, passages });
  }),
];
