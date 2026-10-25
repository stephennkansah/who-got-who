# Android quick start

Who Got Who now has its own app entry in the existing organisation account:
[Play Console dashboard](https://play.google.com/console/u/2/developers/5302625220640785272/app/4972225190205657515/app-dashboard).

The download is free. Optional paid mission packs are planned for a later update;
their purchase flow and server-side ownership checks are not implemented yet.

1. Keep the existing local signing key and keystore.properties. Do not generate
   a replacement key as part of routine release work.
2. Run `.\build-android.ps1 -IncludeApk`. It runs release lint and builds signed
   Android files outside OneDrive.
3. Use the **new output paths printed by the helper**, under
   `%LOCALAPPDATA%\WhoGotWho\android-build\app\outputs`. The old app/build
   folder can contain stale builds.
4. Configure the Play app signing SHA-256 certificate in
   public/.well-known/assetlinks.json and deploy the website.
5. Test through Play's internal testing track on real phones, then complete
   the listing, app-content forms and review the release before submission.

The served privacy policy is public/privacy.html. The store icon is
public/icons/spy-512.png. No additional developer account is needed.

See [PLAY_STORE_GUIDE.md](PLAY_STORE_GUIDE.md) for the signing distinction,
listing copy, future paid-pack requirements and test steps.
