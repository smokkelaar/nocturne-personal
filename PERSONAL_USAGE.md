# Nocturne Personal — Google Health en medicatielogboek

Deze functies bestaan uitsluitend in de Personal-broncode. Je huidige Official en
Latest veranderen niet. Een wijziging in deze broncode is pas een HA-update nadat
de aparte HA-containercontrole is geslaagd.

## Waar vind ik het?

Log in als beheerder van je Personal-instantie en kies **Personal** in het menu.
De rechtstreekse paden zijn `/personal/google` en `/personal/medications`.
Gebruik je vertrouwde HTTPS-domein en de Personal-poort (standaard 8450).

## Google: eenmalige voorbereiding

1. Volg de [Google Health Cloud-setup](https://developers.google.com/health/setup):
   maak een eigen Google Cloud-project en activeer de Google Health API.
2. Configureer het OAuth-toestemmingsscherm. Voeg bij een app in testmodus je eigen
   Google-account toe aan de testgebruikers.
3. Maak een OAuth-client van het type **Web application**.
4. Voeg de callback-URL uit Personal exact toe als **Authorized redirect URI**,
   bijvoorbeeld `https://jouw-domein.example:8450/personal/google/callback`.
   Geen IP-adres, andere poort, extra slash of queryparameters.
5. Vul de client-ID en het client-secret alleen in het Personal-scherm in.
   Het secret en de refresh-token worden met Nocturne Data Protection versleuteld
   in de Personal-database bewaard. Bewaar backups beveiligd: ze bevatten ook de
   sleutels waarmee de tokens teruggelezen kunnen worden.
6. Kies de gewenste typen en een terugkijkperiode, en klik **Inloggen bij Google**.
   Log in bij Google en geef zelf toestemming. De browser keert terug naar Personal.
7. Klik **Nu synchroniseren**. Controleer de laatste geslaagde import en de echte
   metingen onderaan. Daarna wordt ongeveer elke 15 minuten gesynchroniseerd.

Na deze eenmalige configuratie blijft het client-secret versleuteld opgeslagen.
Bij opnieuw koppelen toont Personal daarom alleen **Inloggen met Google**; de
geavanceerde instellingen hoeven niet opnieuw te worden ingevuld.

De OAuth-koppeling vraagt alleen read-only Health-scopes en `openid`. Dat laatste
bindt de import aan hetzelfde Google-account; naam, e-mail en profielfoto worden
niet opgeslagen. Een accountwissel vereist ontkoppelen en daarna expliciet wissen
van de eerdere Google-import, zodat twee personen niet stilzwijgend gemengd raken.

### Wat wordt opgehaald?

| Keuze | Google-veld | Opslag/weergave |
|---|---|---|
| Stappen | `steps.count` met begin/eindtijd | Aantal in het interval, niet een dagtotaal |
| Hartslag | `heartRate.beatsPerMinute` | Slagen per minuut; geen verzonnen nauwkeurigheid |
| Gewicht | `weight.weightGrams` | Omgerekend naar kilogram |

De import gebruikt de officiële `dataPoints:reconcile`-route: Google combineert
overlappende bronnen. Alle antwoordpagina's moeten slagen voordat een tijdvenster
wordt vervangen. Herhalen geeft geen dubbele regels; correcties en verwijderingen
binnen de ingestelde periode worden meegenomen. Oudere import blijft staan. Verhoog
zo nodig de periode (maximaal 90 dagen); oudere verwijderingen worden niet automatisch
ontdekt. Er is geen onbeperkte historische backfill in deze eerste versie.

Gedeeltelijke toestemming is zichtbaar: alleen geselecteerde én toegestane typen
worden opgehaald. Ontbrekende gegevens worden niet als nul gepresenteerd. Bij een
fout blijft de eerdere import behouden. Na quota- of netwerkfouten probeert de
achtergrondtaak later opnieuw. Bij ingetrokken toestemming moet je opnieuw koppelen.

**Ontkoppelen** stopt lokaal de synchronisatie en probeert tevens de Google-token
in te trekken. Als dat niet bevestigd kon worden, verschijnt de instructie om de
app-toegang zelf bij Google in te trekken. Metingen blijven behouden.
**Google-import wissen** verwijdert, na bevestiging en alleen na ontkoppelen, alle
Google-metingen uit Personal. Het verwijdert niets bij Google en geen medicatielog.

### Grenzen

- Google Health is geen rechtstreekse externe toegang tot de lokale Android
  Health Connect-database. Niet alle vroegere Google Fit- of Samsung Health-data
  hoeven in de Google-cloud beschikbaar te zijn.
- Google kan `ACCOUNT_NOT_LINKED` teruggeven wanneer het gekozen Google-account
  nog niet aan een Fitbit-account is gekoppeld. Personal toont dit afzonderlijk
  van netwerk- en OAuth-fouten.
- Slaap en andere typen zijn nog niet selecteerbaar in deze versie.
- De Personal-metingen staan nog niet in de bestaande Nocturne-rapporten; er is
  bewust geen automatische invloed op behandelprofielen of doseringsfuncties.
- In Google OAuth-testmodus kunnen refresh-tokens na zeven dagen verlopen.
  Een openbare client vraagt afzonderlijke Google-verificatie en privacy-informatie.
- Gebruik een vertrouwd HTTPS-domein. Voor deze uitgaande import is geen nieuwe
  poortforward naar het internet nodig als de browser de callback lokaal kan bereiken.

## Mounjaro en soortgelijke medicatie

1. Kies **Personal → Medicatielogboek**.
2. Vul het middel en de werkzame stof van je verpakking/voorschrift in; Mounjaro
   bevat tirzepatide ([EMA-productinformatie](https://www.ema.europa.eu/en/medicines/human/EPAR/mounjaro)).
3. Kies **Toegediend / ingenomen** en vul de werkelijk toegediende hoeveelheid en
   expliciete eenheid in: **mg** of **microgram**. Er staat geen standaarddosis ingevuld.
4. Noteer het werkelijke tijdstip, de toedieningswijze en desgewenst plaats/notities.
5. Klik **Opslaan** en controleer de regel in de geschiedenis.
6. Kies voor een overgeslagen toediening **Overgeslagen**. Er wordt dan geen dosis
   opgeslagen. Een toekomstige geplande dosis is geen werkelijke toediening en
   wordt hier niet geregistreerd.

Je kunt een regel wijzigen of na bevestiging verwijderen. Een achterhaalde versie
mag niet ongemerkt een recentere wijziging overschrijven. De UTC-tijd en ingevoerde
UTC-offset blijven bewaard; de lijst toont tijdstippen in de tijdzone van je browser.

Dit logboek is niet voor insuline-eenheden, penklikken of milliliters. Het rekent
geen concentraties om, bepaalt geen opbouwschema, adviseert geen gemiste dosis en
beïnvloedt geen IOB/insulineberekening. Gebruik je voorschrift voor behandelbeslissingen.

## Veilig testen

Begin met een herkenbare testregistratie, controleer wijzigen/verwijderen en maak
een beveiligde Personal-backup voordat je echte gegevens toevoegt. Controleer na
een herstart of registratie en verbinding behouden zijn. De automatische tests
gebruiken uitsluitend kunstmatige gegevens; echte Google-consent en bronbeschikbaarheid
moeten met je eigen client/account nog worden gecontroleerd.

Technische referenties: [Google scopes](https://developers.google.com/health/scopes),
[reconcile](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints/reconcile),
[gegevensschema's](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints).
