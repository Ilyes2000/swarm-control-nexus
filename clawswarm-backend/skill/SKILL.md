# ClawSwarm Mission Orchestrator

## Purpose

Execute a ClawSwarm mission from OpenClaw by delegating to the backend orchestrator that powers the dashboard.

## Inputs

- `missionText`: required natural-language mission request
- `mode`: optional, `live` or `simulation`

## Behavior

1. Send `missionText` and `mode` to `POST /api/mission/start`.
2. Stream mission progress from `GET /ws`.
3. Surface agent activity, call transcript events, SMS status, and final summary back to the OpenClaw host.
4. Route interrupt requests to `POST /api/mission/interrupt`.

## Notes

- Use `simulation` when live telephony credentials are missing or when the demo requires deterministic timing.
- Use the same event contract as the web dashboard so both clients see consistent mission progress.
