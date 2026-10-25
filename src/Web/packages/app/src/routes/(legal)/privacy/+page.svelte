<script lang="ts">
  import { resolve } from "$app/paths";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
  const policy = $derived(data.privacy);
</script>

<svelte:head>
  <title>Privacy Policy - {policy.appName ?? "Nocturne"}</title>
</svelte:head>

<h1>Privacy Policy</h1>
{#if policy.published}
  <p class="lead">{policy.appName} is operated by {policy.operatorName}.</p>
  <p>Effective date: {policy.effectiveDate}</p>
  <p>
    This policy describes this operator's Nocturne instance. Other installations
    have their own operators and data handling practices.
  </p>
  <h2>Operator and privacy contact</h2>
  <p>{policy.operatorName}</p>
  <p><a href={"mailto:" + policy.contactEmail}>{policy.contactEmail}</a></p>
{:else}
  <p role="status">
    This instance has not published its operator's privacy information. The
    software information below does not replace an instance-specific policy. The
    operator can configure and publish it in Platform Administration →
    Integrations → Public privacy policy.
  </p>
{/if}

<h2>Data collected and purpose</h2>
<p>
  Nocturne stores diabetes and health records supplied by its users and
  configured connectors, such as glucose readings, treatments, meals, activity
  and account settings. It uses them for the personal histories, charts, reports
  and sharing features you choose to use.
</p>
<h2>Google Health access</h2>
<p>
  Connecting Google Health is optional. After you authorize access, the
  connector reads permitted data to show your steps, heart rate, weight and
  sleep history. It also processes timestamps, units, source identifiers,
  inventory counts and sync progress. It uses a Google account identifier to
  keep the connection bound to the correct account, and stores OAuth permissions
  and tokens for background access. It does not receive your Google password.
</p>
<p>
  The current connector requests openid and the read-only Google Health scopes
  for activity and fitness, health metrics and measurements, and sleep. Google's
  permission groups are broader than the four import types. Inventory scanning
  checks availability for permitted types; confirming your selection starts
  imports. Background synchronization normally runs about every fifteen minutes.
  The connector does not write to Google Health or request Gmail, Drive,
  contacts or location access.
</p>
<h2>Storage, security and tenant access</h2>
<p>
  Health records are stored in this installation's PostgreSQL database.
  Connector secrets in the database are encrypted. Authentication, account
  permissions and tenant isolation control access through Nocturne. A user in
  one tenant does not gain access to another tenant merely by signing in.
</p>
<p>
  Restoring a complete backup preserves tenant assignments and permissions.
  These application controls do not make a database backup unreadable to a host
  administrator with direct storage or database access. Encryption of connector
  secrets is not a claim that the entire database or every backup is encrypted.
</p>
{#if policy.published}
  <p class="whitespace-pre-line break-words">{policy.hosting}</p>
{/if}
<h2>Recipients, sharing and human access</h2>
<p>
  Google processes authorization and API requests under its
  <a href="https://policies.google.com/privacy">privacy policy</a>
  . Installing Nocturne does not automatically send health records to the Nocturne
  project developers. Accounts, sharing links, exports and integrations can expose
  data to the recipients you authorize; disconnecting Google does not recall those
  copies.
</p>
{#if policy.published}
  <p class="whitespace-pre-line break-words">{policy.sharing}</p>
{/if}
<p>
  Google Health data may be read by another person only with the user's specific
  consent, where necessary for security, or to meet a legal obligation.
</p>
<h2>Google Health Limited Use</h2>
<p>
  Use of information received from Google Health complies with the
  <a
    href="https://developers.google.com/health/policies/health-api-developer-user-data-policy"
  >
    Google Health API Developer and User Data Policy
  </a>
  , including its Limited Use requirements, and the
  <a href="https://developers.google.com/terms/api-services-user-data-policy">
    Google API Services User Data Policy
  </a>
  . Google Health data is used for the visible personal history and synchronization
  features. It is not sold, used for advertising, credit decisions or training general
  AI models, or supplied for a medical device's regulated function.
</p>
<h2>Retention and backups</h2>
<p>
  Disconnecting or withdrawing Google's permission stops future access but does
  not automatically delete imported history. Nocturne has no automatic expiry
  for Google Health history. Backup copies and exports require separate
  handling.
</p>
{#if policy.published}
  <p class="whitespace-pre-line break-words">{policy.retention}</p>
  <p class="whitespace-pre-line break-words">{policy.backups}</p>
{:else}
  <p>
    Ask this installation's operator about its retention, recipients and backups
    before connecting.
  </p>
{/if}
<h2>Withdraw access and delete data</h2>
<ol>
  <li>
    Open Settings → Connectors &amp; Apps → Google Health and choose Disconnect.
  </li>
  <li>
    Then choose Delete imported Google Health data and confirm to remove this
    connector's imported records from the active tenant database. This does not
    delete Google's originals.
  </li>
  <li>
    You can also withdraw access in <a
      href="https://myaccount.google.com/connections"
    >
      Google Account connections
    </a>
    . This does not remove existing Nocturne copies.
  </li>
  <li>
    Contact the operator for account deletion, access, correction, export or
    removal of remaining backup copies.
  </li>
</ol>
<p>
  When the same Google account is connected to multiple tenants, a local
  disconnect may preserve Google's grant for the others. Revoking access in
  Google can affect all those connections. Deleting one tenant's imported data
  does not delete other tenants' copies.
</p>
<h2>Changes and privacy requests</h2>
<p>
  Material changes to Google data use must be disclosed before they take effect,
  with renewed consent where required. For privacy requests, use the operator's
  public contact above rather than posting health details on GitHub. The
  operator may need to verify that a request belongs to your account.
</p>
<p>
  Session cookies and browser storage support sign-in and preferences. This page
  contains no health records and requires no Nocturne account to read.
</p>
<p>
  <a href={resolve("/about")}>About this instance</a>
  ·
  <a href={resolve("/terms")}>Terms of Service</a>
</p>
<p>
  Source code:
  <a href="https://github.com/smokkelaar/nocturne-personal">
    Nocturne Personal
  </a>
  ·
  <a href="https://github.com/nightscout/nocturne">Upstream Nocturne</a>
  . Project developers are not automatically the operators of this installation.
</p>
