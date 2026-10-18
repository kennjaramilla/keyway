import { z } from "zod";

// Enums and labels (docs/spec/data-model.md). Labels are the only UI copy for them.

export const CATEGORIES = [
  "plumbing",
  "electrical",
  "heating_cooling",
  "appliance",
  "doors_locks",
  "pest",
  "general",
] as const;
export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;
export const CATEGORY_LABELS: Record<Category, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  heating_cooling: "Heating & cooling",
  appliance: "Appliance",
  doors_locks: "Doors & locks",
  pest: "Pests",
  general: "General repair",
};

export const URGENCIES = ["emergency", "high", "normal", "low"] as const;
export const urgencySchema = z.enum(URGENCIES);
export type Urgency = z.infer<typeof urgencySchema>;
export const URGENCY_LABELS: Record<Urgency, string> = {
  emergency: "Emergency",
  high: "High",
  normal: "Normal",
  low: "Low",
};

/** Hours from creation before an open request counts as overdue. */
export const SLA_HOURS: Record<Urgency, number> = {
  emergency: 24,
  high: 72,
  normal: 168,
  low: 336,
};

export const STATUSES = ["new", "triaged", "scheduled", "in_progress", "resolved"] as const;
export const statusSchema = z.enum(STATUSES);
export type Status = z.infer<typeof statusSchema>;
export const STATUS_LABELS: Record<Status, string> = {
  new: "New",
  triaged: "Triaged",
  scheduled: "Scheduled",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const LOCATIONS = [
  "kitchen",
  "bathroom",
  "bedroom",
  "living_room",
  "entry",
  "laundry",
  "balcony",
  "other",
] as const;
export const locationSchema = z.enum(LOCATIONS);
export type Location = z.infer<typeof locationSchema>;
export const LOCATION_LABELS: Record<Location, string> = {
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  living_room: "Living room",
  entry: "Entry",
  laundry: "Laundry",
  balcony: "Balcony",
  other: "Other",
};

export const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;
export const timeSlotSchema = z.enum(TIME_SLOTS);
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Morning (8–12)",
  afternoon: "Afternoon (12–5)",
  evening: "Evening (5–8)",
};

export const TIMELINE_EVENT_TYPES = [
  "created",
  "triaged",
  "vendor_assigned",
  "scheduled",
  "rescheduled",
  "started",
  "resolved",
  "note",
  "cancelled",
  "reopened",
] as const;
export const timelineEventTypeSchema = z.enum(TIMELINE_EVENT_TYPES);

// Entities

export const visitWindowSchema = z.object({ start: z.iso.datetime(), end: z.iso.datetime() });
export type VisitWindow = z.infer<typeof visitWindowSchema>;

export const preferredWindowSchema = z.object({ date: z.iso.date(), slot: timeSlotSchema });
export type PreferredWindow = z.infer<typeof preferredWindowSchema>;

export const timelineEventSchema = z.object({
  id: z.string(),
  type: timelineEventTypeSchema,
  at: z.iso.datetime(),
  actorId: z.string(),
  fromStatus: statusSchema.nullish(),
  toStatus: statusSchema.nullish(),
  note: z.string().nullish(),
  meta: z
    .object({ vendorId: z.string().optional(), visitWindow: visitWindowSchema.optional() })
    .nullish(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const requestSchema = z.object({
  id: z.string(),
  number: z.string(),
  buildingId: z.string(),
  unitId: z.string(),
  residentId: z.string(),
  coordinatorId: z.string(),
  vendorId: z.string().nullable(),
  category: categorySchema,
  urgency: urgencySchema,
  status: statusSchema,
  title: z.string(),
  description: z.string(),
  location: locationSchema,
  preferredWindows: z.array(preferredWindowSchema),
  permissionToEnter: z.boolean(),
  entryNotes: z.string().nullable(),
  visitWindow: visitWindowSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().nullable(),
  timeline: z.array(timelineEventSchema),
});
export type MaintenanceRequest = z.infer<typeof requestSchema>;

export const requestListSchema = z.array(requestSchema);

// Status machine: the UI, the MSW handlers and the tests share this table.

export type TransitionAction =
  "request:triage" | "request:schedule" | "request:start" | "request:resolve" | "request:reopen";

export const TRANSITIONS: Record<Status, readonly { action: TransitionAction; to: Status }[]> = {
  new: [{ action: "request:triage", to: "triaged" }],
  triaged: [{ action: "request:schedule", to: "scheduled" }],
  scheduled: [
    { action: "request:schedule", to: "scheduled" },
    { action: "request:start", to: "in_progress" },
  ],
  in_progress: [{ action: "request:resolve", to: "resolved" }],
  resolved: [{ action: "request:reopen", to: "in_progress" }],
};

/** The status an action moves a request to, or null if not allowed from `from` (API: 409). */
export function nextStatus(from: Status, action: TransitionAction): Status | null {
  return TRANSITIONS[from].find((transition) => transition.action === action)?.to ?? null;
}

// Derived values

export function dueAt(request: Pick<MaintenanceRequest, "createdAt" | "urgency">) {
  return new Date(new Date(request.createdAt).getTime() + SLA_HOURS[request.urgency] * 3_600_000);
}

export function isOverdue(
  request: Pick<MaintenanceRequest, "createdAt" | "urgency" | "status">,
  now: Date = new Date(),
) {
  return request.status !== "resolved" && now > dueAt(request);
}

// Action inputs (forms + MSW validation). `today` is building-local YYYY-MM-DD.

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function makeRequestCreateSchema(today: string) {
  const lastDay = addDays(today, 14);
  return z
    .object({
      category: categorySchema,
      urgency: urgencySchema,
      title: z
        .string()
        .trim()
        .min(5, "Use at least 5 characters.")
        .max(80, "Keep the title under 80 characters."),
      description: z
        .string()
        .trim()
        .min(10, "Add a few more details (at least 10 characters).")
        .max(1000, "Keep the description under 1,000 characters."),
      location: locationSchema,
      preferredWindows: z
        .array(
          preferredWindowSchema.refine((window) => window.date >= today && window.date <= lastDay, {
            message: "Pick a date in the next 14 days.",
            path: ["date"],
          }),
        )
        .max(3, "Choose up to 3 time windows."),
      permissionToEnter: z.boolean({ error: "Choose yes or no." }),
      entryNotes: z.string().trim().max(200, "Keep entry notes under 200 characters.").optional(),
    })
    .superRefine((value, ctx) => {
      if (value.urgency !== "emergency" && value.preferredWindows.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["preferredWindows"],
          message: "Choose at least one time window.",
        });
      }
      const keys = value.preferredWindows.map((window) => `${window.date}:${window.slot}`);
      if (new Set(keys).size !== keys.length) {
        ctx.addIssue({
          code: "custom",
          path: ["preferredWindows"],
          message: "Each time window must be different.",
        });
      }
    });
}
export type RequestCreate = z.infer<ReturnType<typeof makeRequestCreateSchema>>;

export const triageSchema = z.object({
  category: categorySchema.optional(),
  urgency: urgencySchema.optional(),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").optional(),
});

export const assignSchema = z.object({ vendorId: z.string().min(1, "Choose a vendor.") });

export const resolveSchema = z.object({
  resolutionNote: z
    .string()
    .trim()
    .min(5, "Describe what was done (at least 5 characters).")
    .max(500, "Keep the note under 500 characters."),
});
