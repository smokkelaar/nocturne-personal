import { errorMessage, errorStatus } from "$lib/forms/submit-error";

const operations = {
  status: "De koppelingsstatus kon niet worden opgehaald.",
  readings: "De geïmporteerde metingen konden niet worden opgehaald.",
  save: "De Google-instellingen konden niet worden opgeslagen.",
  signin: "De Google-aanmelding kon niet worden gestart.",
  sync: "De Google-import kon niet worden uitgevoerd.",
  disconnect: "Google kon niet worden ontkoppeld.",
  purge: "De Google-import kon niet worden gewist.",
};

export type GoogleHealthOperation = keyof typeof operations;

export function describeGoogleHealthError(
  error: unknown,
  operation: GoogleHealthOperation,
  knownErrors: Record<string, string>,
): string {
  const status = errorStatus(error);
  const http =
    status !== undefined &&
    Number.isInteger(status) &&
    status >= 400 &&
    status <= 599
      ? status
      : undefined;
  const reason = errorMessage(error);
  const known = reason !== undefined && Object.hasOwn(knownErrors, reason);
  const code = known ? reason : http ? `http_${http}` : "page_or_network_error";
  const explanation = known
    ? knownErrors[reason]
    : http === 401
      ? "Je Nocturne-sessie is verlopen. Log opnieuw in bij Nocturne en laad deze pagina opnieuw."
      : http === 403
        ? "Je Nocturne-account heeft geen toegang tot deze instellingen. Gebruik een beheerder met tenant-instellingenrechten."
        : http === 404
          ? "Deze functie ontbreekt in de geïnstalleerde versie. Controleer of Nocturne Personal is bijgewerkt."
          : http === 429
            ? "Er zijn te veel verzoeken gedaan. Probeer het over enkele minuten opnieuw."
            : http && http >= 500
              ? "Nocturne kon het verzoek niet verwerken. Controleer de serverlog bij deze poging."
              : "Er trad een fout op in de pagina of verbinding. Laad de pagina opnieuw; blijft dit gebeuren, geef de technische code door.";

  // Only fixed messages and recognized codes may leave the error boundary.
  return `${operations[operation]} ${explanation} Technische code: ${operation}/${code}${http ? ` · HTTP ${http}` : ""}.`;
}
