# Outlook Account Connections

Cert Tracker can optionally connect directly to Microsoft Outlook through Microsoft Graph. This connection is separate from ChatGPT's Outlook connector: authorising Outlook inside ChatGPT does **not** give the Cert Tracker web application a reusable Microsoft token.

The tracker therefore uses its own user-initiated Microsoft Entra application registration and delegated OAuth 2.0 Authorization Code flow with PKCE.

## What the connection is for

The first deployment is deliberately calendar-first:

- read the user's Outlook calendar;
- recognise events managed by the ChatGPT watches through `[GAME]`, `[CERT]`, `[TRAINING]`, `[VENDOR]`, `[WORK]` prefixes and the `Managed by ChatGPT Watch:` marker;
- parse optional coordinator metadata such as Impact, Action state, Next action and Dependency;
- provide a managed-milestone preview and a foundation for 7/30/90-day priority intelligence;
- use Outlook as the bridge for Breathe HR calendar sync if that feature is enabled later.

Optional inbox intelligence can be enabled separately with `Mail.Read`. It is intentionally off by default because calendar integration does not require mailbox access and ChatGPT already handles Outlook email monitoring separately.

## Personal Microsoft accounts

A business Microsoft 365 tenant is **not** required for this integration. Microsoft Graph supports delegated calendar access for personal Microsoft accounts such as Outlook.com, Hotmail, Live, Skype and Xbox-linked Microsoft accounts.

For a personal account deployment:

- register the application with **Personal Microsoft accounts only** as the supported account type;
- use the `consumers` Microsoft identity authority in Cert Tracker;
- register the production Cert Tracker URL as a **Single-page application (SPA)** redirect URI;
- grant delegated `User.Read` and `Calendars.ReadWrite` permissions;
- add `Mail.Read` only if you intentionally want Cert Tracker itself to inspect inbox context.

The `common` authority also accepts personal accounts when the app registration supports them, but `consumers` is the narrower and clearer choice for a personal-only deployment.

## Security model

- The public repository contains no Microsoft password, client secret, access token or refresh token.
- The Microsoft Application (client) ID and tenant/authority may be stored in browser-local configuration because they are public OAuth configuration, not credentials.
- OAuth access and refresh tokens are kept in `sessionStorage` only.
- Outlook event/message payloads are not added to the encrypted GitHub device-sync vault by this module.
- The current in-memory Outlook snapshot is discarded when the page/session is discarded.
- Graph and token calls use `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`.
- Calendar writes remain attributable to the signed-in user because the integration uses delegated permissions.
- No client secret should be created for or pasted into this browser application.

## One-time Microsoft Entra setup

1. Sign in to the Microsoft Entra admin centre and open **Identity > Applications > App registrations**.
2. Select **New registration**.
3. Give the app a clear name such as `Cert Tracker Outlook Bridge`.
4. If this tracker will use a personal Outlook.com/Hotmail/Live Microsoft account, choose **Personal Microsoft accounts only** under Supported account types. If you intentionally want both personal and work/school Microsoft accounts to be usable, choose the mixed account option instead.
5. Register the application.
6. Open the registration's **Authentication** page.
7. Add a platform and choose **Single-page application (SPA)**.
8. In Cert Tracker, open **Connections** and copy the exact **Redirect URI to register as SPA** into the Entra SPA redirect URI list. The production tracker URL must match exactly.
9. Do not enable the legacy implicit grant merely for this integration.
10. Open **API permissions > Add a permission > Microsoft Graph > Delegated permissions** and add:
    - `User.Read`
    - `Calendars.ReadWrite`
    - optionally `Mail.Read` only if you explicitly want the tracker itself to inspect inbox context.
11. Copy the **Application (client) ID** from the app registration overview.
12. In Cert Tracker > **Connections**, paste the client ID. For a personal Microsoft account, select **Use personal account** or set the authority to `consumers`.
13. Select **Save setup**, then **Connect Outlook**.
14. Complete Microsoft sign-in/consent with the personal Microsoft account you want the tracker to read.
15. Back in the tracker, use **Test access** and then **Sync managed milestones**.

For personal Microsoft accounts there is no organisation-level Microsoft 365 administrator whose app-consent policy needs to approve the connection. The user grants consent to the delegated permissions for their own Microsoft account. Work/school accounts can still be subject to organisational consent policy if the same tracker registration is later used with them.

## What the current scaffold does

`src/account-connections.js` provides:

- PKCE generation and state validation;
- Microsoft sign-in callback handling;
- delegated Graph access;
- token refresh while the browser session remains available;
- Outlook profile/calendar discovery;
- calendar-view retrieval;
- parsing of ChatGPT-managed events and coordinator metadata;
- optional recent-mail retrieval when `Mail.Read` has explicitly been enabled;
- session disconnect/forget controls.

`src/account-connections-ui.js` provides:

- the header **Connections** button;
- Outlook setup and connection state;
- a one-click personal-account mode that selects the `consumers` authority;
- the exact redirect URI to register;
- a least-privilege Calendar-first mode;
- access test and on-demand managed-milestone sync;
- an Outlook intelligence preview;
- separation from the existing encrypted GitHub state-sync connection;
- a Breathe HR calendar-bridge explanation.

## Recommended data flow

```text
ChatGPT specialist watches
        |
        v
Outlook Calendar
[GAME] [CERT] [TRAINING] [VENDOR] [WORK]
        |
        | Microsoft Graph delegated OAuth
        v
Cert Tracker Account Connections
        |
        +--> managed milestone timeline
        +--> action/dependency metadata
        +--> 7 / 30 / 90-day priority intelligence
        +--> certification-roadmap impact

Breathe HR Calendar Sync (when available)
        |
        v
Outlook Calendar
        |
        v
Cert Tracker leave/workload context
```

Outlook should remain the source of truth for appointments, reminders, leave and dated commitments. Cert Tracker should become the longer-lived structured intelligence layer for roadmap state, certification opportunities, evidence, action dependencies and decision history.

## Next integration layer

After the OAuth connection has been validated against the production tracker URL, the next step is to map stable `[CERT]` management keys onto `CERTS` IDs and feed the parsed Outlook intelligence into the recommendation/planning layer. That enables features such as:

- certification retirement or exam-version changes automatically affecting timing warnings;
- confirmed exam/voucher deadlines appearing alongside tracker readiness;
- 7/30/90-day action prioritisation;
- action state and dependency chains;
- a persistent decision log in encrypted tracker state rather than in the public repository;
- Breathe-approved leave reducing available study capacity when Outlook receives the synced leave.

This second layer should store only derived tracker state that the user has elected to keep. Raw Outlook mail/calendar payloads should remain transient unless a future privacy-reviewed feature explicitly requires persistence.

## Static-PWA limitation

Cert Tracker has no application backend. The Outlook connection therefore works while the PWA/browser is open and authenticated. It is not a replacement for the hourly ChatGPT watches and cannot reliably run Microsoft Graph polling in the background after the browser/PWA has been closed. The intended architecture is:

- **ChatGPT watches:** continuous external monitoring and Outlook calendar maintenance;
- **Outlook:** source of truth for dates, commitments and operational actions;
- **Cert Tracker:** on-open/on-demand synchronisation and persistent career intelligence.
