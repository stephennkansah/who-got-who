#!/bin/bash
set -euo pipefail
# Use the already compiled simulator artifact; this job never signs or uploads an app.
SOURCE_APP=$(find "$RUNNER_TEMP/ios-check" -type d -name App.app -print -quit)
test -n "$SOURCE_APP"
APP="$RUNNER_TEMP/screenshot-app/App.app"
mkdir -p "$(dirname "$APP")" "$RUNNER_TEMP/store-screenshots"
ditto "$SOURCE_APP" "$APP"
# Artifact downloads normalize permissions; restore executable bits on Mach-O files.
python3 - "$APP" <<'PY'
import os, sys
magic = {bytes.fromhex(h) for h in ['feedface', 'cefaedfe', 'feedfacf', 'cffaedfe', 'cafebabe', 'bebafeca', 'cafebabf', 'bfbafeca']}
for root, _, files in os.walk(sys.argv[1]):
    for name in files:
        path = os.path.join(root, name)
        with open(path, 'rb') as stream:
            if stream.read(4) in magic:
                os.chmod(path, os.stat(path).st_mode | 0o111)
PY
cp "$APP/public/index.html" "$RUNNER_TEMP/original-index.html"
node scripts/ios-store-fixtures.mjs "$APP/public"
xcrun simctl list devices available --json > "$RUNNER_TEMP/screenshot-devices.json"
python3 - <<'PY' > "$RUNNER_TEMP/screenshot-targets.tsv"
import json, os
groups = json.load(open(os.environ['RUNNER_TEMP'] + '/screenshot-devices.json'))['devices']
devices = [d for group in groups.values() for d in group if d.get('isAvailable')]
for prefix, label in [('iPhone', 'iphone'), ('iPad Pro 13-inch', 'ipad')]:
    device = next(d for d in devices if d['name'].startswith(prefix))
    print(label + '\t' + device['udid'])
PY
while IFS=$'\t' read -r LABEL DEVICE; do
  xcrun simctl boot "$DEVICE"
  xcrun simctl bootstatus "$DEVICE" -b
  xcrun simctl status_bar "$DEVICE" override --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 --batteryState charged --batteryLevel 100
  for SCREEN in launch lobby missions mission; do
    if [ "$SCREEN" = launch ]; then
      cp "$RUNNER_TEMP/original-index.html" "$APP/public/index.html"
    else
      cp "$APP/public/$SCREEN.html" "$APP/public/index.html"
    fi
    xcrun simctl uninstall "$DEVICE" club.whogotwho.app || true
    xcrun simctl install "$DEVICE" "$APP"
    xcrun simctl launch "$DEVICE" club.whogotwho.app
    sleep 10
    xcrun simctl io "$DEVICE" screenshot "$RUNNER_TEMP/store-screenshots/$LABEL-$SCREEN.png"
    xcrun simctl terminate "$DEVICE" club.whogotwho.app
  done
  xcrun simctl shutdown "$DEVICE"
done < "$RUNNER_TEMP/screenshot-targets.tsv"
