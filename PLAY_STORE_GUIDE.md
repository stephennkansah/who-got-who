# Who Got Who: Android release

The Android app opens the live game at https://whogotwho.club as a Trusted Web
Activity. Web deployments update gameplay; native wrapper, icon and permission
changes require a new Android release.

The app entry was created on 25 October 2026 in the existing organisation account:
[Who Got Who in Play Console](https://play.google.com/console/u/2/developers/5302625220640785272/app/4972225190205657515/app-dashboard).
Its default language is English (UK), category type Game, and download price Free.

The internal release draft is named **1.0.0 - First internal test**. The user
uploaded version code 3 manually and Google Play accepted it with minimum API 24
and target API 36. Version 2 was replaced because automatic protection requires
minimum API 24. No test rollout or production submission has been made.
The website changes are local and still need deployment.

## Build locally

Use Java 17, Android SDK platform 36 and Build Tools 35.0.0. Set the SDK path
in the ignored local.properties file. Keep the existing android.keystore and
keystore.properties private and backed up; do not regenerate the signing key.

Run:

```powershell
.\build-android.ps1 -IncludeApk
```

The helper runs release lint and builds a signed AAB and optional APK. Generated
files go outside OneDrive to avoid sync locks:

- AAB: %LOCALAPPDATA%\WhoGotWho\android-build\app\outputs\bundle\release\app-release.aab
- APK: %LOCALAPPDATA%\WhoGotWho\android-build\app\outputs\apk\release\app-release.apk
- Lint: %LOCALAPPDATA%\WhoGotWho\android-build\app\reports\lint-results-release.html

A successful build is not Play approval or a substitute for phone testing.
The old app/build output may still contain an older build; use the path printed
by the helper.

Current configuration:

- Package: club.whogotwho.twa
- Version name: 1.0.0; version code: 3
- Compile and target API: 36 (Android 16)
- Minimum API: 24 (Android 7), required by Play automatic protection
- No advertising or in-app billing SDK
- Optional notification delegation; browser-managed photo selection

For subsequent uploads, increase versionCode above every code already used in
this app's Play Console. Keep app/build.gradle and twa-manifest.json versions
in sync. Recheck the target SDK if regenerating the project with Bubblewrap.

## Connect the installed app to the website

The file public/.well-known/assetlinks.json contains both the existing local
release/upload certificate and this app's Play app signing certificate, read
from Play Console on 25 October 2026. Deploy the website to publish them.
Google Play signs installed apps with a different certificate from the local
upload key. Keep both for testing.

1. Create or open **Who Got Who** in your existing Play Console account.
2. Under Protected with Play / Play Store protection / Manage Play app signing,
   copy the **App signing key certificate**
   SHA-256 fingerprint. Do not copy the upload key certificate or another app's key.
3. Add that public fingerprint while keeping the local fingerprint:

```powershell
.\scripts\add-play-signing-fingerprint.ps1 -Fingerprint 'AA:BB:...'
```

Replace the example with all 32 colon-separated bytes. The script rejects
placeholders and malformed fingerprints. No password or private key is needed.

4. Deploy the website. Confirm https://whogotwho.club/.well-known/assetlinks.json
   returns HTTP 200 and JSON directly, without redirects or the app's HTML.
5. Install from a Play testing track and confirm the game opens without browser
   address controls. Keep both fingerprints if testing sideloaded APKs too.

The current Play fingerprint starts C3:DC:AB:6C; the local fingerprint starts
BF:FC:02:00. Full fingerprints are recorded in the assetlinks JSON. Verification
on a Play-installed phone still requires website deployment and a test install.
See [Google's TWA signing guidance](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs).

## Prepare the listing

The app is free to download. Optional paid mission packs are planned for a later
release; choosing Free in Play Console does not prevent in-app purchases.
The current build has no checkout or paid entitlements. Its unused, outdated
billing library was removed, so billing must be integrated before selling packs.

For paid packs, add the current Android Browser Helper billing integration,
configure one-time products in Play Console, and use Google Play Billing inside
the Play-installed app. Verify and acknowledge purchases on the backend, persist
pack ownership, restore purchases, and handle refunds before unlocking content.
Do not charge for packs based only on a browser flag or local storage. See
[Google's TWA billing guide](https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing).

Suggested name: **Who Got Who**

Suggested short description (within 80 characters):

> Secret missions. Sly friends. Catch them out before they catch you.

Suggested full description:

> Turn your next get-together into a game of secret missions and suspicious friends.
>
> Host a game, share the code, and give everyone their own hidden missions.
> Complete yours without being caught, call out your friends when you spot them,
> and find out who fooled who when the game ends.
>
> Play at parties, dinners or trips away. Friends can join in their browser,
> so the whole group does not need to install the Android app.
>
> An internet connection is required. Notifications and photo avatars are optional.

Use public/icons/spy-512.png for the store icon. Keep the approved mascot art.
Prepare actual phone screenshots and a 1024 x 500 feature graphic before
submission; do not use the composite development preview as a store screenshot.

Privacy policy URL: https://whogotwho.club/privacy.html
Support email: info@myformatic.com
Website: https://whogotwho.club

Choose the available game category, audience and content rating based on the
actual mission packs. The privacy policy says the service is not directed to
children under 13; do not choose younger audience groups without reviewing
the product and corresponding requirements. Do not assume an age rating.

## App content and reviewer access

Complete Ads, Data safety, Target audience, Content rating and App access in
Play Console. The current game has no ads or purchases.

For Data safety, review the actual data flows, including the website opened
inside the app: chosen player name, optional avatar/proof photos, game actions
and scores, pseudonymous device identity, optional push subscription, aggregated
play statistics and normal service logs. Do not declare that no data is collected.
The current privacy policy describes retention and the support route for access
or deletion requests. Google distinguishes service-provider processing from
other sharing; answer the form using its definitions.

Reviewer access draft: no paid account or password is required. Enter a player
name, host a game, and use its code to join on other devices or separate browser
profiles. Reviewers can use the website for additional players. Start once the
lobby's minimum player count is met. Claims require interaction with the other
players. Provide the exact current steps and any additional instructions the
Console requests; do not provide a short-lived game code as the only access route.

References:
[App content](https://support.google.com/googleplay/android-developer/answer/9859455)
and [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469).

## Test before submission

Start with a Play testing track. Check on real phones:

- Cold launch, splash/icon, back button, app links and full-screen verification.
- Hosting and joining with several devices, including browser-only players.
- Mission claims, the fixed five-minute response window, disputes and recap.
- Correct score progression and the five-point win condition.
- Notification allow/deny and a claim alert while the phone is locked.
- Photo picker, upload, reconnect after losing signal, and app resume.
- Small screens, large screens, text scaling and Android 16 system bars.

Use Play's pre-launch report as an additional check. This developer account is
an organisation account; follow the requirements shown for this new app in
Play Console. The separate new-personal-account testing rules are described in
[Google's testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).

Upload the signed AAB, finish the listing and app-content forms, and review the
release before submitting. This repository does not upload or submit it automatically.
