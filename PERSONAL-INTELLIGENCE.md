# Nexus personal intelligence architecture

Nexus acts as the private local decision surface for a five-pillar intelligence system without storing conversation-derived personal data in this public repository.

## Five pillars

1. **Work & Life Operations** (`OPERATIONS`, Outlook prefix `[WORK]`)
   - commitments, deadlines, meetings, approved leave, follow-ups, schedule risk and direct work actions.
2. **Physical Security & Infrastructure** (`SECURITY`, Outlook prefix `[VENDOR]`)
   - physical-security platforms, infrastructure dependencies, compatibility, security, lifecycle, releases and vendor events.
3. **Career, Certification & Market** (`CAREER`, Outlook prefix `[CERT]`)
   - certification changes, roadmap decisions, UK role-market signals, study resources and career sequencing.
4. **Learning, AI & Capability** (`LEARNING`, Outlook prefix `[TRAINING]`)
   - interactive training, simulations, AI tutors, coding/learning tools, VR/MR study and capability-development opportunities.
5. **Personal Interests & Technology** (`INTERESTS`, Outlook prefix `[GAME]`)
   - games, showcases, releases, gaming technology and personally relevant consumer technology.

The five pillars feed one relevance layer rather than operating as isolated lists.

## Intelligence pipeline

The intended lifecycle is:

`Discover -> Verify -> Understand -> Correlate -> Score -> Decide -> Calendar/Action -> Alert only when necessary -> Learn from outcome`

The calendar is the primary interchange and timeline. Push-style interruption is an exception for urgent or critical state, not the default output.

## Outlook metadata contract

ChatGPT-managed calendar events may place the following compact line at the **start** of the event body so it remains available in Outlook previews:

```text
Intel: Pillar: SECURITY | Relevance: 86 | Urgency: 25 | Confidence: 92 | Goal links: current-role;convergence | Knowledge: LAB
```

Fields:

- `Pillar`: `OPERATIONS`, `SECURITY`, `CAREER`, `LEARNING` or `INTERESTS`.
- `Relevance`: 0-100 personal relevance as assessed by the authorised intelligence workflow.
- `Urgency`: 0-100 time/consequence urgency. High relevance alone does not justify interruption.
- `Confidence`: 0-100 evidence confidence.
- `Goal links`: semicolon/comma-separated generic links such as `current-role`, `next-role`, `convergence`, `network`, `cloud`, `study`, `personal-interest`.
- `Knowledge`: `NONE`, `DOC`, `STUDY`, `LAB`, `TOOLING`, `ROADMAP` or another short generic candidate category.

The existing coordinator metadata may still be used:

```text
Impact: 78 | Action state: OPEN | Next action: Validate fixed build | Dependency: vendor hotfix
```

The final management marker remains:

```text
Managed by ChatGPT Watch: VENDOR | Key: <stable-normalized-key>
```

## Personal relevance model

`src/personal-intelligence.js` treats watch relevance as an external private-context signal and then combines it with browser-local Nexus state:

- current tracker goal;
- current path/phase;
- current certification recommendations;
- target-role competency coverage;
- next-role capability gate;
- action state and deadline proximity from managed Outlook events.

This separation is deliberate. A private assistant can know why an event matters to a particular person; the public application only receives a compact score and generic goal links.

The resulting local `personalScore` drives dashboard ordering and one of four modes:

- `BACKGROUND`
- `CALENDAR`
- `ACTIONABLE`
- `URGENT`

`URGENT` requires both high personal relevance and high urgency. This prevents a globally important but non-actionable announcement from becoming an interruption.

## Knowledge feedback loop

Managed events can carry a generic `Knowledge` candidate. The dashboard can therefore surface reusable lessons from:

- resolved support incidents;
- vendor compatibility investigations;
- certification blueprint changes;
- completed labs or simulations;
- AI/tool evaluations;
- gaming/PC compatibility findings.

Nexus must not automatically write private conversation-derived notes into the public repository. It may present local candidates for the user to convert into tracker evidence, study notes, lab work or documentation.

## Privacy boundary

The public repository contains only the generic five-pillar model, parsers, scoring logic and UI.

It must not contain a named user's employer history, salary, private priorities, conversation history, private evidence or personalised score overrides. Those remain in authorised private context and browser-local state, consistent with `PRIVACY-BOUNDARY.md`.

## Implementation

- `src/personal-intelligence.js` — parses intelligence metadata, combines it with local tracker state and builds five-pillar summaries/priorities.
- `src/personal-intelligence-ui.js` — dashboard view of pillar scores, highest-relevance managed items, local career context and knowledge-feedback candidates.
- `src/account-connections.js` — supplies the live managed Outlook timeline; raw Outlook payloads are not persisted by the intelligence layer.
- `src/recommendation-engine.js` and competency/capability modules — remain the authoritative local career/readiness logic rather than duplicating that logic in the watch layer.
