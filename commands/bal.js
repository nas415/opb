import * as balanceModule from "./balance.js";

export async function execute(interactionOrMessage, client) {
  // Delegate to balance module. This file intentionally does not export
  // `data` so it won't be registered as a slash command; it remains
  // available as the prefix alias: `op bal`.
  await balanceModule.execute(interactionOrMessage, client);
}
