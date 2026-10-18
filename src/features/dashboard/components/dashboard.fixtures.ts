import type { Dashboard } from "../schema";

/** Story and test data shaped like GET /api/dashboard with the seed at anchor time. */
export const weekPoints = [
  { label: "Tue", opened: 2, resolved: 0 },
  { label: "Wed", opened: 1, resolved: 0 },
  { label: "Thu", opened: 4, resolved: 1 },
  { label: "Fri", opened: 2, resolved: 1 },
  { label: "Sat", opened: 4, resolved: 0 },
  { label: "Sun", opened: 5, resolved: 0 },
  { label: "Mon", opened: 2, resolved: 0 },
];

export const buildingHealth: Dashboard["buildingHealth"] = [
  {
    buildingId: "bld_harbor",
    name: "Harbor View Lofts",
    address: "41 Quayside Row, Westmere",
    open: 7,
    overdue: 2,
    onTimePct: 80,
  },
  {
    buildingId: "bld_maple",
    name: "Maple Court",
    address: "8 Alder Street, Westmere",
    open: 7,
    overdue: 2,
    onTimePct: 82,
  },
  {
    buildingId: "bld_linden",
    name: "The Linden",
    address: "300 Linden Rise, Westmere",
    open: 6,
    overdue: 0,
    onTimePct: 100,
  },
];

export const vendors: Dashboard["vendors"] = [
  {
    vendorId: "ven_tidewater",
    name: "Tidewater Plumbing Co.",
    trade: "plumbing",
    onSite: 1,
    scheduled: 1,
    state: "on_site",
  },
  {
    vendorId: "ven_corner",
    name: "Corner Appliance Repair",
    trade: "appliance",
    onSite: 0,
    scheduled: 1,
    state: "scheduled",
  },
  {
    vendorId: "ven_ironbark",
    name: "Ironbark Lock & Access",
    trade: "doors_locks",
    onSite: 0,
    scheduled: 0,
    state: "assigned",
  },
  {
    vendorId: "ven_fernhill",
    name: "Fernhill Pest Care",
    trade: "pest",
    onSite: 0,
    scheduled: 0,
    state: "available",
  },
];
