#!/bin/bash
set -euo pipefail
mkdir -p "$RUNNER_TEMP/ios-evidence"
xcrun simctl list devices available --json > "$RUNNER_TEMP/simulators.json"
DEVICE=$(python3 -c 'import json,os; d=json.load(open(os.environ["RUNNER_TEMP"]+"/simulators.json")); print(next(x["udid"] for group in d["devices"].values() for x in group if x["name"].startswith("iPhone") and x.get("isAvailable")))')
xcrun simctl boot "$DEVICE"
xcrun simctl bootstatus "$DEVICE" -b
xcrun simctl status_bar "$DEVICE" override --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 --batteryState charged --batteryLevel 100
xcrun simctl install "$DEVICE" "$RUNNER_TEMP/derived/Build/Products/Release-iphonesimulator/App.app"
xcrun simctl launch "$DEVICE" club.whogotwho.app
sleep 12
xcrun simctl io "$DEVICE" screenshot "$RUNNER_TEMP/ios-evidence/iphone-launch.png"
xcrun simctl spawn "$DEVICE" log show --last 1m --style compact --predicate 'process == "App"' > "$RUNNER_TEMP/ios-evidence/app-launch.log"
