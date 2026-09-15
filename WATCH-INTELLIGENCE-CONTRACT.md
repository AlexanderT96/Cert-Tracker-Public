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

## Strategy metadata

For material managed events, use a third line:

```text
Strategy: Entity: <stable-entity-id> | Risk: <0-100> | Opportunity: <NONE|DISCOVERED|QUALIFIED|CONSIDERING|WAITING|ACTIONABLE|COMMITTED|COMPLETED|REJECTED> | Decision: <NONE or stable-decision-id> | Expiry: <NONE or YYYY-MM-DD> | Review: <NONE or YYYY-MM-DD> | Money: <UNKNOWN or GBP-number> | Hours: <UNKNOWN or number> | Proof: <NONE|REQUIRED|EVIDENCED> | Contradiction: <NONE|OPEN|RESOLVED> | Trigger: <semicolon-separated follow-up ids>
```

Use `UNKNOWN`, not zero, when money or time is unknown. `Risk` is persistent exposure/severity and is not the same thing as notification urgency. `Decision` stays stable while a recommendation evolves. `Review` is the date the active assumption should be revalidated. Historical events may use `PAST` and conservative Strategy defaults rather than invented values.

## 1. Longitudinal intelligence threads

Group related events into a persistent dossier rather than isolated findings. Track storyline state, predecessor/successor stages, unresolved questions, current recommendation and next validation point.

Examples include `axis-os-13`, `milestone-app-platform`, `cisco-ccna-current-generation`, `tryhackme-3d-learning` and `witcher-4`. Do not merge genuinely distinct projects simply because they share a vendor or franchise.

## 2. Prediction and calibration

Forecast only when evidence supports a useful prediction. Facts and forecasts must be visibly separate. A forecast starts `PENDING` and later becomes `CONFIRMED`, `PARTIAL`, `MISSED` or `SUPERSEDED`. Never rewrite an old forecast to make it look correct. Do not forecast merely to populate metadata; use `NONE` when prediction has no decision value.

## 3. Source reliability ledger

Rate evidence fitness for the exact claim, not the prestige of a source in general. Consider primary authority, historical accuracy for the claim type, placeholder/stale-date behaviour, direct evidence, reproducibility, recency and agreement with other authoritative sources. Repeated confirmed or missed claims should adjust the internal reliability history for that source and claim type.

## 4. Adaptive personal relevance

Personal relevance is contextual, not global importance. Use current role/life impact, career direction, capability gaps, active roadmap, known interests, owned/used technology, actionability, opportunity cost and timing. Behaviour and outcomes should tune future relevance. Do not infer disinterest from absence of a click alone.

## 5. Attention and opportunity-cost budget

Every actionable opportunity has an attention cost. Use study time, switching cost, setup burden, deadline pressure, financial cost and displacement of current priorities. Aggregate states are `LIGHT`, `BALANCED`, `HEAVY` and `OVERLOADED`. When load is high, recommend what to defer or ignore rather than only adding new actions.

## 6. Cross-pillar causal graph

Record causal/dependency links only when evidence supports them. Correlation alone is not causation. Useful chains include upstream infrastructure change -> product compatibility -> customer guidance -> lab/documentation update, or market shift -> capability priority -> certification sequence -> training resource.

## 7. Outcome learning and decision review

After material actions or milestones, compare the original recommendation or forecast with the observed outcome. Record what happened, whether the action was useful, what assumption was correct/incorrect, whether relevance/source confidence/roadmap logic should change, and any knowledge candidate. Time passing is not outcome evidence.

## 8. Historical pattern detection

Use reconstructed calendar history to detect repeated patterns only after multiple independent observations: release cadence, problematic firmware branches, hotfix timing, exam refresh intervals, retirement/replacement patterns, repeated launch delays, showcase periods, voucher cycles or recurring workload clusters. State `OBSERVED PATTERN`, never present a forecast as fact.

## 9. Strategic horizons

Every active signal belongs to one primary horizon: `TODAY`, `7D`, `30D`, `90D`, `12M`, `LONG` or `PAST`. Urgent operations should not compete directly with long-term strategy. Promote long-term items into short-term attention only when an action window opens.

## 10. Evidence packs

Create compact decision packs for high-cost, high-risk, high-relevance or hard-to-reverse decisions. Include the decision/question, recommendation, relevance/urgency, authoritative and corroborating sources, conflicting evidence, timeline, forecast/calibration, dependencies, alternatives/opportunity cost, next action/validation and evidence that would reverse the recommendation.

## 11. Change-impact simulation

Before recommending a material change, simulate the likely downstream effects across connected threads and pillars. Model what is known separately from what is estimated.

Examples:

- starting a new certification now -> attention/switching cost -> delay pressure on the current core target -> downstream roadmap impact;
- deploying a vendor release -> compatibility dependencies -> customer workflows -> lab/documentation actions;
- buying/adopting a tool -> money/time/setup burden -> displaced study/work priorities -> expected capability gain.

Do not invent precise schedule delays, money savings or probability changes when inputs are unknown. Prefer ranges or directional consequences. A simulation should identify the most sensitive assumption and what evidence would change the result.

## 12. Scenario planning

Maintain a small set of competing strategic scenarios rather than a single unquestioned future. Scenarios should be privacy-safe descriptions such as:

- `OPERATIONAL_STABILITY`: protect current commitments and reduce risk;
- `CORE_PATH_ACCELERATION`: maximise progress on the highest-value active capability path;
- `STRATEGIC_OPTIONALITY`: preserve credible adjacent opportunities without derailing the core;
- domain-specific alternatives when evidence warrants them.

Score scenarios from current risks, opportunities, capability gaps, market evidence, attention load and known constraints. The scores are comparative decision aids, not predictions of career outcomes. Re-rank scenarios only when evidence materially changes.

## 13. Persistent risk register

Maintain risks independently of calendar urgency. Each material risk should have a stable entity/thread, likelihood or evidence strength, consequence, current score, mitigation, dependency, owner where known and next review date.

Typical risk classes include:

- operational/customer impact;
- security/exploitation;
- compatibility/dependency;
- certification/version retirement;
- roadmap fragmentation;
- workload/attention overload;
- product/platform EOL;
- cost/subscription creep;
- access/deadline loss;
- technical compatibility or save/account risk.

Risks move `OPEN -> MITIGATING -> MONITORING -> RESOLVED` only with evidence. A resolved historical risk remains useful context but should not keep current urgency.

## 14. Opportunity pipeline

Track valuable opportunities through a durable lifecycle:

`DISCOVERED -> QUALIFIED -> CONSIDERING -> WAITING -> ACTIONABLE -> COMMITTED -> COMPLETED / REJECTED`

Examples include certification betas/vouchers, training trials, useful tools, role-market openings, game betas/playtests or time-limited access. Qualification should consider personal relevance, readiness, attention cost, economics, deadline and displacement of existing priorities. An attractive opportunity can remain `WAITING` or be `REJECTED` because the opportunity cost is too high.

## 15. What-changed-my-plan audit trail

Whenever a recommendation, roadmap state, deployment guidance or priority materially changes, preserve a short immutable decision-change record:

`previous recommendation -> new recommendation -> triggering evidence -> date -> confidence`

Do not silently overwrite the reason a decision changed. Multiple changes should form a history so later monthly reviews can answer what actually altered the plan.

## 16. Counterfactual analysis

For significant choices, compare at least the realistic action against the strongest alternative. Common shapes:

- `DO NOW` vs `DEFER`;
- `SWITCH` vs `STAY`;
- `DEPLOY` vs `PILOT/HOLD`;
- `BUY/ADOPT` vs `WAIT`;
- `COMMIT` vs `REJECT`.

Compare expected benefit, risk, attention, money, time, dependency effects, reversibility and information value. Do not manufacture a false numerical winner when evidence is qualitative.

## 17. Personal baseline monitoring

Maintain local baselines for the decision system itself: attention load, open actions, active risk count/severity, actionable opportunities, overdue/review-due decisions, study/commitment density when known, source-confidence health and unresolved contradictions.

Compare current state with recent 7-day and 30-day baselines. Surface meaningful drift such as rising overload, growing unresolved actions, repeated schedule compression or falling confidence. Do not interpret ordinary day-to-day variance as a problem.

## 18. Entity dossiers

Maintain persistent dossiers for important entities such as vendors, products, platforms, certifications, providers, tools, franchises/projects and relevant technologies. A dossier should summarise:

- current state;
- associated storylines and recent material events;
- open risks/opportunities/decisions;
- source-confidence health;
- causal/dependency neighbours;
- important historical milestones;
- next expected/review point.

Entity dossiers are indexes over existing evidence, not new claims.

## 19. Confidence decay

Active assumptions become stale unless revalidated. Apply decay to *effective* confidence based on claim type, source freshness and next-review state.

- confirmed historical facts do not decay simply because they are old;
- active compatibility/guidance assumptions decay faster than durable historical facts;
- an official future date remains authoritative until the source changes, is contradicted or passes without validation;
- unresolved forecasts and weak signals should decay if supporting evidence goes quiet;
- revalidation restores confidence based on new evidence rather than resetting automatically to 100.

A stale high-impact assumption should enter the review queue before it silently drives a decision.

## 20. Contradiction queue

Unresolved conflicts between reputable sources, versions or states should become durable `OPEN` contradictions rather than being buried in prose. Record the conflicting claims, source fitness, affected decision/event and next recheck point. Do not perform unsafe calendar mutation or recommendation changes while a material contradiction is unresolved unless one source is clearly authoritative for the exact claim. Mark `RESOLVED` only with evidence and preserve the resolution reason.

## 21. Weak-signal detection

Aggregate several individually modest signals when they point in the same direction. Require multiple observations and, where possible, independent source/entity evidence. Label the result `WEAK SIGNAL` and keep it separate from confirmed facts.

Examples include repeated vendors shifting toward cloud-managed architecture, several UK roles converging on the same skill pairing, repeated hints around a project, or several minor compatibility reports showing the same pattern. Weak signals may create a monitoring trigger or scenario adjustment but should not create a high-confidence action by themselves.

## 22. Trigger chains

A material event may generate bounded follow-up checks across the relevant graph. Examples:

- vendor release -> compatibility -> security -> certification content -> lab/guidance;
- exam blueprint change -> resources -> labs -> roadmap -> booking/version decision;
- game reveal -> first gameplay -> platform/specs -> beta/access -> release quality;
- AI/platform release -> UK availability -> privacy/access -> learning workflow -> trial outcome.

Triggers must be specific, deduplicated and terminate when resolved/superseded. Do not create endless polling branches.

## 23. Decision expiry

Recommendations and assumptions have shelf lives. A material decision should carry an `Expiry` or `Review` date when evidence may change. At review/expiry, re-evaluate the decision rather than treating the old recommendation as permanent.

Examples: `WAIT FOR REVIEWS` expires when review evidence exists; `HOLD DEPLOYMENT` expires when a fixed build/support advisory changes state; `WAIT FOR EXAM VERSION` expires at a cutover/deadline; `WAIT FOR PATCH` expires when the patch is verified.

## 24. Action proof

Material actions should not become complete solely because a date passed. Where `Proof: REQUIRED`, completion requires evidence appropriate to the action: exam pass/result, successful lab output, vendor fix verification, registration confirmation, migration completion, tested configuration, resolved incident or equivalent. A task marked done without required proof becomes `UNVERIFIED COMPLETE` / `NEEDS REVIEW`, not silently completed.

## 25. Personal economics layer

When decision-relevant and known, account for money and time: exam/training price, voucher savings, subscription/renewal burden, hardware requirements, purchase/upgrade costs, setup/study hours and repeated annual costs. Keep one-off and recurring costs distinct in prose/evidence packs.

Never invent costs or convert `UNKNOWN` to zero. Expected career/productivity value may be qualitative when hard evidence is unavailable. Economics should inform opportunity cost, not override safety, readiness or core-path coherence.

## 26. Monthly intelligence review

On the first useful review cycle of each calendar month, produce one strategic review only when there is meaningful data. The review should cover:

- what materially changed across all five pillars in the previous month;
- the most important storyline state changes;
- risks opened/raised/reduced/resolved;
- opportunities advanced/rejected/completed;
- decisions that changed and why;
- forecast calibration and notable misses;
- source/contradiction health;
- attention/baseline drift;
- personal economics where known;
- outcome-learning lessons;
- scenario ranking changes;
- the highest-leverage focus for the coming month and what can safely be ignored.

The monthly review is a synthesis, not a dump of every calendar entry. Routine healthy state remains silent unless the user has explicitly requested a monthly delivery.

## Historical calendar behaviour

Historical backfill must be useful, selective and silent.

- preserve original publication/release/effective dates;
- no reminders for historical informational entries;
- Free calendar status unless the entry represents a genuine past commitment;
- retrofit existing managed entries instead of duplicating them;
- never fabricate personal/work history;
- prioritise durable lifecycle stages and causal/storyline value over volume;
- add Strategy metadata conservatively to useful historical entries;
- historical entries may inform entity dossiers, patterns, risk history and decision context;
- old urgency must not generate a present-day alert unless the underlying state is still active.
