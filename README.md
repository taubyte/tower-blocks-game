# Game Landing (Static)

Static landing page with three sections:

- Leaderboard + Play button with dimmed video background
- About section with an elegant embedded how-to player (Plyr)
- Linktree-style links grid

Deployed easily to GitHub Pages.

- Video background: in `index.html` replace the video `src` in the `#bg-video` element with your gameplay video.
- Game link: update the Play button href in `index.html`.
- Leaderboard API: `script.js` uses `https://9uaqltej2.g.k8s.cyou/api/leaderboard`. Adjust if needed.
- About copy: edit the paragraph in the About section.
- Links: update the placeholders in the Links section.

## Local preview

Open `index.html` directly in a browser, or serve locally for best results:

```bash
npx serve .
```

1. Create a GitHub repo and push these files to the `main` branch.
2. In GitHub, go to Settings → Pages → Build and deployment → Deploy from a branch.
3. Select branch `main`, folder `/root`, then save.
4. After it builds, your site will be available at the Pages URL.
