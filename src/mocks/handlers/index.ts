import { dashboardHandlers } from "./dashboard";
import { requestHandlers } from "./requests";
import { sessionHandlers } from "./session";
import { vendorHandlers } from "./vendors";

/**
 * Every mock endpoint. Add a feature's handlers file next to these and spread
 * it here; the browser worker, Vitest and Storybook all use this list.
 */
export const handlers = [
  ...sessionHandlers,
  ...requestHandlers,
  ...vendorHandlers,
  ...dashboardHandlers,
];
