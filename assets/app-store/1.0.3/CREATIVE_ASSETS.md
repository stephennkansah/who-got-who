# Who Got Who App Store creative assets

Prepared 11 November 2026 using the built-in image generation tool.

## Apple upload status — 11 November 2026

Header v1 and search v2 were uploaded successfully to Who Got Who's Asset Library. Apple classified the header as 21:9 / Product Page Header and search v2 as 3:2 / Search Results. Both were submitted together; Apple confirmed **2 Items Submitted**. Submission: https://appstoreconnect.apple.com/apps/6826935487/distribution/reviewsubmissions/details/e091dadd-5ac2-4717-aea2-1ac234e082dd

The artwork-only submission above was cancelled on 11 November at approximately 13:28 UTC because Apple blocked the 1.0.3 submission while its selected assets were in a separate review. Both assets remain selected on version 1.0.3, which was then submitted successfully. Apple confirmed **1 Item Submitted** and **1.0.3 Waiting for Review** at approximately 13:30 UTC. Current submission: https://appstoreconnect.apple.com/apps/6826935487/distribution/reviewsubmissions/details/7b8a2634-562d-4e26-b891-2a9ad4e4ec1e

Four new iPhone and four new iPad screenshots of the redesigned release UI are uploaded and saved. See `screenshots/manifest.json` for capture provenance and file hashes. Apple approval remains pending. The preparation notes below are historical.

## Deliverables

Latest search creative: `who-got-who-search-v2.png`, 1920 × 1280, 24-bit RGB PNG without alpha. Stephen changed the example to: **Drop something and get someone to pick it up.** Use v2 instead of v1. Generated with the built-in image tool and mechanically exported to the required size. Uploaded and selected on version 1.0.3.

V2 edit prompt: Edit this exact Who Got Who promotional artwork. Change ONLY the large black mission sentence on the cream card to exactly: 'Drop something and get someone to pick it up.' Replace the old magic trick sentence entirely. Suggested three lines: 'Drop something' / 'and get someone' / 'to pick it up.' Make this exact text large, bold, beautifully legible, same typeface as original, fit within the cream card and never overlap the red GOTCHA stamp. Keep everything else unchanged: WHO GOT WHO title, subtitle, red underline, red YOUR SECRET MISSION header, spy face and hat, red GOTCHA stamp, black textured background, cream card, colour palette and composition. Output one finished opaque RGB PNG at 1920 x 1280 if possible, preserving 3:2 aspect ratio. No new elements or extra words.

- `who-got-who-header-v1.png`: 3840 × 1646 pixels, 24-bit RGB PNG, no alpha.
- `who-got-who-search-v1.png`: 1920 × 1280 pixels, 24-bit RGB PNG, no alpha.

These are promotional illustrations, not screenshots of gameplay. They use the existing spy mascot, the midnight/cream/red palette, conceptual mission cards and an actual example mission from `src/components/RulesContent.tsx`. No UI, awards, prices, download claims or platform badges are invented. No names or personal information appear.

Generated masters were 1915 × 821 and 1536 × 1024 pixels; the deliverables were mechanically resampled to Apple's required dimensions, without additional creative edits. Text and composition were visually inspected and exported dimensions and pixel format were checked. Apple accepted the uploads and their previews were inspected. Approval remains pending.

Apple specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications

Apple creative guidance: https://developer.apple.com/app-store/asset-best-practices/

## Final prompts

### Header

Create a finished App Store product-page HEADER creative for the existing party game WHO GOT WHO. Use case: ads-marketing. Input image is the game's own spy mascot: preserve its recognisable cream fedora with vivid red hatband, black face and expressive cream eyes. This is promotional illustration, not a screenshot or an invented app UI. Exact required output canvas: 3840 x 1646 pixels, ultra-wide 21:9 landscape, opaque RGB PNG, no transparency. Premium playful graphic design matching a midnight-black, warm cream and vermilion-red party game. Rich almost-black background with subtle paper grain. Keep the important artwork and words in the middle 70% of the canvas, with ample dark breathing room on the outside. A dynamic but very clean editorial composition: on the central left, very large bold condensed cream lettering in two lines reading exactly 'WHO GOT WHO'; underneath, a smaller highly legible single line 'Secret missions. Real friends.' On the central right, the supplied spy mascot peeks mischievously over two slightly angled warm cream mission-card shapes, a small red stamped 'GOTCHA!' on the front card. Cards are conceptual artwork, with no tiny text, no controls, no real-person names. Precise polished edges, confident typography, restrained paper-cut depth, attractive professional game key art, playful rather than threatening. Do not add phones, devices, store badges, prices, web URLs, awards, ratings, download buttons, watermarks, weapons or unrelated gaming imagery. One strong focal point; no visual clutter. The resulting deliverable is a single header image, not a sheet of options.

Reference: `public/mascots/mission.png`.

### Search results

Use case: ads-marketing. Create a second coordinated finished App Store SEARCH RESULTS creative for WHO GOT WHO, a real-world party game in which friends secretly perform missions on each other. Image 1 is the approved visual-style reference for this campaign; image 2 is the existing mascot to preserve faithfully. This asset must be newly composed at exactly 1920 x 1280 pixels, 3:2 landscape, opaque RGB PNG. Keep the same rich almost-black paper-grain background, cream typography and vermilion red, condensed bold playful type, cream paper cards and recognisable cream fedora with red band and mischievous eyes. Much more compact composition than the wide header. Upper central band: 'WHO GOT WHO' in large beautifully spaced condensed cream capitals. Immediately below in clear smaller cream type: 'The party game of secret missions'. Lower middle: a single oversized cream mission card, tilted only slightly, with a tiny red heading 'YOUR SECRET MISSION' and large perfectly readable black words exactly 'Get someone to show you a magic trick.' This is a real mission from the game. Show the spy mascot playfully peeking around the upper-right edge of this card, small enough to give the mission text room. A restrained separate angled red 'GOTCHA!' stamp overlaps only a blank lower corner of the card, never obscuring the mission text. Keep text and face within central 80% of the image with generous margins. Confident professional editorial illustration, crisp detail, very legible at App Store thumbnail size, no tiny text. This is conceptual game artwork, NOT a fabricated screenshot: no phones, no device frames, no app controls, no invented UI, no hands, no actual magic performance, no prices, no platform logos, no awards or star ratings, no URLs, no watermark. Make clear it is a social party game, not gambling or a video-game spy adventure. Deliver one single final 3:2 image.

References: generated header and `public/mascots/mission.png`. The word 'approved' in the prompt means selected internally as the stylistic reference; it does not indicate Apple or user approval.
