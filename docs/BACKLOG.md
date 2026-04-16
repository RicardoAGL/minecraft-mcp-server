# Backlog — Minecraft MCP Data Modeling Series

**North star**: Produce 5 LinkedIn/YouTube data modeling video episodes using Minecraft item
sorters as visual metaphors, with Claude Code controlling the bot via MCP.

**Stack**: TypeScript, Node.js, mineflayer, MCP SDK  
**Package manager**: npm  
**Root**: `~/Desktop/github/minecraft-mcp-server`  
**Fork**: `RicardoAGL/minecraft-mcp-server` (upstream: `yuniko-software/minecraft-mcp-server`)

---

## Progress Board

| # | Ticket | Status | Commit |
|---|--------|--------|--------|
| 1 | M0: Merge chore/security-note into main | TODO | — |
| 2 | M0: Merge feat/sign-and-fill-tools into main | TODO | — |
| 3 | M1: Install and configure Replay Mod | TODO | — |
| 4 | M1: Define episode template (shots, narration, blog) | TODO | — |
| 5 | M1: Test full recording pipeline end-to-end | TODO | — |
| 6 | E1: Design normalization demo build plan | TODO | — |
| 7 | E1: Build Episode 1 live with bot | TODO | — |
| 8 | E1: Write Episode 1 narration script (Ollama) | TODO | — |
| 9 | E1: Record Episode 1 with Replay Mod | TODO | — |
| 10 | E1: Publish Episode 1 (LinkedIn post + blog section) | TODO | — |
| 11 | E2: 1NF/2NF/3NF three-build series | BACKLOG | — |
| 12 | E3: Star schema (fact chest + dimension arms) | BACKLOG | — |
| 13 | E4: Data Vault (hubs, links, satellites) | BACKLOG | — |
| 14 | E5: OLTP vs OLAP | BACKLOG | — |
| 15 | M7: Satisfactory feasibility assessment | BACKLOG | — |

Statuses: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED` | `BACKLOG` | `SKIPPED`

---

## Ticket Details

### Ticket 1: M0 — Merge chore/security-note into main
- **What**: Run pr-review + security-expert agents on `chore/security-note`, get approval, merge to main
- **Files**: README.md, package-lock.json (already committed on branch)
- **Verify**: `git log --oneline main | head -3` shows security-note commit
- **Commit**: already done on branch — merge commit only
- **Depends**: none
- **Context**: Branch documents the axios vulnerability chain; safe for offline/LAN use

### Ticket 2: M0 — Merge feat/sign-and-fill-tools into main
- **What**: Run pr-review + security-expert on `feat/sign-and-fill-tools`, merge to main
- **Files**: src/tools/sign-tools.ts, block-tools.ts, main.ts, tests/sign-tools.test.ts
- **Verify**: `npm test` passes (125 tests); `npm run build` clean
- **Commit**: already done on branch — merge commit only
- **Depends**: Ticket 1
- **Context**: Adds place-sign, read-sign, fill-region — core tools for demo builds

### Ticket 3: M1 — Install and configure Replay Mod
- **What**: Download and install Replay Mod for Minecraft Java Edition 1.21.x; verify recording works
- **Files**: n/a (game client setup, not code)
- **Verify**: Can start a recording, play back, and export a clip
- **Commit**: n/a
- **Depends**: Ticket 2
- **Context**: Replay Mod (https://replaymod.com) captures server-side replay; lets us re-render
  from any camera angle post-session. Required before building any episode content.

### Ticket 4: M1 — Define episode template
- **What**: Document the repeatable structure for each episode: build sequence, camera shots,
  narration script format, LinkedIn post template, blog section format
- **Files**: docs/EPISODE-TEMPLATE.md (new)
- **Verify**: Template covers: hook (30s), concept explanation, build demo, takeaway, CTA
- **Commit**: `docs(episodes): add repeatable episode production template`
- **Depends**: Ticket 3
- **Context**: Use Ollama to draft the template; edit manually. Drives consistency across all 5 episodes.

### Ticket 5: M1 — Test full recording pipeline end-to-end
- **What**: Two-phase test. Phase A validates tools without Minecraft. Phase B is the live session.
- **Files**: n/a (live test session — notes in docs/session-notes/)
- **Verify**: All 3 new tools visible in Inspector (Phase A); place-sign writes readable text in-game (Phase B)
- **Commit**: n/a (or `chore(test): add scratch session notes` if worth keeping)
- **Depends**: Tickets 3, 4
- **Context**:
  - **Phase A — MCP Inspector (no Minecraft needed, do this first):**
    `npx @modelcontextprotocol/inspector node ~/Desktop/github/minecraft-mcp-server/dist/main.js`
    Verify place-sign, read-sign, fill-region tool schemas load and descriptions render correctly.
    Catches wiring bugs before wasting a game session.
  - **Phase B — Live in-game:** World open to LAN port 25565, Replay Mod active.
    `/give ClaudeBot oak_sign 32 stone 64 barrel 16` before starting.
    If tools fail in-game, file issues on feat/fix branches before retrying.

### Ticket 6: E1 — Design normalization demo build plan
- **What**: Plan the exact block layout for Episode 1: the "chaos chest" (everything in one place)
  and the "normalized sorters" (separate lanes per item category). Specify coordinates, sign text,
  hopper routing, and narration beats.
- **Files**: docs/episodes/e1-normalization/build-plan.md (new)
- **Verify**: Build plan reviewed, coordinates chosen, sign labels defined
- **Commit**: `docs(e1): add Episode 1 normalization build plan`
- **Depends**: Ticket 5
- **Context**: The "chaos chest" is a single unlabeled barrel with mixed items.
  The "normalized" version has 3-4 labeled barrels (tools / food / materials / misc).
  Signs label each barrel with the "table name". Hoppers show data flowing into the right lane.

### Ticket 7: E1 — Build Episode 1 live with bot
- **What**: Use the MCP tools (fill-region, place-sign, place-block) to construct both builds
  in-game per the build plan. Bot narrates via send-chat as it builds.
- **Files**: n/a (live session)
- **Verify**: Both builds visible and labeled in-game; screenshots captured
- **Commit**: n/a
- **Depends**: Ticket 6
- **Context**: Give bot: oak_sign x32, barrel x16, stone x64, hopper x16 via /give.
  Use creative mode. Bot should announce each step via send-chat for the recording.

### Ticket 8: E1 — Write Episode 1 narration script (Ollama)
- **What**: Use Ollama (llama3.2 or similar) to draft a 90-120 second narration script explaining
  why normalization matters, tied to the visual of the chaos chest vs organized sorters
- **Files**: docs/episodes/e1-normalization/narration-script.md (new)
- **Verify**: Script reviewed, fits 90-120s spoken aloud, concept is clear to non-technical audience
- **Commit**: `docs(e1): add Episode 1 narration script`
- **Depends**: Ticket 6
- **Context**: Use Ollama for first draft (token-free). Edit manually.
  Target: data professionals on LinkedIn, not necessarily coders.

### Ticket 9: E1 — Record Episode 1 with Replay Mod
- **What**: Re-run the build session with Replay Mod active; export a clean recording with the
  narration script as timing reference
- **Files**: n/a (video file)
- **Verify**: Recording exported; key moments (chaos, normalization reveal) visible
- **Commit**: n/a
- **Depends**: Tickets 7, 8
- **Context**: Replay Mod lets us re-shoot from any angle after the fact.
  Aim for 60-90 seconds final cut. No music yet (add in post if needed).

### Ticket 10: E1 — Publish Episode 1
- **What**: Write LinkedIn post with the recording embedded + a blog section for future long-form
  use. Publish on LinkedIn.
- **Files**: docs/episodes/e1-normalization/linkedin-post.md (new)
- **Verify**: Post live on LinkedIn; blog section committed
- **Commit**: `docs(e1): add Episode 1 LinkedIn post and blog section`
- **Depends**: Ticket 9
- **Context**: LinkedIn video limit: 10 min. Aim for 60-90s. Hook in first 3 lines (no "see more").
  CTA: "What concept should I explain next?" to drive episode 2 selection.

### Ticket 11: E2 — 1NF/2NF/3NF three-build series (BACKLOG)
- **What**: Three progressive sorter builds, each more specific. Show functional dependency
  by following hopper chains.
- **Depends**: Ticket 10
- **Context**: Scope TBD after E1 retro. May split into 3 separate tickets per build.

### Ticket 12: E3 — Star schema (BACKLOG)
- **What**: Central fact chest (orders/sales) fed by 4 dimension sorter arms (product, customer,
  date, location). One hopper path per dimension.
- **Depends**: Ticket 11

### Ticket 13: E4 — Data Vault (BACKLOG)
- **What**: Hub chests (business keys), link chests (relationships), satellite chests
  (descriptive attributes named by date). Show immutability by never removing chests.
- **Depends**: Ticket 12

### Ticket 14: E5 — OLTP vs OLAP (BACKLOG)
- **What**: Live row-by-row sorter (OLTP) vs nightly batch sweep into a summary barrel (OLAP).
- **Depends**: Ticket 13

### Ticket 15: M7 — Satisfactory feasibility assessment (BACKLOG)
- **What**: Evaluate Ficsit-Remote-Monitoring mod API. Determine if a Satisfactory MCP server is
  buildable and what it would cover (pipelines, splitters = fan-out, mergers = aggregation).
- **Depends**: Ticket 10 (after E1 proves the format works)
- **Context**: Phase 2 only if Minecraft series succeeds. See minecraft-mcp memory file.
