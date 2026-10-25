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
   are saved. The primary category is Games / Casual.
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

## Device verification checklist

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

## Verified release state: 25 October 2026

- Version **1.0 (build 1)** was submitted at **22:36 UTC**. App Store Connect
  explicitly confirmed **Waiting for Review**. It is not yet approved or live.
  Submission: https://appstoreconnect.apple.com/apps/6826935487/distribution/reviewsubmissions/details/50568498-b784-4832-a16f-cb885ebeb56f
- Automatic release after approval is selected. Price is free, with all 175
  storefronts selected, subject to Apple's regional availability requirements.
- Four iPhone and four iPad screenshots are attached. They were captured on
  Apple's simulators using the real UI components and fictional players.
  Privacy details are published; age rating is Apple's calculated 13+ with
  regional exceptions. Stephen confirmed the artwork and mission packs are
  original; the content-rights answer is saved. Review contact details are
  stored privately in App Store Connect, not in this public repository.
- Build 1 uses source commit `3681f9ff58869ef344999ec822512d43e3411b42`.
  Signed upload passed: https://github.com/dentistrydashboard/myformatic-frontend/actions/runs/40238259526
  Simulator build passed: https://github.com/stephennkansah/who-got-who/actions/runs/40237396424
  Screenshot capture passed: https://github.com/stephennkansah/who-got-who/actions/runs/40239539023
- Internal TestFlight group **Who Got Who testing** contains build 1 and the
  existing account holder, who was invited. Test instructions are saved.
- Browser checks with two separate test identities passed creating/joining,
  starting, revealing a mission, claiming and accepting a gotcha, score sync,
  reloading and ending the game. The test game was ended afterward.
- Real-device camera, share sheet, background/resume and rotation checks remain
  to be completed through TestFlight. Do not describe those as verified.
- The public Apple app-association URL returned 404 during this release. Native
  invitation-link routing still needs a hosting deployment and verification;
  game-code entry and browser play work. AWS access was unavailable locally and
  the connected AWS service requested reauthentication.
- This build uses Xcode 26.2. Full iPhone Duo optimisation is deferred: rebuild
  with Xcode 27.1 or later, test both displays and resizing, then capture genuine
  Duo screenshots. No Duo optimisation badge is claimed for build 1.

## Reviewer access

Who Got Who is a multiplayer party game with private invitation codes.
No account, email or password is required. Enter a nickname and select an emoji
or optional player photo. Tap Let's Play, enter a nickname, then Start a New Game
to host. Continue through the rules to the lobby. On another device or browser,
open https://whogotwho.club and join using the displayed game code. Both browser
players and app players can play together. Use two players to start a game, and
set Settling-in time to None for immediate testing. The full tested steps are
saved in App Store Connect's review notes.
The holiday challenge mode allows optional photo proof shared only within that game.
Camera access is optional; an emoji avatar works without it.

Store support and privacy: https://whogotwho.club/privacy.html.
Existing support email: info@myformatic.com.
Screenshots and privacy/age-rating answers must reflect the tested build;
do not mark the app submitted or approved until App Store Connect confirms it.
