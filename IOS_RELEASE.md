# Who Got Who: iPhone and iPad release

Bundle ID: `club.whogotwho.app`. Apple team: `T3PAKNXT8A` (Outlook Aesthetics Ltd).
The iOS app bundles the React game using Capacitor 8; it uses the same live
AWS backend as https://whogotwho.club. It requires iOS 15 or later.
Android remains the existing Trusted Web Activity.

## Build

- `npm run ios:sync` retrieves the public website's Amplify client configuration,
  builds the React assets and syncs the iOS plugins. No server secrets are bundled.
- GitHub Actions **iPhone app**, mode **check**, compiles on a cloud Mac and
  attaches the simulator build, launch screenshot and log.
- Mode **release** archives and uploads to TestFlight. App Store submission is
  a separate step after testing and completing the listing.
- Web frontend changes require a new iOS binary because this app bundles its UI.
  Backend-only changes do not. The Android TWA still loads the website.

## Existing shared Apple signing workflow

Stephen authorised reusing the existing team key. The manual **Who Got Who
iPhone app** workflow in `dentistrydashboard/myformatic-frontend` checks out
an exact reviewed commit of this game and uses that repository's existing
App Store Connect secrets. The secrets never leave GitHub. Supply the full
40-character game commit as `source_commit`. Run `check` first, then `release`.
No Dentistry Dashboard application code is built or deployed by this workflow.

The workflow in this game repository can also compile without secrets. Its
release mode is an alternative if separate signing secrets are added here.

## Apple account setup

1. App ID `club.whogotwho.app` with Associated Domains was registered on 25 October 2026.
2. App Store Connect app **Who Got Who** was created on 25 October 2026:
   Apple ID `6826935487`, SKU `who-got-who-ios`, English (U.K.), version `1.0`.
   The description, keywords, support URL and no-account review instructions
   are saved. The primary category is Games / Casual. Submission is still pending.
3. The shared workflow already has the existing signing secrets. Do not ask
   Stephen to copy them again. Only if moving signing to this repository, add:
   - `APP_STORE_CONNECT_KEY_P8`: the App Store Connect API private key.
   - `APP_STORE_CONNECT_KEY_ID`: that key's ID.
   - `APP_STORE_CONNECT_ISSUER_ID`: its issuer ID.
   Use an existing authorised team key or create an appropriately scoped one.
   Do not commit or paste private key contents into chat. The public repository
   must never contain the private key, certificates, passwords or profiles.
4. Deploy the public `.well-known/apple-app-site-association` file with JSON
   content type for invitation links. The entitlement only covers whogotwho.club.

## Device verification before submission

- Create a game on iPhone; join using its invitation from another device/browser.
- Complete a mission, confirm a gotcha, exercise voting and view results.
- Share invites and results through the native share sheet; cancel without errors.
- Choose an avatar photo, deny camera access, and use an emoji instead.
- Start a holiday game, take photo proof, and verify the other player can view it.
- Background and reopen the app; check the game reconnects and scores refresh.
- Open an invitation from Messages and confirm it opens the correct lobby.
- Check layouts on iPhone and iPad, including safe areas and large text.

Native iOS background push is not implemented. Browser Web Push is suppressed
inside the native app; in-app events and haptics remain available.

## Review notes draft

Who Got Who is a multiplayer party game with private invitation codes.
No account, email or password is required. Enter a nickname and select an emoji
or optional player photo. Tap Create Game to host. On another device or browser,
open https://whogotwho.club and join using the displayed game code. Both browser
players and app players can play together. Use two players to start a game.
The holiday challenge mode allows optional photo proof shared only within that game.
Camera access is optional; an emoji avatar works without it.

Store support and privacy: https://whogotwho.club/privacy.html.
Existing support email: info@myformatic.com.
Screenshots and privacy/age-rating answers must reflect the tested build;
do not mark the app submitted or approved until App Store Connect confirms it.
