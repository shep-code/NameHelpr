# NameHelpr

## What This Is

A mobile-first app for remembering the names of people you meet. You capture names with the context where you met them (events, places, connector people), then look them up later by searching or browsing that context. Includes a quiz mode to practice names until they're internalized.

## Core Value

Look up someone's name when you remember the context you met them — because you forget names, not contexts.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Quick entry: Add name + context + optional notes (fast, phone-friendly)
- [ ] Search by context: Type context to find names associated with it
- [ ] Browse contexts: See list of all contexts, tap to view associated names
- [ ] Multi-context search: Search multiple contexts, see results grouped by context
- [ ] Quiz mode (context→name): Show context, recall who you met there
- [ ] Quiz mode (name→context): Show name, recall where you met them
- [ ] Learning status: Manually mark names as "learned" when confident
- [ ] Filter quiz to unlearned names only

### Out of Scope

- Photos — keeping it simple, text-based only
- Date tracking — context is the memory anchor, not time
- Multiple contexts per person — keep original meeting context only
- Complex categorization/tagging — freeform text contexts work better
- Desktop-first design — phone is the primary platform

## Context

This solves a real problem: meeting people at events (parties, concerts, social gatherings), exchanging names, and then failing to recall the name later when you see them again. The workaround today is handwritten notes with context like "Paul's Party" or "Jim's Friends." This app digitizes and enhances that workflow.

Usage patterns:
- **Entry**: Right after meeting someone, quick capture on phone
- **Lookup**: Before or during an event, find names by context
- **Practice**: Periodic quizzing to internalize names and reduce app dependency

Volume is low (1-10 new people per month), so data scale isn't a concern.

## Constraints

- **Platform**: Mobile-first (phone is primary, must work well on mobile web or as PWA)
- **Speed**: Entry must be fast — used at events, not at a desk
- **Simplicity**: Minimal fields, freeform contexts, no complex workflows

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One context per person | Simplifies data model; original meeting point is what you remember | — Pending |
| Freeform text contexts | No taxonomy to maintain; natural language like "Paul's Party" | — Pending |
| Manual learning status | User knows when they've internalized a name; no algorithm needed | — Pending |
| Bidirectional quizzing | Real world requires both: seeing someone (need name) and hearing name (need context) | — Pending |

---

## Next Session

- [ ] **Ask user about deploying to Netlify** - gives permanent URL, works without laptop running, better PWA install experience
- [ ] **Discuss Firebase sync** - would allow syncing data across devices with Google sign-in

---
*Last updated: 2026-03-07 after UI redesign*
