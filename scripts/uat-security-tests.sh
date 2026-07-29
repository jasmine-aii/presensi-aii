#!/usr/bin/env bash
#
# UAT security tests — technical anti-fraud vectors (A.3 / A.6 / A.7).
# Attempts to bypass the app via the Supabase REST API as a logged-in employee.
# Each "bypass" attempt SHOULD be rejected by the server (RLS / triggers).
#
# Requires: curl, jq.
# Run against a THROWAWAY employee account (it creates + cancels a test leave and
# attempts test attendance writes on a fake 2000-01-01 date, cleaning up after).
# The account must be a regular EMPLOYEE (not admin) for the A.7 checks.
#
# Usage:
#   export SUPABASE_URL="https://<ref>.supabase.co"
#   export SUPABASE_ANON_KEY="<anon key>"
#   export TEST_EMAIL="testuser@example.com"      # your throwaway test account
#   export TEST_PASSWORD="********"               # you type this, not the AI
#   # optional: a coworker's user id to test cross-read explicitly
#   export OTHER_UID="00000000-0000-0000-0000-000000000000"
#   bash scripts/uat-security-tests.sh
#
set -uo pipefail

URL="${SUPABASE_URL:?set SUPABASE_URL}"
ANON="${SUPABASE_ANON_KEY:?set SUPABASE_ANON_KEY}"
EMAIL="${TEST_EMAIL:?set TEST_EMAIL (throwaway employee account)}"
PASSWORD="${TEST_PASSWORD:?set TEST_PASSWORD}"
OTHER_UID="${OTHER_UID:-}"

pass() { echo "  ✅ PASS — $1"; }
fail() { echo "  ❌ FAIL — $1"; }

# curl helper: prints the HTTP status code on the last line.
code() { curl -s -o /tmp/uat_body -w "%{http_code}" "$@"; }
body() { cat /tmp/uat_body; }

echo "=== UAT security tests ==="

# ── 0. Login → JWT ───────────────────────────────────────────────────────────
TOKEN=$(curl -s "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.access_token // empty')
[ -n "$TOKEN" ] || { echo "Login failed — check TEST_EMAIL / TEST_PASSWORD"; exit 1; }
ME=$(curl -s "$URL/auth/v1/user" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" | jq -r '.id')
echo "Logged in as $EMAIL ($ME)"
AUTH=(-H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

# ── A.7 — RLS data isolation ─────────────────────────────────────────────────
echo
echo "A.7 — RLS (can only see own data)"
N=$(curl -s "$URL/rest/v1/profiles?select=id" "${AUTH[@]}" | jq 'length')
[ "$N" = "1" ] && pass "profiles returns only own row" || fail "profiles returned $N rows (admin account? else RLS leak)"

BAD=$(curl -s "$URL/rest/v1/attendance?select=user_id" "${AUTH[@]}" | jq "[.[] | select(.user_id != \"$ME\")] | length")
[ "$BAD" = "0" ] && pass "attendance rows all belong to me" || fail "attendance exposed $BAD rows of other users"

BAD=$(curl -s "$URL/rest/v1/leave_requests?select=user_id" "${AUTH[@]}" | jq "[.[] | select(.user_id != \"$ME\")] | length")
[ "$BAD" = "0" ] && pass "leave_requests all belong to me" || fail "leave_requests exposed $BAD rows of other users"

if [ -n "$OTHER_UID" ]; then
  N=$(curl -s "$URL/rest/v1/profiles?select=id&id=eq.$OTHER_UID" "${AUTH[@]}" | jq 'length')
  [ "$N" = "0" ] && pass "cannot read coworker's profile by id" || fail "read coworker's profile (RLS leak)"
fi

# ── A.6 — approval bypass ────────────────────────────────────────────────────
echo
echo "A.6 — leave approval bypass"
# (a) insert an already-approved request directly
ST=$(code -X POST "$URL/rest/v1/leave_requests" "${AUTH[@]}" \
  -d "{\"user_id\":\"$ME\",\"type\":\"dinas_luar\",\"start_date\":\"2000-01-03\",\"end_date\":\"2000-01-03\",\"days\":1,\"status\":\"approved\"}")
[ "$ST" -ge 400 ] && pass "cannot insert a pre-approved request (HTTP $ST)" || fail "inserted an approved request (HTTP $ST) — RLS hole"

# (b) create a pending request, then try to self-approve it
LID=$(curl -s -X POST "$URL/rest/v1/leave_requests" "${AUTH[@]}" -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$ME\",\"type\":\"dinas_luar\",\"start_date\":\"2000-01-04\",\"end_date\":\"2000-01-04\",\"days\":1,\"status\":\"pending\"}" \
  | jq -r '.[0].id // empty')
if [ -n "$LID" ]; then
  ST=$(code -X PATCH "$URL/rest/v1/leave_requests?id=eq.$LID" "${AUTH[@]}" -d '{"status":"approved"}')
  [ "$ST" -ge 400 ] && pass "cannot self-approve own request (HTTP $ST)" || fail "self-approved own request (HTTP $ST) — trigger hole"
  # cleanup: cancel it (owner is allowed to cancel a pending request)
  curl -s -o /dev/null -X PATCH "$URL/rest/v1/leave_requests?id=eq.$LID" "${AUTH[@]}" -d '{"status":"cancelled"}'
else
  echo "  (skipped self-approve: could not create a pending request)"
fi

# ── A.3 — geofence / location bypass ─────────────────────────────────────────
echo
echo "A.3 — geofence bypass via direct API (fake date 2000-01-01)"
# (a) clock-in with NO location
ST=$(code -X POST "$URL/rest/v1/attendance" "${AUTH[@]}" \
  -d "{\"user_id\":\"$ME\",\"work_date\":\"2000-01-01\",\"clock_in_at\":\"2000-01-01T01:00:00Z\"}")
[ "$ST" -ge 400 ] && pass "clock-in without a location rejected (HTTP $ST)" || fail "clock-in without location accepted (HTTP $ST)"

# (b) clock-in far from the office (Bandung ~120km away)
ST=$(code -X POST "$URL/rest/v1/attendance" "${AUTH[@]}" \
  -d "{\"user_id\":\"$ME\",\"work_date\":\"2000-01-01\",\"clock_in_at\":\"2000-01-01T01:00:00Z\",\"clock_in_lat\":-6.9175,\"clock_in_lng\":107.6191}")
[ "$ST" -ge 400 ] && pass "clock-in far from office rejected (HTTP $ST)" || fail "clock-in far from office accepted (HTTP $ST)"

# cleanup any test attendance row that slipped through
curl -s -o /dev/null -X DELETE "$URL/rest/v1/attendance?user_id=eq.$ME&work_date=eq.2000-01-01" "${AUTH[@]}"

echo
echo "=== done. Any ❌ FAIL is a real finding — investigate. ==="
echo "Not covered here (need devices/humans): GPS spoofing to office coords (A.2),"
echo "selfie liveness (A.5), on-device iOS/Android checks, in-office geofence."
