# 🦀 ClawSwarm Nexus

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

variables supported by the backend:

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
