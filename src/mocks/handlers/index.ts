import { billingHandlers } from "./billing";
import { dashboardHandlers } from "./dashboard";
import { requestHandlers } from "./requests";
import { ruleHandlers } from "./rules";
import { sessionHandlers } from "./session";
import { threadHandlers } from "./threads";
import { vendorHandlers } from "./vendors";

/**
 * Every mock endpoint. Add a feature's handlers file next to these and spread
 * it here; the browser worker, Vitest and Storybook all use this list.
 */
export const handlers = [
  ...sessionHandlers,
  // Before requests: its POST /requests/:id/:action would answer /requests/:id/charges with 404.
  ...billingHandlers,
  ...requestHandlers,
  ...threadHandlers,
  ...vendorHandlers,
  ...dashboardHandlers,
  ...ruleHandlers,
];
