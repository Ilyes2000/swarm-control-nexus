#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  ClawSwarm Nexus — Master Test Runner                        ║
# ║  Runs all 5 test suites and reports PASS / FAIL              ║
# ╚══════════════════════════════════════════════════════════════╝
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/clawswarm-backend" && pwd)"
PORT=8787
SERVER_PID=""

# ── Colours ───────────────────────────────────────────────────
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RESET="\033[0m"

pass() { echo -e "${GREEN}✓ PASS${RESET}  $1"; }
fail() { echo -e "${RED}✗ FAIL${RESET}  $1"; }
info() { echo -e "${CYAN}▶${RESET}  $1"; }
header() { echo -e "\n${BOLD}${YELLOW}$1${RESET}"; }

PASS_COUNT=0
FAIL_COUNT=0
SUITE_RESULTS=()

# ── Kill any existing server on the port ──────────────────────
kill_old_server() {
  local pid
  pid=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    info "Killing existing process on port $PORT (pid $pid)..."
    kill -9 "$pid" 2>/dev/null || true
    sleep 0.5
  fi
}

# ── Start backend server ──────────────────────────────────────
start_server() {
  info "Starting backend server on port $PORT..."
  cd "$BACKEND_DIR"
  # Create minimal .env if missing
  if [ ! -f .env ]; then
    touch .env
  fi
  node --env-file=.env server.js &>/tmp/clawswarm-server.log &
  SERVER_PID=$!
  cd - >/dev/null

  # Wait for it to be ready
  local attempts=0
  while ! curl -s "http://localhost:$PORT/health" >/dev/null 2>&1; do
    sleep 0.3
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 40 ]; then
      echo -e "${RED}Server did not start in time. Logs:${RESET}"
      cat /tmp/clawswarm-server.log
      exit 1
    fi
  done
  info "Server ready ✓"
}

# ── Stop server ───────────────────────────────────────────────
stop_server() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap stop_server EXIT

# ── Run one test suite ────────────────────────────────────────
run_suite() {
  local label="$1"
  local file="$2"
  local http_needed="${3:-false}"

  header "Suite $label — $(basename "$file" .test.js)"

  if [ "$http_needed" = "true" ] && [ -z "$SERVER_PID" ]; then
    info "HTTP tests require server — starting..."
    start_server
  fi

  local output
  local exit_code=0

  output=$(cd "$BACKEND_DIR" && node --test "$file" 2>&1) || exit_code=$?

  # Count individual test results from TAP output
  local suite_pass suite_fail
  suite_pass=$(echo "$output" | grep -c "^ok " || true)
  suite_fail=$(echo "$output" | grep -c "^not ok " || true)

  PASS_COUNT=$((PASS_COUNT + suite_pass))
  FAIL_COUNT=$((FAIL_COUNT + suite_fail))

  if [ "$exit_code" -eq 0 ]; then
    pass "$label passed ($suite_pass tests)"
    SUITE_RESULTS+=("${GREEN}PASS${RESET}  Suite $label — $suite_pass tests passed")
  else
    fail "$label failed ($suite_pass passed, $suite_fail failed)"
    SUITE_RESULTS+=("${RED}FAIL${RESET}  Suite $label — $suite_pass/$((suite_pass+suite_fail)) passed")
    # Print failures
    echo "$output" | grep -A 5 "^not ok " | head -40 || true
  fi

  return "$exit_code"
}

# ══════════════════════════════════════════════════════════════
echo -e "\n${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║   ClawSwarm Nexus — Full Test Suite Runner   ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}\n"

kill_old_server

OVERALL_EXIT=0

# Suite A — Polyvalent Query Engine (unit, no server needed)
run_suite "A" "$BACKEND_DIR/tests/polyvalent-queries.test.js" false || OVERALL_EXIT=1

# Suite B — Shadow Mission Twin (unit, no server needed)
run_suite "B" "$BACKEND_DIR/tests/shadow-mission.test.js" false || OVERALL_EXIT=1

# Suite C — Venue Intelligence (unit, no server needed)
run_suite "C" "$BACKEND_DIR/tests/venue-intelligence.test.js" false || OVERALL_EXIT=1

# Start server for HTTP-dependent suites
start_server

# Suite D — Skill Genome (unit + HTTP)
run_suite "D" "$BACKEND_DIR/tests/skill-genome.test.js" true || OVERALL_EXIT=1

# Suite E — E2E Integration (unit + HTTP)
run_suite "E" "$BACKEND_DIR/tests/e2e-integration.test.js" true || OVERALL_EXIT=1

# Also run existing tests
header "Legacy suites (pre-existing)"
cd "$BACKEND_DIR"
for f in tests/orchestrator.test.js tests/merchant-response.test.js tests/telnyx-sms.test.js; do
  if [ -f "$f" ]; then
    output=$(node --test "$f" 2>&1) || true
    p=$(echo "$output" | grep -c "^ok " || true)
    x=$(echo "$output" | grep -c "^not ok " || true)
    PASS_COUNT=$((PASS_COUNT + p))
    FAIL_COUNT=$((FAIL_COUNT + x))
    echo -e "  $(basename "$f"): ${GREEN}${p} pass${RESET} / ${RED}${x} fail${RESET}"
  fi
done
cd - >/dev/null

# ── Final report ──────────────────────────────────────────────
echo -e "\n${BOLD}═══════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Test Results Summary${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════${RESET}"
for line in "${SUITE_RESULTS[@]}"; do
  echo -e "  $line"
done
echo -e "${BOLD}───────────────────────────────────────────────${RESET}"
echo -e "  Total: ${GREEN}$PASS_COUNT passed${RESET}  /  ${RED}$FAIL_COUNT failed${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════${RESET}\n"

exit "$OVERALL_EXIT"
