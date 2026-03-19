

# ClawSwarm Operator — Mission Control Dashboard

## Overview
A futuristic, dark-mode mission control dashboard for an AI multi-agent swarm system. The UI simulates real-time agent collaboration, phone calls, SMS, and task execution with a cyberpunk aesthetic.

## Design System
- **Theme**: Dark mode with glassmorphism panels (backdrop-blur, semi-transparent backgrounds)
- **Colors**: Deep dark backgrounds (`#0a0a1a`), purple/blue neon accents, green for success, amber for pending, red for failed
- **Animations**: Framer Motion for all transitions, waveforms, and status changes
- **Typography**: Clean monospace for data, sans-serif for UI labels

## Layout (4-panel + header + footer)

### Header Bar
- "ClawSwarm Operator" logo with subtle glow
- LIVE/IDLE status badge (pulsing green dot when live)
- Text input + mic button for user commands
- "Start Mission" button (neon gradient)
- "Demo Mode" toggle switch

### Left Panel — Agent Swarm Cards
- 5 agent cards: Planner, Call, Negotiation, Scheduler, Research
- Each card: emoji icon, name, animated status pill (thinking/speaking/calling/idle), live text bubble showing current output, animated waveform bar when speaking, current task label
- Cards glow/pulse when active

### Center Panel — Mission Timeline
- Vertical timeline with animated entries appearing in sequence
- Each entry: timestamp, agent avatar, action description, status icon (✓/⏳/✗)
- Auto-scrolls to latest entry
- Connected by a glowing vertical line

### Right Panel — Live Calls & SMS
- **Call View**: Active call card with caller/receiver labels, duration timer, streaming transcript with speaker labels, call status indicator
- **SMS Log**: Chat-bubble style message list with sent/received styling and timestamps

### Bottom Panel — Mission Summary
- Appears when mission completes
- Shows: final result text, cost breakdown, time taken
- "Confirm" and "Modify" buttons

## Demo Mode
- Toggle activates a pre-scripted "Plan a dinner and movie night" scenario
- Agents activate sequentially with timed delays
- Simulated call transcript streams in character by character
- SMS messages appear on schedule
- Timeline populates step by step
- Full scenario runs ~30 seconds for demo impact

## Key Components to Build
1. **Layout shell** with glassmorphism panels and responsive grid
2. **AgentCard** component with animated states and waveform
3. **MissionTimeline** component with auto-scrolling animated entries
4. **LiveCallView** with streaming transcript simulation
5. **SMSLog** chat-bubble component
6. **MissionSummary** bottom panel
7. **VoiceInput** button with mic animation and fake transcription
8. **DemoMode engine** — a hook that orchestrates timed events across all panels
9. **Header** with status, input, and controls

## Animations (Framer Motion)
- Agent cards: scale/glow on activation, waveform bars animate
- Timeline entries: fade-in + slide-up on appear
- Call transcript: typewriter text effect
- Status transitions: smooth color morphs
- Mission summary: slide-up reveal

## Data Flow
- All demo data driven by a `useDemoMode` hook with `setTimeout` sequences
- State managed via React context for cross-panel updates
- No backend needed — all simulated client-side for hackathon demo

