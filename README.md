# ClawSwarm Nexus

ClawSwarm Nexus is a real-time multi-agent concierge that can plan, negotiate, call, and confirm an outing for you while you watch every decision happen live.

Instead of showing a single chatbot response, ClawSwarm exposes the entire mission layer:
- a Planner agent that breaks the request into executable steps
- a Research agent that finds candidate venues
- a Call agent that handles voice bookings
- a Negotiation agent that optimizes price and tradeoffs
- a Scheduler agent that assembles the final itinerary

The result is a dashboard-native orchestration system where the user can see agent state, timeline events, live call transcripts, SMS updates, reasoning traces, memory, and the final optimized mission summary as the mission unfolds.

## Why This Project Feels Novel

Most AI assistants stop at recommendations. ClawSwarm Nexus is built around execution.

This project combines:
- a cinematic frontend that visualizes multi-agent coordination in real time
- a Node.js orchestration backend that emits dashboard-native events over WebSocket
- telephony and SMS infrastructure for real outbound action
- voice-cloned calling support for human-sounding reservations
- simulation mode for reliable demos without destroying the live integration path

That combination makes it feel less like a chatbot and more like an operational control room for autonomous consumer agents.

## Hackathon Positioning

This repo is optimized for hackathon demos and judging:
- clear real-time UI with visible agent collaboration
- sponsor-friendly integrations: Telnyx, ClawdTalk, Resemble AI
- a full-stack architecture rather than a frontend-only mock
- deterministic simulation mode for demo reliability
- live-call and SMS hooks for real-world proof points
- an OpenClaw-compatible skill entrypoint for ecosystem alignment

If you need one line for a demo pitch:

> ClawSwarm Nexus is an agentic concierge command center that can actually make the calls, send the texts, and negotiate the plan while the user watches the swarm think in real time.

If you need one line for the technical moat:

> The wow factor is Feature 10: Skill Genome, a MetaClaw-inspired learning loop where every failed mission becomes a reusable skill with measurable lift, turning the swarm into a system that gets provably better over time.

## Core Features

### Real-time Mission Control
- Live agent status updates
- Chronological mission timeline
- Explainability and memory panels
- SMS log and live call transcript view
- Final summary with optimization and savings breakdown

### Autonomy Ladder + Approval Wallet (Feature 1)
- Three user-selectable modes: **Suggest Only**, **Confirm Before Booking**, and **Auto-Book**
- Auto-Book mode respects configurable constraints: max budget, latest time, minimum confidence
- Constraint violations automatically fall back to manual confirmation
- SMS-based approval flow: users can reply CONFIRM or MODIFY from their phone

### Verified Source Graph (Feature 3)
- Every agent reasoning card shows source provenance with labels, type, freshness, and verification status
- Sources tagged as `web`, `api`, `cache`, or `sms` with `live` or `cached` freshness indicators
- Verified vs unverified badges so users can gauge trustworthiness at a glance
- Explainability panel displays alternatives considered and confidence scores

### Merchant Copilot + Reverse Offers (Feature 7)
- Venues receive real SMS booking requests via Telnyx in live mode
- Merchants can reply: ACCEPT, counter-offer with a new time, offer a discount, or push a promo code
- Intelligent SMS parser classifies responses into `accept`, `counter`, `offpeak`, or `promo` offer types
- Configurable timeout (default 30s) marks the request for manual follow-up if the merchant doesn't respond
- Graceful fallbacks for missing phone numbers and SMS delivery failures
- Simulation mode rotates through all four offer types for demo coverage
- Merchant offers displayed in a dedicated UI panel with status tracking

### Shadow Mission Twin (Feature 8)
- Launches parallel simulated timelines before a live mission is committed
- Compares multiple futures across cost, confidence, speed, and risk
- Lets the user pick a preferred path and immediately launch that timeline
- Preserves research context so the selected path starts with minimal extra latency
- Makes tradeoffs visible instead of forcing users to trust a single opaque recommendation

### Relationship-Aware Voice Negotiator (Feature 9)
- Stores venue-specific relationship memory across calls
- Tracks call count, success rate, detected language, preferred tone, and timing preferences
- Surfaces venue intelligence directly in the dashboard
- Lets the call/negotiation layer reuse business-specific tactics instead of starting from zero every mission
- Supports multilingual and venue-adaptive behavior for future live-call strategies

### Skill Genome / MetaClaw-Inspired Learning Loop (Feature 10)
Feature 10 is the core technical moat of ClawSwarm Nexus.

- Turns failures and recoveries into reusable skills with measurable lift
- Organizes learned tactics into generations
- Shows usage count, category, and observed improvement directly in the UI
- Supports replay and mission comparison workflows so teams can demonstrate how the swarm improves over time
- Includes OMLS-style background consolidation hooks for between-mission optimization

Why this matters:
- most voice agents stay static and repeat the same mistakes forever
- ClawSwarm converts failures into reusable behavioral upgrades
- each learned tactic is visible, attributable, and tied to measured improvement
- that makes the system defensible as infrastructure, not just a polished demo

### Backend Orchestration Engine
- Express HTTP API for mission control
- WebSocket event stream for frontend hydration
- Single source of truth mission state
- Interrupt flow for mid-mission user changes

### Telephony + Messaging
- Telnyx SMS send/receive integration
- Telnyx webhook parsing for `CONFIRM` and `MODIFY`
- Merchant inbound SMS webhook with sender validation
- ClawdTalk adapter for outbound call workflows
- Realistic call transcript streaming to the dashboard

### Voice
- Resemble AI voice clone scaffolding
- Resemble speech clip generation support
- Fallback simulation path when live credentials are unavailable

### Demo Reliability
- Hybrid research with seeded fallback data
- Backend-owned simulation mode instead of frontend `setTimeout()` mocks
- Same event contract for live and simulation missions

## Live Demo Checklist

Before recording a live-mode demo, verify these credentials and integrations:

1. `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` for LLM calls
2. `TELNYX_API_KEY` and `TELNYX_PHONE_NUMBER` for SMS
3. `CLAWDTALK_API_KEY` for real voice calls
4. `RESEMBLE_API_KEY` for voice cloning
5. `USER_PHONE_NUMBER` for receiving approval and confirmation SMS

Recommended pre-recording steps:
- Turn the Demo toggle off if you want a true live-mode recording
- Run one warm-up mission before recording so the providers and connections are already hot
- Verify your phone can receive the approval SMS path you plan to show
- Keep one backup mission ready in case a venue or provider path is slow during recording

## Hackathon Demo Script (5 Minutes)

This is a suggested live-mode script for recording the hackathon demo video.

### [0:00-0:25] Intro

> This is ClawSwarm Nexus — an open-source, production-ready multi-agent AI system that makes real phone calls and sends real SMS on your behalf using ClawdTalk and Telnyx. You give it a mission, and a swarm of 5 specialized agents handles everything — from research to live calls to cost optimization. Everything you're about to see is happening in real time — no simulation.

### [0:25-0:50] Dashboard Tour

> Here's the dashboard. On the left — our 5 agents: Planner, Research, Call, Negotiation, and Scheduler. Each one lights up as it activates. Center — the mission timeline showing every step live. Right side — real call transcripts, SMS log, and the explainability panel showing exactly why the AI made each decision.

### [0:50-1:15] Autonomy Ladder

Suggested actions:
- Click `Auto-Book`
- Set budget to `$150`
- Set confidence threshold to `80%`

Suggested narration:

> Users control how much autonomy the system gets. Suggest Only — just research, no calls. Call and Confirm — agents make real calls but pause for your approval. Auto-Book — fully autonomous, but with budget and time guardrails.
>
> I've set a $150 budget cap and 80% minimum confidence. If either is exceeded, the system pauses and asks me.

### [1:15-3:30] Run the Mission Live

Suggested actions:
- Make sure the Demo toggle is `OFF`
- Enter: `Plan a dinner and movie night for two`
- Click `Start Mission`

Suggested narration:

> This is live mode — real LLM reasoning, real phone calls through ClawdTalk, real SMS through Telnyx. Watch the agents activate.

As the Planner runs:

> The Planner is decomposing my mission using Claude — you can see it's analyzing my specific request, not a template.

As Research runs:

> Research is finding venues. The explainability panel shows the provenance trail — which APIs it queried, the booking path, and the risk level for each source.

As the Call agent dials:

> Now the Call agent is making a real phone call through ClawdTalk to the restaurant. That's a cloned voice powered by Resemble AI — listen to the transcript streaming in live.

As the merchant SMS arrives:

> The merchant just texted back through Telnyx. The Negotiation agent is evaluating their counter-offer in real time.

When the approval card appears:

> There's the approval checkpoint. I can Confirm, Reject, or Modify right from the dashboard — or respond by SMS from my phone.

Suggested action:
- Click `Confirm`

Then say:

> The Scheduler is now building the final itinerary with real timing data.

Suggested phone moment:

> And here's the confirmation SMS on my actual phone — dinner reservation confirmed, cinema next.

### [3:30-3:55] Point 8 — Shadow Mission Twin

Suggested action:
- Click the `Scan Futures` or Shadow analysis control in the header

Suggested narration:

> Before committing to any mission, ClawSwarm can show you three parallel futures simultaneously.
>
> Three AI teams just ran in parallel — each optimizing for a different dimension.
> Path A — Best Value: $100, 92% confidence, low no-show risk — stacked discounts, off-peak timing.
> Path B — Fastest: $115, 88% confidence — nearest venues, instant availability.
> Path C — Premium: $152, 96% confidence — top-rated venues, best seats, the version you tell people about.

Suggested hover/click:
- Hover over the Best Value card to expose the reasoning
- Click `Live this timeline`

Continue:

> Every path shows the full AI reasoning — which venues were selected, why, and what tradeoffs were made. You're not just seeing a recommendation — you're seeing the thinking behind it.
>
> I'll take Best Value — and the live mission launches instantly because the research was already done in the shadow run. Zero extra latency.
>
> This is the first time anyone has built parallel timeline simulation for voice agents. Shadow Mission Twin — choose your future before you commit to it.

### [3:55-4:25] Point 9 — Relationship-Aware Voice Negotiator

Suggested action:
- Open the `Venue Intelligence` panel

Suggested narration:

> Now here's something that has never existed in any voice agent system before — a relationship memory for every business the agent calls.

Point to a venue intelligence card and explain:

> This venue has been contacted multiple times. Look at what the system learned:
> - call count and success rate
> - preferred tone
> - detected language
> - preferred booking window
> - discovered tactics or promo memory

Expand a card and continue:

> Every single call is logged — outcome, what was said, what worked, what didn't. The relationship builds over time.
>
> The Call Agent is now a seasoned concierge — not a chatbot that starts from zero every time. It knows these venues. It adapts. It gets better with every interaction.
>
> Relationship-Aware Voice Negotiation — for the first time, your AI agent has memory, tone intelligence, and multilingual scripts that evolve with every call.

### [4:25-5:00] Point 10 — Skill Genome

Suggested action:
- Open the `Skill Genome` panel or Genome tab

Suggested narration:

> And finally — the wow factor and technical moat of ClawSwarm Nexus.
>
> Most AI systems are static. They make the same mistakes forever. ClawSwarm learns. Every time the agent fails — a counter-offer it couldn't handle, a timeout it didn't recover from — that failure gets analyzed and distilled into a reusable behavioral skill.

Point to the generation counter and skill cards:

> We're now tracking generations of learned tactics. Each skill shows:
> - what pattern was learned
> - what mission or venue taught it
> - how often it has been used
> - the measured lift it produced

If replay is available:

> This mission ran before these skills existed. Now we can replay it with the current skill set and estimate how many prior failures would now be resolved.

Close with:

> This is a MetaClaw-inspired learning loop for voice agents. Every failure becomes a skill. Every skill has measurable lift. The swarm gets better with every mission it runs.
>
> This is our technical moat: a system that does not just execute missions, but compounds experience into reusable capabilities.

### [5:00] Closing

> ClawSwarm Nexus — five specialized agents, real phone calls through ClawdTalk, real SMS through Telnyx, real voice through Resemble AI, real reasoning through Claude.
>
> Shadow Mission Twin — choose between parallel futures before committing.
> Relationship-Aware Voice Negotiation — an agent that remembers every venue it has ever called.
> Skill Genome — the wow factor and technical moat: an agent that learns from every failure and gets measurably better over time.
>
> This isn't just a chatbot demo. It's autonomous infrastructure for real-world concierge execution.
>
> ClawSwarm Nexus.

## Demo Flow

1. The user enters a mission like `Plan a dinner and movie night` and picks an autonomy level.
2. The backend starts a mission run and streams state over WebSocket.
3. The Planner decomposes the mission (with verified source provenance on every decision).
4. The Research agent selects a restaurant and cinema.
5. The Call agent simulates or executes real reservation calls.
6. Merchants receive SMS booking requests and can accept or counter-offer in real time.
7. The Negotiation agent evaluates merchant responses and applies cost optimizations.
8. The autonomy ladder enforces budget/time/confidence constraints — escalating to the user when needed.
9. The Scheduler finalizes the itinerary.
10. The user receives SMS progress updates.
11. The dashboard ends with a mission summary, reasoning trace, memory trail, and savings breakdown.

The user can also interrupt the mission live, for example:
- `Make it cheaper`
- `Switch to vegetarian options`
- `Move it later tonight`

## Architecture

```text
Frontend (Vite + React + TypeScript)
  -> POST /api/mission/start
  -> POST /api/mission/interrupt
  -> POST /api/mission/reset
  -> GET /api/mission/state
  -> WS /ws

Backend (Node.js + Express + ws)
  -> MissionOrchestrator
  -> Planner / Research / Caller / Negotiator / Scheduler agents
  -> Telnyx SMS adapter
  -> ClawdTalk call adapter
  -> Resemble voice adapter
```

## Repo Structure

```text
.
├─ src/                         # React dashboard
│  ├─ contexts/                 # Mission state store
│  ├─ hooks/                    # Mission runtime hook
│  ├─ lib/                      # Mission event mapping + clients
│  └─ components/dashboard/     # Agentic control room UI
├─ clawswarm-backend/
│  ├─ agents/                   # Planner, research, caller, negotiator, scheduler
│  ├─ integrations/             # Telnyx, Resemble, ClawdTalk, LLM gateway
│  ├─ tests/                    # Backend tests
│  ├─ skill/                    # OpenClaw skill definition
│  ├─ orchestrator.js           # Mission lifecycle manager
│  ├─ state.js                  # Initial mission state factory
│  ├─ protocol.js               # Shared event format
│  ├─ websocket.js              # WebSocket hub
│  └─ server.js                 # API + WebSocket server
└─ README.md
```

## Frontend Event Model

The frontend no longer owns mission behavior through hardcoded timers. It consumes backend events as the source of truth.

Supported event families:
- `snapshot`
- `mission_status`
- `agent_update`
- `timeline_entry`
- `timeline_update`
- `call_update`
- `call_transcript`
- `sms`
- `summary`
- `reasoning`
- `memory`
- `skill`
- `adaptation`
- `merchant_offer`
- `merchant_offer_update`
- `recommendation_insight`
- `approval_request`
- `approval_cleared`
- `itinerary_confirmation_request`
- `itinerary_confirmation_cleared`
- `skill_update`
- `training_mode`
- `error`

This means the UI is ready for both a polished simulation and a real orchestration backend.

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion

### Backend
- Node.js
- Express
- ws

### Integrations
- Telnyx SMS
- ClawdTalk
- Resemble AI
- OpenAI or Anthropic for LLM planning/orchestration

## Local Setup

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd clawswarm-backend
npm install
cd ..
```

### 3. Configure backend environment

Copy [`.env.example`](./clawswarm-backend/.env.example) to `clawswarm-backend/.env`, then fill in your real values:

```env
# Required for live mode
ANTHROPIC_API_KEY=your_key
TELNYX_API_KEY=your_key
TELNYX_PHONE_NUMBER=your_number
USER_PHONE_NUMBER=your_number
```

Optional variables supported by the backend:

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | — | Alternative LLM provider |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model name |
| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-latest` | Anthropic model name |
| `RESEMBLE_API_KEY` | — | Voice clone via Resemble AI |
| `RESEMBLE_PROJECT_ID` | — | Resemble project |
| `RESEMBLE_VOICE_NAME` | `ClawSwarm Concierge` | Voice name |
| `CLAWDTALK_WS_URL` | — | ClawdTalk WebSocket endpoint |
| `CLAWDTALK_PHONE_NUMBER` | — | ClawdTalk caller ID |
| `CLAWDTALK_API_KEY` | — | ClawdTalk auth |
| `CLAWDTALK_API_URL` | — | ClawdTalk REST endpoint |
| `CLAWDTALK_SKILL_DIR` | — | ClawdTalk skill directory |
| `PORT` | `8787` | Backend server port |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `SIMULATION_DELAY_MS` | `350` | Delay between simulation steps |
| `AUTO_APPROVAL_DELAY_MS` | `3000` | Auto-approve timeout in simulation confirm mode |
| `MERCHANT_RESPONSE_TIMEOUT_MS` | `30000` | How long to wait for a merchant SMS reply before marking the request for manual follow-up |

### 4. Start the backend

```bash
npm run dev:backend
```

The backend runs on `http://127.0.0.1:8787`.

### 5. Start the frontend

In a second terminal:

```bash
npm run dev
```

The frontend runs on `http://127.0.0.1:8080`.

Vite is configured to proxy:
- `/api` -> backend
- `/ws` -> backend WebSocket server

## Running Tests

### Frontend tests

```bash
npx vitest run
```

### Backend tests

```bash
npm --prefix ./clawswarm-backend test
```

### Type check

```bash
npx tsc --noEmit
```

### Production build

```bash
npm run build
```

## Current Status

### Shipped from the Top 10 Roadmap

| # | Feature | Status |
|---|---|---|
| 1 | Autonomy Ladder + Approval Wallet | Shipped |
| 3 | Verified Source Graph | Shipped |
| 7 | Merchant Copilot + Reverse Offers | Shipped |
| 8 | Shadow Mission Twin | Shipped |
| 9 | Relationship-Aware Voice Negotiator | Shipped |
| 10 | Skill Genome / MetaClaw-inspired learning loop | Shipped |

### What is live in this repo now
- Full backend orchestration inside `clawswarm-backend/`
- Live mission runtime hook in the frontend
- Backend-driven simulation mode with deterministic merchant offer rotation
- Mission start / interrupt / reset API
- WebSocket event streaming into the existing dashboard
- Three-tier autonomy ladder (Suggest, Confirm, Auto-Book) with constraint gates
- Verified source provenance on all agent reasoning cards
- Real merchant SMS flow: send booking request, parse reply, timeout fallback
- Merchant inbound webhook with sender validation
- Shadow Mission Twin UI and backend simulation path
- Venue Intelligence / relationship memory surfaces
- Skill Genome generation and learned tactic panels
- Workflow-aware reasoning, summaries, recommendation insights, and merchant panels
- Backend tests (27 passing) and frontend event-mapping tests (7 passing)

### What still depends on real credentials
- Live Telnyx SMS delivery (merchant + user flows)
- Live Resemble voice cloning and speech generation
- True ClawdTalk outbound production call flow

The codebase is intentionally structured so that the demo still works even when those providers are unavailable.

## Why Judges Will Understand It Fast

This project is easy to evaluate quickly because the product loop is visible:
- input a mission
- watch agents activate
- see timeline and reasoning accumulate
- see calls and SMS updates happen
- end with a concrete itinerary and savings summary

That visibility matters. It turns autonomous orchestration from a black box into a measurable product experience.

## Roadmap (Remaining Top 10)

| # | Feature | Description |
|---|---|---|
| 2 | Persistent Memory Passport | Long-lived preference graph: budgets, allergies, date-night patterns, loyalty memberships |
| 4 | Auto-Waitlist + Rescue Swarm | Join waitlists, monitor cancellations, rebook on weather/traffic changes |
| 5 | Budget Guardian / Deal Arbitrage | Post-booking price watch, promo stacking, automatic switch/save/keep alerts |
| 6 | Multimodal Mission Inbox | Voice notes, screenshots, menu photos, Maps links as mission inputs |

### Other Extensions
- Calendar checking and booking tools during live calls
- Multi-mission support with true session IDs
- Production-grade ClawdTalk client wiring
- Deployment targets and hosted demo infrastructure

## License

This repository currently has no explicit license file. Add one before broader distribution if you want reuse terms to be clear.
