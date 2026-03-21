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

## Core Features

### Real-time Mission Control
- Live agent status updates
- Chronological mission timeline
- Explainability and memory panels
- SMS log and live call transcript view
- Final summary with optimization and savings breakdown

### Backend Orchestration Engine
- Express HTTP API for mission control
- WebSocket event stream for frontend hydration
- Single source of truth mission state
- Interrupt flow for mid-mission user changes

### Telephony + Messaging
- Telnyx SMS send/receive integration
- Telnyx webhook parsing for `CONFIRM` and `MODIFY`
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

## Demo Flow

1. The user enters a mission like `Plan a dinner and movie night`.
2. The backend starts a mission run and streams state over WebSocket.
3. The Planner decomposes the mission.
4. The Research agent selects a restaurant and cinema.
5. The Call agent simulates or executes real reservation calls.
6. The Negotiation agent applies cost optimizations.
7. The Scheduler finalizes the itinerary.
8. The user receives SMS progress updates.
9. The dashboard ends with a mission summary, reasoning trace, memory trail, and savings breakdown.

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
TELNYX_API_KEY=your_key
TELNYX_PHONE_NUMBER=your_number
RESEMBLE_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

Optional variables supported by the backend:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ANTHROPIC_MODEL`
- `PORT`
- `USER_PHONE_NUMBER`
- `RESEMBLE_PROJECT_ID`
- `CLAWDTALK_WS_URL`
- `CLAWDTALK_PHONE_NUMBER`
- `RESEMBLE_VOICE_NAME`
- `SIMULATION_DELAY_MS`

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

What is live in this repo now:
- real backend scaffolding inside `clawswarm-backend/`
- live mission runtime hook in the frontend
- backend-driven simulation mode
- mission start / interrupt / reset API
- WebSocket event streaming into the existing dashboard
- backend tests and frontend event-mapping tests

What still depends on real credentials and provider setup:
- live Telnyx SMS delivery
- live Resemble voice cloning and speech generation
- true ClawdTalk outbound production call flow

The codebase is intentionally structured so that the demo still works even when those providers are unavailable.

## Why Judges Will Understand It Fast

This project is easy to evaluate quickly because the product loop is visible:
- input a mission
- watch agents activate
- see timeline and reasoning accumulate
- see calls and SMS updates happen
- end with a concrete itinerary and savings summary

That visibility matters. It turns autonomous orchestration from a black box into a measurable product experience.

## Future Extensions

- Calendar checking and booking tools during live calls
- Price-comparison APIs for restaurant and ticket optimization
- Persistent mission history and user preferences
- Multi-mission support with true session IDs
- Production-grade ClawdTalk client wiring
- Deployment targets and hosted demo infrastructure

## License

This repository currently has no explicit license file. Add one before broader distribution if you want reuse terms to be clear.
