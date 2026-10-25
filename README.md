# Who Got Who

Who Got Who is a mobile-first party game for completing secret social tasks without getting caught. It can run as a Progressive Web App in a browser or through the Android Trusted Web Activity wrapper in this repository.

## Game modes

### Traditional

- 2-18 players with the Core Pack, 2-13 with the Remote Pack
- 7 tasks per player, or 8 in games with 7 or more players
- No two players ever get the same task, swaps included
- 2 task swaps per player, fewer in the biggest groups so swaps never run out of unused tasks
- A target must accept a successful Gotcha or dispute it
- Uninvolved players vote on disputes; the host default resolves a tie
- A valid Gotcha scores 1 point, plus 0.5 for a first-time target
- The target score depends on the host's game length: Quick 3, Party 4, Long 8, Weekend 12 (one or two more in games with 7 or more players)
- The host also sets a settling-in time before gotchas open, how long targets have to answer a claim, and can pause the game
- Disputes need at least one uninvolved player to vote; in 2-player games claims are settled out loud
- Late arrivals can join a live game with a full hand of tasks; the host can remove players
- When the game ends every player's tasks are revealed, and anyone can open a one-tap rematch for the group

### Holiday Challenge

- 2-20 players
- The server selects 10 challenges for the game, 12 for 9-12 players, or 15 for 13 or more
- First completion earns 3 gold points
- The next two completions can earn 1 silver point each
- Challenges marked for proof require an image upload, shown to the group in a live feed and trip album
- The win condition scales with the player count

## Architecture

- React 18 and TypeScript frontend
- React Router and a Context/useReducer client state layer
- AWS Amplify Gen 2 deployment definition
- Cognito guest identities for account-free play
- AppSync queries, mutations, and real-time update signals
- Lambda for authoritative rules, validation, scoring, privacy filtering, and rate limits
- DynamoDB for temporary game state
- Private S3 paths for avatars and optional proof images
- A small service worker at `public/sw.js` and a Web App Manifest

Pending task text is only returned to the player who owns it. The full task catalogue is bundled with Lambda under `amplify/functions/game-api/`, not shipped in the browser JavaScript.

## Local development

An AWS sandbox is required for multiplayer actions. See [AWS_SETUP.md](AWS_SETUP.md) for AWS credentials, sandbox creation, production hosting, and retention details.

```powershell
npm ci
npx ampx configure profile
npm run sandbox
```

Leave the sandbox running and start the frontend in another terminal:

```powershell
npm start
```

The app opens at `http://localhost:3000`. The sandbox writes its generated client configuration to `public/amplify_outputs.json`; that file is ignored by Git.

## Verification

```powershell
npm run typecheck
npm run backend:check
$env:CI='true'
npm run build
npm test -- --runInBand
npm audit --omit=dev
```

Build the signed Android App Bundle with:

```powershell
.\gradlew.bat :app:bundleRelease
```

## Important paths

```text
amplify/
  auth/resource.ts                 Cognito configuration
  data/resource.ts                 AppSync schema
  functions/game-api/domain.ts     Authoritative game rules
  functions/game-api/handler.ts    DynamoDB, S3, and resolver integration
  functions/game-api/packs.ts      Private task and challenge catalogue
  storage/resource.ts              Per-identity media access
src/
  components/                      Screens and reusable UI
  context/AwsGameContext.tsx       AWS client state and actions
  data/packCatalog.ts              Public pack metadata only
  services/aws.ts                  Amplify client configuration and uploads
public/
  manifest.json                    PWA metadata
  privacy.html                     Published privacy policy
  sw.js                            Offline application-shell cache
```

## Privacy and safety

Games expire after 7 days of inactivity, ended games after about 24 hours, and uploaded media within 30 days. Photo uploads are optional and should only include people who have agreed to be photographed. The served policy is available at `/privacy.html`.

Task contributions should be safe, consent-aware, achievable in social settings, and should not ask players to expose private messages, passwords, live locations, or another person's device data.
