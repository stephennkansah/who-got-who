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
   Amplify Hosting redirects extensionless paths to a trailing slash (`/x` →
   `/x/`), which Apple will not follow, so the file is also published as
   `apple-app-site-association.json`. In the Amplify console → Hosting →
   Rewrites and redirects, add as the **first** rule: source
   `/.well-known/apple-app-site-association`, target
   `/.well-known/apple-app-site-association.json`, type **200 (Rewrite)**.
   Check with `curl -I https://whogotwho.club/.well-known/apple-app-site-association`
   (must be 200, JSON, no redirect). Apple's CDN can take a day to refresh.

## Lock-screen alerts (Apple Push Notification service)

The app asks for notification permission in the lobby, registers with Apple
and sends its device token to the game (`SAVE_PUSH` with `apnsToken`). The
server sends alerts with an APNs auth key (`amplify/functions/game-api/apns.ts`).
Alerts stay off until all of this is done:

1. developer.apple.com → Identifiers → `club.whogotwho.app`: tick
   **Push Notifications** and save (automatic signing then includes it).
2. developer.apple.com → Keys → **+**: enable *Apple Push Notifications
   service (APNs)*, download the `.p8` file once, and note its 10-character Key ID.
3. Amplify console → Hosting → **Secrets**: `APNS_PRIVATE_KEY` = the `.p8`
   file's contents (pasting it on one line is fine).
4. Hosting → **Environment variables**: `APNS_KEY_ID` = the Key ID, and
   `APNS_ENABLED` = `true`. Redeploy.
5. Ship an iOS build made from this commit or later (it adds the
   `aps-environment` entitlement and the token hand-off in `AppDelegate.swift`).

Never commit the `.p8` key or paste it into chat. Without step 4 the backend
deploys as before and iPhone alerts are simply skipped.

## Device verification checklist

- Create a game on iPhone; join using its invitation from another device/browser.
- Complete a mission, confirm a gotcha, exercise voting and view results.
- Share invites and results through the native share sheet; cancel without errors.
- Choose an avatar photo, deny camera access, and use an emoji instead.
- Start a holiday game, take photo proof, and verify the other player can view it.
- Background and reopen the app; check the game reconnects and scores refresh.
- Open an invitation from Messages and confirm it opens the correct lobby.
- Check layouts on iPhone and iPad, including safe areas and large text.

Browser Web Push is suppressed inside the native app; lock-screen alerts there
come through Apple once the APNs setup above is complete. Verify on a device:
allow notifications in the lobby, lock the phone, and have another player claim
a gotcha or bust you.

## iOS 1.0.3: prepared 10 November 2026

`MARKETING_VERSION` is `1.0.3`; the workflow sets the build number from its
run number. This build carries the redesign, so it changes every screen.
Source commit `2f2769e837794ec546c0d426b7bfaace9ce209ee`, pushed as the tag
`ios-1.0.3-source` only. `main` on GitHub was not moved, so the website and
the Android app still show the previous design until `main` is pushed.

- Check passed on 10 November 2026: 82 tests, typecheck, simulator compile and
  launch on iPhone 16 Pro (new welcome screen shown). The bundle reports 1.0.3:
  https://github.com/dentistrydashboard/myformatic-frontend/actions/runs/42845567964
- Signed upload succeeded as **1.0.3 (build 7)** ("Upload succeeded", export
  succeeded): https://github.com/dentistrydashboard/myformatic-frontend/actions/runs/42846702143
- Not yet done: confirming in App Store Connect that Apple finished processing
  build 7, adding it to the TestFlight group, and submitting 1.0.3 for review.
  1.0.2 was still Waiting for Review when last checked on 8 November.

New for iPhone players since 1.0.2:

- A new look: dark rounded panels, cream paper kept for missions and pop-up
  sheets, one red button per screen. The play screen puts missions first and
  moves How to play, Sounds, Host controls and Leave into one Menu button.
- The ending is a show: podium, each player's missions revealed in turn,
  awards, then a personal "Your Night" screen with a shareable picture.
- Rules are four swipe cards. Guests get a warm-up card while they wait.
- A 3-2-1 countdown when the host starts, a "You're In!" stamp when you join,
  and a "So close" banner when someone could win with their next gotcha.
- A group vote pops up on its own. The host's Start button sits under the code.
- Game sounds for shared moments, with an on/off switch in the Menu.
- The share pictures are drawn by hand so they also work on iOS 15.

Draft "What's New" text for App Store Connect:

> • A whole new look: cleaner, darker and easier to read at a party.
> • A proper ending: a podium, every secret mission revealed, awards, and your
> own "Your Night" card to share.
> • Quicker to learn: the rules are now four swipe cards.
> • More drama: a 3-2-1 start, sounds, and a warning when someone is one
> gotcha from winning.

Real-device checks remain unverified for this build: the new layouts on a
small iPhone and on iPad, sounds with the Ring/Silent switch, the share sheet
for both pictures, and the animations.

## iOS 1.0.2: submitted 8 November 2026

`MARKETING_VERSION` is `1.0.2`; the workflow sets the build number from its
run number. Source commit `b9280416c62a1f07f39811c527475e9787c133c2`.

- Check passed on 8 November 2026: tests, typecheck, simulator compile and
  launch (welcome screen shown). The bundle reports 1.0.2 and includes the
  how-to-play video: https://github.com/dentistrydashboard/myformatic-frontend/actions/runs/42514599689
- Signed upload succeeded as **1.0.2 (build 5)**: https://github.com/dentistrydashboard/myformatic-frontend/actions/runs/42515087630
- Replaced the pending 1.0.1 submission. Apple confirmed **1 Item Submitted** and **1.0.2 Waiting for Review** at approximately 19:34 UTC on 8 November 2026. Automatic release after approval remains selected.
- Submission: https://appstoreconnect.apple.com/apps/6826935487/distribution/reviewsubmissions/details/4555fc0e-715a-437a-8f5e-a4aab311cd1a
- Reviewer instructions now include choosing a pack before the lobby and the bundled how-to-play video.

New for iPhone players since 1.0.1 (source commit `0726d180`):

- Hosts choose a pack straight after Start a New Game, before the lobby opens,
  so every pack (including new releases) is seen. The lobby's Change link still
  works. 1.0 and 1.0.1 still auto-pick Core Pack and go straight to the lobby.
- A one-minute "Watch how it works" video (about 5 MB, bundled with the app)
  in How to Play and in the rules.

Draft "What's New" text for App Store Connect:

> • Pick your game first: when you host, you now choose a pack before the lobby
> opens, so you'll always see every pack, including new ones as they arrive.
> • Watch how it works: a one-minute video in How to Play shows the whole game,
> start to finish.

Real-device checks remain unverified: pack picker, video with and without sound, lock-screen alerts and invitation links. Stephen authorised submitting without waiting for these checks.

## Push setup and iOS 1.0.1: 8 November 2026

- Push Notifications is enabled and saved for `club.whogotwho.app`.
- APNs key **Who Got Who Push**, Key ID `M9944JY5X6`, is configured for
  Sandbox & Production under team `T3PAKNXT8A`. It is team-scoped.
- The private key is stored as Amplify's encrypted `APNS_PRIVATE_KEY` secret
  for app `d34y6yuzpmd94v` in `eu-west-2`. Do not print or commit its value.
- Amplify environment variables `APNS_KEY_ID=M9944JY5X6` and
  `APNS_ENABLED=true` are saved. Deployment job **96** succeeded; the live game Lambda is Active with a successful update and the APNs key/secret binding configured.
- The AASA 200 rewrite is the first hosting rule. The public extensionless
  URL was verified as HTTP 200, `application/json`, without a redirect and
  with app ID `T3PAKNXT8A.club.whogotwho.app` and the invitation query matcher.
- Version 1.0.1 uses source commit `0726d1806845fa0c2edf38207c44ae26089f1cb9`.
  All 59 frontend tests, backend checks and TypeScript checking passed.
  Simulator compilation and launch passed:
  https://github.com/dentistrydashboard/myformatic-frontend/actions/runs/42500313059
- Signed upload succeeded:
  https://github.com/dentistrydashboard/myformatic-frontend/actions/runs/42500956554
- Apple processed **1.0.1 (build 3)**. It is available to the existing internal group **Who Got Who testing**; testing instructions are saved. The account holder still shows Invited, with no install recorded. The App Store 1.0.1 entry is saved with build 3, release notes and automatic release after approval selected. Stephen authorised submitting now without waiting for real-device testing. Submitted on 8 November 2026 at approximately 16:52 UTC. Apple confirmed **1 Item Submitted** and **1.0.1 Waiting for Review**. Submission: https://appstoreconnect.apple.com/apps/6826935487/distribution/reviewsubmissions/details/4ce58adb-5ed5-4344-8e85-c14f82fd68d8
- Lock-screen delivery and native invitation opening still need a real iPhone
  test with this new build. A successful upload alone does not verify these.

## Historical release state: 25 October 2026

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
to host. Choose a pack (Core Pack is fine), then continue through the rules to the
lobby (from 1.0.2; earlier builds go straight to the lobby). On another device or browser,
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
