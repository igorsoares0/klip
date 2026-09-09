/**
 * Tracked-click ceiling. Spec §19 calls for this to be "configurable rather
 * than hard-coded", so it lives here and can be overridden per environment.
 */
export const CLICK_LIMIT = Number(process.env.KLIP_CLICK_LIMIT ?? 100_000);
