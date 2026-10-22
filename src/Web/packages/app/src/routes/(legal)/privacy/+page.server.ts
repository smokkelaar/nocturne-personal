import type { PageServerLoad } from "./$types";
import { getPublicPrivacySettings } from "$lib/api/generated/privacies.generated.remote";

export const load: PageServerLoad = async ({ setHeaders }) => {
  setHeaders({ "cache-control": "no-store" });
  return { privacy: await getPublicPrivacySettings().run() };
};
