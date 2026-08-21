# AWS setup

Who Got Who uses AWS Amplify Gen 2. The backend is defined in `amplify/` and deploys:

- Cognito guest identities, so players can join without creating accounts
- AppSync for the game API and real-time update signals
- Lambda for server-authoritative rules, scoring, disputes, privacy filtering, and rate limits
- DynamoDB for expiring game state and rate-limit counters
- S3 for private avatar and proof uploads with a 30-day lifecycle

The task catalogue stays in the Lambda bundle. The browser only receives the current player's pending tasks and public results.

## Local development

Requirements: Node.js 20 or 22 and an AWS profile with permission to create Amplify sandbox resources.

```powershell
npm ci
npx ampx configure profile
npm run sandbox
```

The sandbox command writes the generated client configuration to `public/amplify_outputs.json`. Leave it running, then start the React app in a second terminal:

```powershell
npm start
```

The generated output file is ignored by Git. Delete the personal sandbox when it is no longer needed:

```powershell
npm run sandbox:delete
```

## Production deployment

1. Connect this repository to AWS Amplify Hosting.
2. Use the repository's `amplify.yml` build settings.
3. Give the Amplify service role permission to deploy the Gen 2 backend.
4. Deploy the branch. The pipeline deploys the backend, copies the generated `amplify_outputs.json` into the web build, then builds the React app.
5. Point `whogotwho.club` at the Amplify Hosting app and verify HTTPS, `/privacy.html`, game creation, joining from a second device, disputes, and image uploads.

Do not add AWS access keys or generated output files to source control. Amplify Hosting supplies deployment credentials through its service role.

## Verification

```powershell
npm run typecheck
npm run backend:check
$env:CI='true'
npm run build
npm test -- --runInBand
npm audit --omit=dev
```

Game records expire after seven days while active and after one day when ended. Uploaded media expires after 30 days. The Games table retains point-in-time recovery and is protected from stack deletion; the disposable rate-limit table is not.
