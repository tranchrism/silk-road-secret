#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root_dir"

failures=0

check_file() {
  local file="$1"
  local label="$2"

  if [[ ! -f "$file" ]]; then
    echo "[FAIL] Missing file: $file"
    failures=$((failures + 1))
    return
  fi

  local missing
  missing="$(jq '[.[] | select((.source_url // "") == "" or (.captured_at // "") == "" or (.verification_status // "") == "" or (.verification_note // "") == "")] | length' "$file")"

  if [[ "$missing" != "0" ]]; then
    echo "[FAIL] $label has $missing records missing trust fields"
    failures=$((failures + 1))
  else
    echo "[PASS] $label trust fields complete"
  fi
}

check_hotel_rates() {
  local file="data/hotels.json"
  if [[ ! -f "$file" ]]; then
    echo "[FAIL] Missing file: $file"
    failures=$((failures + 1))
    return
  fi

  local missing
  missing="$(jq '[.[] |
    select(
      (.room_rates_may_11_15_2026.display_currency // "") == "" or
      (.room_rates_may_11_15_2026.rate_quality // "") == "" or
      (.room_rates_may_11_15_2026.one_bed.refundable.verification_status // "") == "" or
      (.room_rates_may_11_15_2026.one_bed.non_refundable.verification_status // "") == "" or
      (.room_rates_may_11_15_2026.two_bed.refundable.verification_status // "") == "" or
      (.room_rates_may_11_15_2026.two_bed.non_refundable.verification_status // "") == ""
    )
  ] | length' "$file")"

  if [[ "$missing" != "0" ]]; then
    echo "[FAIL] hotels.json has $missing records with incomplete room-rate trust fields"
    failures=$((failures + 1))
  else
    echo "[PASS] hotels.json room-rate trust fields complete"
  fi
}

check_file "data/hotels.json" "Hotels"
check_file "data/restaurants.json" "Restaurants"
check_file "data/shopping.json" "Shopping"
check_file "data/transit.json" "Transit"
check_file "data/chongqing_24h.json" "Chongqing 24h"
check_file "data/china_tips.json" "China tips"
check_hotel_rates

if [[ "$failures" -gt 0 ]]; then
  echo "Validation failed with $failures issue(s)."
  exit 1
fi

echo "All trust field checks passed."
