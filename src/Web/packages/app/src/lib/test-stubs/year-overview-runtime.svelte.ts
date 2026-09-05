import { vi } from "vitest";

export const browser = true;
export const building = false;
export const goto = vi.fn();
export const glucoseUnits = { current: "mg/dl" };
export const timeFormat = { current: "24h" };
export const regionFormat = { current: "en-US" };
export const preferredLanguage = { current: "en" };
export const getDateParamsContext = () => ({});
export const page = $state({
  data: {
    tenantSlug: "synthetic-tenant",
    user: { subjectId: "synthetic-user" },
  },
});
