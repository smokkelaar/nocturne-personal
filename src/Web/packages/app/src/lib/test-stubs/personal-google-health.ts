import { vi } from "vitest";
import type { GoogleHealthStatus, PersonalHealthReading } from "$lib/api";
import { effectAwareQuery } from "./effect-aware-query.svelte";

export const googleHealthMocks = {
  status: vi.fn<() => Promise<GoogleHealthStatus>>(),
  readings: vi.fn<() => Promise<PersonalHealthReading[]>>(),
  save: vi.fn(),
  start: vi.fn(),
  disconnect: vi.fn(),
  sync: vi.fn(),
  purge: vi.fn(),
};

export const getPersonalGoogleHealth = () =>
  effectAwareQuery(googleHealthMocks.status);
export const getPersonalHealthReadings = () =>
  effectAwareQuery(googleHealthMocks.readings);
export const savePersonalGoogleHealth = googleHealthMocks.save;
export const startPersonalGoogleHealth = googleHealthMocks.start;
export const disconnectPersonalGoogleHealth = googleHealthMocks.disconnect;
export const syncPersonalGoogleHealth = googleHealthMocks.sync;
export const purgePersonalGoogleHealth = googleHealthMocks.purge;
