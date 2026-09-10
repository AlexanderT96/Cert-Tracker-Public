# Audit remediation — v4.18.0

## v4.18 curriculum-integrity closure

- All 70 role ladders now consume the same normalized certification curriculum used by the certification and roadmap views.
- Every real mapped subject has an ordered study brief and an explicit tutor decision: self-study, conditional escalation, recommended intervention or D5 challenge checkpoint.
- Tutor decisions include the intervention stage, concrete trigger, session goal, evidence to bring and exit condition; credential-level tutor notes remain visible as policy context.
- Negative catalogue labels such as “No scripting required” are no longer presented or counted as learning subjects.
- Career-pathway stages expose subject totals, selective tutor checkpoints and honest reviewed/candidate resource counts instead of raw study prose alone.
- Automated gates now fail if any active route stage lacks its canonical learn → lab → retrieval → tutor escalation → evidence sequence, resource stack or subject-level tutor decision.

## v4.17 evidence-integrity closure

- Separates credential references, discovery searches, external candidates and reviewed teaching resources; none are allowed to impersonate another category.
- Gives all 790 subjects an executable local study brief while keeping derived blueprint mappings visibly provisional.
- Removes unrelated quiz fallback behaviour and raises learning-evidence thresholds; the tracker never labels its internal score as exam readiness.
- Makes workplace evidence, portfolio gaps and urgent market sampling capable of outranking another certification.
- Versions project briefs, retires stale criterion checkmarks and adds environment, effort, budget, starter and validation detail.
- Expands route comparison to five selected alternatives with estimated hours, fees and renewal burden.
- Extends providerless vacancy evidence with work mode, contract type, pay basis, currency and recurring-skill frequency; dependable sampling now requires ten vacancies and five comparable salary observations.
- Adds recurring calendar alarms and notification checks for weekly commitments and career reviews.
- Corrects SC-500 positioning, repairs the BriefCam source route and hardens the official-source checker against HEAD-only false failures.
- Adds a dependency-free npm lockfile and regression coverage for the new integrity boundaries.

## v4.16 adversarial follow-up

| Layer challenged | Improvement |
|---|---|
| Recommendation to execution | Adds one durable weekly commitment with an explicit definition of done. The primary or a same-stage runner-up can be chosen; a second active commitment cannot be created and unfinished work cannot silently disappear. |
| Honest progress | Complete and partial outcomes require a concrete observation or correction. Blocked and deferred work never becomes certification or capability progress. |
| Adaptive follow-through | Partial work carries once; repeated partial progress becomes a smaller diagnostic checkpoint. Time, prerequisite, material and assessment blockers generate bounded, explainable recovery work. |
| Recommendation churn | Active work is preserved when role, evidence or constraints change. The user must explicitly record and replace it, with the old commitment retained in review history. |
| Persistence | Weekly state is deeply validated, capped at 52 reviews and included in existing backup, undo and encrypted-sync state. Personalisation resets preserve substantive execution history. |
| Assessment integrity | Marked questions can no longer be attached to unrelated certification subjects through the API. |
| Market evidence integrity | Vacancy edits now pass the same full validation and duplicate checks as new records; impossible and future observation dates are rejected; even-sized salary samples use a true median. |
| Date boundaries | Review and commitment dates use the user's local calendar day rather than UTC rollover. |
| Offline and mobile | The execution coach is service-worker cached, touch-sized and collapses to a single-column mobile review flow. |

## Pre-deployment development beyond v4.14

| Capability | v4.15 implementation |
|---|---|
| Objective assessment | Adds an original, validated bank of automatically marked scenario questions across networking, security, identity, cloud, Windows, Linux, automation, physical security, architecture and operations. Answers are explained after submission. These are learning checks, not copied vendor exam items. |
| Defensible mastery | Separates marked knowledge from applied self-review, penalises confident misconceptions and withholds a `SUPPORTED` evidence label until at least three marked checks and two applied explanations cover three subjects. A self-rating alone cannot establish mastery. |
| Portfolio portability | Exports the active project, criteria, completion state, evidence notes and artifact link as a local Markdown brief with an explicit redaction warning. |
| Vacancy quality | Normalises source URLs, blocks duplicates and accepts bounded CSV intake without a provider account. Tracking remains local-first. |
| Outcome calibration | Reports application-to-interview and interview-to-offer rates from recorded outcomes and changes guidance when either conversion point is weak. Small samples remain explicitly directional. |

Backup schema 10 adds bounded, validated automatically marked knowledge-check records. Existing v4.14 mentor evidence remains compatible.

Implements the 2 September 2026 audit against v4.8.6 and the subsequent whole-tracker review of the Luna Reserve work. Stable certification and role IDs are retained; existing exam passes are not deleted. Backup schema 10 retains the v4.14 mentor evidence and adds validated, bounded automatically marked knowledge checks.

## Mentor evidence layer

| Remaining gap | v4.14 implementation |
|---|---|
| Adaptive assessment | The weakest due subject is selected automatically. Explain, predict, apply, troubleshoot and transfer prompts rotate, use a five-part rubric and schedule the next review from demonstrated performance. Confident weak answers receive a penalty. |
| Project verification | Every generated portfolio brief now has a persistent criterion-by-criterion review, evidence notes and an optional HTTPS portfolio link. Career-move gates respond to the recorded result. |
| Market access without Adzuna | Users can record sourced vacancies, advertised salary ranges and application outcomes locally. Five current vacancies with three salary samples establish a personal sample; fewer records remain explicitly provisional. |
| Outcome calibration | Saved, applied, interview, offer, rejected and withdrawn outcomes create a local funnel. Recommendations can distinguish catalogue assumptions from evidence of actual employer response. |
| Changed circumstances | Move urgency, budget pressure, workplace evidence opportunities and constraints are saved and included in change explanations. Workplace opportunities replace weaker simulated parallel work. |
| Resource quality | Users can mark material useful, weak or outdated. Useful material rises in the study stack; weak/outdated material is demoted rather than silently treated as equal. |
| Review reminders | Reviews surface as due in the tracker and can be exported as a calendar event. The app still does not claim it can execute continuously while closed. |

## Career-assistant foundation

| Missing capability | Implementation |
|---|---|
| Decisive next move | The dashboard now selects one primary credential/career action, one parallel practical topic and an explicit defer list, with sequencing and evidence reasons. |
| Instructional sequencing | A personalised four-, six- or eight-week plan turns the credential blueprint into weekly learn, retrieve, configure, break/fix, integrate and assess deliverables. |
| Complete projects | Each target route receives a production-plausible project brief with build scope, deliberate faults, six deliverables, six assessment criteria and the current stage exit gate. |
| Route decisions | The chosen route is compared with two plausible alternatives using compatibility, evidence readiness, route progress, remaining distance and honestly labelled market evidence. |
| Market intelligence | Published job data is loaded without blocking local advice. Observed samples are labelled as samples; stale, missing or inadequate data produces no demand or salary claim. |
| Ongoing mentorship | A configurable review cycle records bounded decision snapshots. Changes in passes, evidence, role, study capacity, salary baseline or market-feed reliability explain why the plan changed. |

## Whole-tracker follow-up

| Finding | Repair |
|---|---|
| Expanded career routes created large hidden DOM trees and made Career Options slow or unstable. | All 70 bespoke five-stage routes remain complete but hydrate only when opened. Initial DOM size and per-route completeness are now enforced by browser and model gates. |
| Several career filters, plans and visible routes could drift onto different credential sets. | A single role-route model now drives the Career Options ladder, filter membership and progression state without silently recommending unavailable credentials. |
| The dashboard salary/role evaluator could lose unsaved typing during an asynchronous dashboard rerender. | A transient draft survives rerenders, clears after a successful save or state restore, accepts whole-pound salaries and remains part of backup/sync state only after saving. |
| “Dashboard” overflowed the five-button navigation rail on narrow phones. | Phones below 400 px show the compact label “Home” while retaining the accessible name “Dashboard”; browser tests reject clipped labels and horizontal page overflow. |
| Dense roadmap and role visuals could overlap, render vertically or overload small devices. | Phone layouts stack route stages, simplify large decorative layers, preserve horizontal text, use lazy detail rendering and enforce emblem/text separation across tested breakpoints. |

## Changes

| Audit | Remediation |
|---|---|
| A01 eligibility | Shared eligibility policy excludes retired, in-development and unconfirmed credentials. Planner, recommendation engine, suggested learning and exam-date handler use it. Learning dependencies are separately labelled from formal prerequisites. |
| A02 readiness | Dashboard uses the same 70-role evidence assessment as Career Options. Credential accumulation cannot create an APPLY NOW verdict. Practical scores no longer substitute knowledge for work evidence. |
| A03 freshness | Failed refreshes retain the last successful timestamp and mark degradation. Provider outcomes, per-listing observation times, strict date normalisation and timeouts are explicit. Consumers suppress stale/degraded job matches. |
| A04 Undo | Save wrappers read the previous persisted snapshot; explicit compound changes capture once. Separate rapid changes no longer collapse into the same throttled snapshot. |
| A05 WebDAV | Unbound differing vaults cannot be pushed or smart-synced silently. Existing-vault writes require an exposed ETag, including force writes. Changing endpoints clears prior binding metadata. |
| A06 backup | Current, next and target career roles now round-trip. Context and goal changes emit save events. Sync hashes exclude release metadata/timestamps and are recomputed on remote reads. |
| A07 provenance | Source linkage remains 185/185; fact verification is counted per identity, availability, eligibility, blueprint, renewal and price field. Undated prices and unchecked fields receive no verification credit. Reachability warnings no longer print an all-sources-passed result. |
| A08 empty path | Defaults apply only when no saved path exists. Empty and deliberately excluded paths survive reload; release additions are no longer silently selected. |
| A09 integration | Shared role registry and capability-evidence records drive explorer and dashboard. Legacy career evidence is readable; new edits write canonical evidence and remain exportable. |
| A10 monetary precision | No unsupported current-pay headline without usable salary samples. Remaining bands are explicitly illustrative; monetary uplift, signal-per-hour and ROI presentation removed from the market modal. |
| A11 job coverage | Provider queries derive from the full role registry plus legacy queries. Alias-aware token matching, salary-period/currency requirements, conventional median and strict job dates are tested. |
| A12 compatibility | Interest remains separate from evidence. Role-specific evidence has half the weight, family evidence half. Optional location/work-arrangement filters and self-recorded eligibility barriers are available. Scores are not hiring probabilities. |
| A13 facts/lifecycle | Corrected PCPP2 validity/availability, CJCA name, CISSP Associate terminology and CKS prerequisite wording. Award confirmation, issuer expiry and renewal inputs are available. CNCF CARE dates are modelled; original pass dates are preserved. |
| A14 costs | Employer funding requires user confirmation. Unknown costs are not silently zero. Awards & funding accepts a user-verified total quote. Study hours and catalogue costs remain estimates. |
| A15 validation | Nested career preferences, eligibility, credential records, evidence IDs, dates and labels are validated. Invalid calendar dates do not roll into the next month. |
| A16 loading | Local dashboard renders before the market request finishes. Feed timeout/cache TTL and bounded service-worker network-first fallback prevent indefinite waits. Career search is debounced. Existing flat/opaque mobile header and Dashboard-only pathway placement retained. |
| A17 tests | New isolated audit-regression suite covers the reproduced defects, plus renewal preservation, encryption, salary units, shared evidence and outages. Browser suite adds new contracts. |
| A18 reminders | Correct notification asset path; award controls explain that reminders run when the app opens, not independently in the background. |

## Migration and use

- Export a backup before upgrading or resolving a sync conflict.
- Existing passes are retained. For CISSP/CCSP and application-based awards, confirm the full award in Today → Awards & funding; exam pass alone no longer counts as an active market credential.
- Older backups have no career-context field. Restoring them preserves this device's existing context rather than inventing a remote value.
- Digest semantics have changed. A legacy vault can require explicit reconciliation/Pull before the first new-version sync; do not force-push without first checking both copies. The backup and Undo paths remain available.
- The old 94% number was a provenance heuristic, not factual accuracy. The new, much lower number counts dated checks of individual fact fields. It must not be increased by simply redating the catalogue.
- Unknown-cost certificates require a verified cost or confirmed employer funding before inclusion in a costed plan. Catalogue amounts are not a checkout quote and may omit optional materials or travel.

## Verification and honest limits

The local npm test includes the audit regressions and the existing structural, model, privacy, security, lifecycle and compatibility checks. Real-engine CI is required before merging this release. No real private vault is used by tests.

The following are not claimed complete:

1. **Working live-provider access.** The audited published feed had no jobs and Adzuna credentials were not configured. v4.14 no longer requires a provider: sourced vacancies can be recorded locally and merged into the dashboard. Automated coverage still requires a permitted server-side provider integration; never put provider secrets into the public site.
2. **Exhaustive issuer verification.** All records retain sources, but every price/blueprint/eligibility statement has not been independently verified. The UI now exposes this instead of implying otherwise. SecOT+ booking availability remains unconfirmed and is therefore blocked.
3. **Physical iPhone acceptance.** Automated browser checks are not a substitute for testing the installed PWA and Safari on the affected phone, including cold load, scroll, rotation and modal focus.
4. **Empirical career calibration.** Vacancy and application outcomes now correct the personal recommendation locally, but a small personal sample is not a scientific hiring-probability or salary-uplift model.

## Issuer evidence used for corrections

- [Python Institute PCPP2](https://pythoninstitute.org/pcpp2): in development, five-year validity and no formal prerequisites.
- [CNCF CKS / CKA CARE update](https://www.cncf.io/blog/2026/06/17/expanding-care-passing-cks-can-now-extend-your-cka-certification/): effective 18 June 2026, including previously expired CKA.
- [ISC2 Associate pathway](https://www.isc2.org/certifications/associate) and [mark-use policy](https://www.isc2.org/policies-procedures/member-policies): exam pass and full certification are distinct.
- [HTB CJCA](https://academy.hackthebox.com/preview/certifications/htb-certified-junior-cybersecurity-associate): correct credential title.
- [JSNAD retirement](https://training.linuxfoundation.org/jsnad-cert-inactive/) and [JSNSD retirement](https://training.linuxfoundation.org/jsnsd-cert-inactive/): no longer available to new candidates.
