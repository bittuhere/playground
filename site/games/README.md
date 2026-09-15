# Games folder

Place your game files and their optional logos here:

```text
site/games/ttt.html
site/games/ttt.svg
site/games/rps.html
site/games/rps.svg
site/games/car.html
site/games/car.svg
```

Game metadata lives in `info.json`. Each entry can define:

- `id`, `title`, `file`
- `image` — SVG, PNG, JPG, JPEG, or WEBP filename
- `category`, `accent`, `description`, `players`
- `status` — `placeholder`, `coming-soon`, or `ready`
- `orientation` — `any`, `portrait`, or `landscape`
- `comingSoonText` — optional message shown for a coming-soon card

A matching `.html` file automatically changes the card to `ready`. Open **Discover → Refresh games** after adding files. Every ready game opens inside the app's immersive in-app player; there is no new-tab handoff.
