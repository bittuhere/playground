# Playground app

This is a dark, responsive Roblox-inspired base app shell backed by the dependency-free `run.py` server in the workspace root. The app now has an account gate: register or log in before entering the dashboard. Account records are stored in `site/data/users.json` with salted PBKDF2 password hashes; passwords are never returned by the API.

## Add a new game addon

Put the playable HTML and its optional logo in `site/games/`, then add an object to `site/games/info.json`:

```json
{
  "id": "my-game",
  "title": "My Game",
  "file": "my-game.html",
  "image": "my-game.svg",
  "category": "Casual",
  "accent": "blue",
  "description": "A short description.",
  "players": "1 player",
  "orientation": "landscape",
  "status": "coming-soon"
}
```

Supported logo formats are SVG, PNG, JPG, JPEG, and WEBP. Use `status: "coming-soon"` to publish a polished card before the HTML game is ready. A matching HTML file automatically becomes playable.

```text
site/games/my-game.html
site/games/my-game.svg
```

Open **Discover → Refresh games**. Ready games launch in an immersive in-app player with a loading transition, return-to-details control, sound-state toggle, and full-screen control. Landscape addons can set `orientation: "landscape"`; the player uses the Screen Orientation API when available, has a phone-rotate instruction animation as a fallback, and always exposes an exit-landscape path. The player stays in the dashboard instead of opening a new browser tab.

## Run locally or on a LAN

From the workspace root:

```bash
python run.py
```

Open `http://localhost:8000`. On another device on the same network, use the computer's LAN IP and port 8000. The server already binds to `0.0.0.0`.

## Render

Use `python run.py` as the Start Command. The server reads Render's `PORT` environment variable automatically and does not need third-party packages or a build step.

The server handles static files, safe path checking, game discovery, profile persistence, feedback, health checks, optional asset manifests, missing routes, and JSON API errors. `ASSET_MANIFEST_URL` is an optional environment variable for a JSON object of filename-to-URL asset downloads; the app remains fully usable without it.
