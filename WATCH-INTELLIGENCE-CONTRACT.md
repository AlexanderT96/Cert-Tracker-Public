# Watch Intelligence Contract

This file defines the shared reasoning contract used by the five-pillar personal intelligence system. It is generic and privacy-safe. Private user context remains in authorised assistant context and browser-local state.

## Core pipeline

`Discover -> Verify -> Understand -> Correlate -> Score -> Decide -> Calendar/Action -> Alert only when necessary -> Review outcome -> Learn`

The calendar is the primary intelligence timeline. Immediate notification is exceptional.

## Five pillars

- `OPERATIONS` / `[WORK]`
- `SECURITY` / `[VENDOR]`
- `CAREER` / `[CERT]`
- `LEARNING` / `[TRAINING]`
- `INTERESTS` / `[GAME]`

## Required first-line metadata

Managed event bodies begin with:

```text
Intel: Pillar: <pillar> | Relevance: <0-100> | Urgency: <0-100> | Confidence: <0-100> | Goal links: <generic;links> | Knowledge: <NONE|DOC|STUDY|LAB|TOOLING|ROADMAP>
```

## Next-generation metadata

Where useful, the second line should be:

```text
NextGen: Thread: <stable-thread-id> | Forecast: <NONE or LABEL@probability> | Source: <0-100> | Attention: <0-100> | Outcome: <NA|PENDING|CONFIRMED|PARTIAL|MISSED|SUPERSEDED> | Horizon: <TODAY|7D|30D|90D|12M|LONG|PAST> | Causal: <semicolon-separated parent-thread-ids>
```

`Thread` must remain stable across announcement, release, delay, breakage, fix and retrospective entries for the same durable storyline.

## 1. Longitudinal intelligence threads

Group related events into a persistent dossier rather than isolated findings. Track the storyline state, predecessor/successor stages, unresolved questions, current recommendation and next validation point.

Examples:

- `axis-os-13`
- `milestone-app-platform`
- `cisco-ccna-current-generation`
- `tryhackme-3d-learning`
- `witcher-4`

Do not merge genuinely distinct projects simply because they share a vendor/franchise.

## 2. Prediction and calibration

Forecast only when evidence supports a useful prediction. Facts and forecasts must be visibly separate.

Record a short forecast label plus probability, for example:

- `DELAY@35`
- `PATCH_WITHIN_14D@70`
- `EXACT_DATE_WITHIN_90D@55`
- `EXAM_REFRESH_WITHIN_12M@65`

A forecast starts `PENDING`. Later mark `CONFIRMED`, `PARTIAL`, `MISSED` or `SUPERSEDED`. Never rewrite an old forecast to make it look correct. Calibration is based on resolved forecasts.

Do not forecast merely to populate the field. Use `NONE` when prediction has no decision value.

## 3. Source reliability ledger

Rate the evidence supporting the event, not the prestige of the source in general.

Consider:

- primary authority for the exact claim;
- historical accuracy for this type of claim;
- placeholder/stale-date behaviour;
- direct evidence vs quoting another source;
- reproducibility for technical faults;
- recency and consistency with other authoritative documents.

An official marketing page can be weaker for a security-known-issue claim than an official PSIRT or support advisory. A store can be authoritative for availability while unreliable for placeholder dates.

Repeated confirmed/missed claims should adjust the internal reliability history for that source and claim type.

## 4. Adaptive personal relevance

Personal relevance is contextual, not global importance.

Use current role/life impact, career direction, capability gaps, active roadmap, known interests, owned/used technology, actionability, opportunity cost and timing. Behaviour/outcomes should tune future relevance:

- acted on / explicitly valuable -> raise similar signals;
- repeatedly ignored/dismissed -> lower similar low-urgency signals;
- snoozed -> lower immediate urgency, not long-term relevance;
- recommendation proved useful -> increase confidence in that class of recommendation;
- recommendation proved poor -> inspect the assumption rather than simply lowering all related topics.

Do not infer disinterest from absence of a click alone.

## 5. Attention and opportunity-cost budget

Every actionable opportunity has an attention cost. Use study time, switching cost, setup burden, deadline pressure, financial cost and displacement of current priorities.

When aggregate load is high, recommend what to defer or ignore. A useful new opportunity should not automatically displace a more valuable active goal.

States:

- `LIGHT`
- `BALANCED`
- `HEAVY`
- `OVERLOADED`

## 6. Cross-pillar causal graph

Record causal/dependency links only when evidence supports them. Examples:

`windows-server-change -> xprotect-compatibility -> customer-guidance -> lab-update`

`uk-market-shift -> capability-gap-priority -> certification-sequence -> training-resource`

`quest-platform-change -> learning-tool-availability -> study-workflow`

Correlation alone is not causation. Mark unresolved links explicitly when a suspected dependency is not yet proven.

## 7. Outcome learning and decision review

After material actions or milestones, compare the original recommendation with the observed outcome.

Review:

- what was predicted/recommended;
- what happened;
- whether the action was useful;
- what assumption was correct/incorrect;
- whether relevance/source confidence/roadmap logic should change;
- any knowledge candidate generated.

Time passing is not outcome evidence.

## 8. Historical pattern detection

Use reconstructed calendar history to detect repeated patterns such as:

- release/update cadence;
- repeated problematic firmware branches;
- recurring hotfix timing;
- exam refresh intervals;
- retirement/replacement patterns;
- repeated launch delays;
- recurring showcase/announcement periods;
- voucher/promotion cycles;
- recurring workload/deadline clusters.

Require multiple independent historical observations. State `OBSERVED PATTERN`, never present a forecast as fact.

## 9. Strategic horizons

Every active signal belongs to one primary horizon:

- `TODAY`
- `7D`
- `30D`
- `90D`
- `12M`
- `LONG`
- `PAST`

Urgent operational issues should not compete directly with long-term career strategy. The coordinator should maintain separate horizon views and only promote long-term items into short-term attention when an action window opens.

## 10. Evidence packs

Create a compact decision pack for genuinely important decisions rather than ordinary news.

An evidence pack contains:

- decision/question;
- current recommendation;
- personal relevance and urgency;
- authoritative sources;
- important secondary/corroborating evidence;
- conflicting evidence;
- historical thread/timeline;
- forecast and calibration status if present;
- dependencies/causal links;
- alternatives/opportunity cost;
- next action;
- next validation point;
- what evidence would reverse the recommendation.

Evidence packs are warranted for high-cost, high-risk, high-relevance or hard-to-reverse decisions. They should not be created for every calendar item.

## Historical calendar behaviour

Historical backfill must be useful, selective and silent.

- preserve original publication/release/effective dates;
- no reminders for historical informational entries;
- Free calendar status unless the entry represents a genuine past commitment;
- retrofit existing managed entries instead of duplicating them;
- never fabricate personal/work history;
- prioritise durable lifecycle stages and causal/storyline value over volume;
- historical entries may inform current reasoning, but old urgency must not generate a present-day alert unless the underlying state is still active.
