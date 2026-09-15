# Playground app

Playground is a responsive Roblox-inspired base app shell backed by `run.py`. It intentionally contains the platform shell and game placeholders, not the actual games. Add `ttt.html`, `rps.html`, and `car.html` yourself after downloading the workspace.

## Automatic backend selection

- `localhost`, loopback, private LAN IPs, link-local IPs, and `.local` hosts use the existing Python JSON persistence and local cookie authentication.
- Public hosts, including `playground-bittuhere.onrender.com` and all `.onrender.com` hosts, use Firebase Authentication and Firebase Realtime Database.
- For testing, use `?backend=local` or `?backend=firebase`.

The public Firebase project is configured in `site/app.js`. Never put a Firebase service-account private key in frontend files.

## Features

- Animated login/register switch: changing content slides in from the right when opening Register and from the left when returning to Login.
- Username/password Firebase authentication on public hosting and username/email local authentication locally. Public Firebase accounts no longer ask the player for an email; Firebase receives a private internal username-based identifier behind the scenes. Existing accounts from the old email-required flow can use their old email once and are migrated to username login.
- Real account-backed friend requests with incoming request notifications, accept, and decline actions.
- WhatsApp-style private chat layout with conversation list, message bubbles, timestamps, and Firebase/local persistence.
- A larger, high-contrast in-experience menu that stays over the game viewport and removes placeholder-only actions.
- Twenty avatar styles with free and credit-priced premium options.
- Custom in-app select, prompt, and confirm dialogs instead of browser prompt/alert-style UI.
- Responsive home, profile, friends, notifications, marketplace, avatar, messages, and admin experiences.

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

Ready games launch in an immersive in-app player. Landscape addons can set `orientation: "landscape"`; the player uses the Screen Orientation API when available, shows a rotate-phone fallback, and exposes an explicit exit-landscape action.

## Run locally or on a LAN

From the workspace root:

```bash
python run.py
```

Open `http://localhost:8000`. On another device on the same network, use the computer's LAN IP and port 8000. The server binds to `0.0.0.0`.

## Render deployment

Use:

```text
Build Command: pip install -r requirements.txt
Start Command: python run.py
```

The Firebase web client handles hosted player authentication and database writes. To enable the protected admin dashboard, set these Render environment variables:

```text
ADMIN_USERNAME=bittuhere
ADMIN_PASSWORD_SHA256={64 lowercase hexadecimal characters}
FIREBASE_SERVICE_ACCOUNT_JSON={the service-account JSON as a secret environment variable}
FIREBASE_DATABASE_URL=https://playground-bittuhere-default-rtdb.asia-southeast1.firebasedatabase.app
```

Then open:

```text
https://playground-bittuhere.onrender.com/admin
```

`/admin` is a server-authenticated, structured dashboard. If a valid `ADMIN_PASSWORD_SHA256` is not configured, `/admin` itself returns 404 and the admin API returns no data. It does not display password hashes. The admin username defaults to `bittuhere`; the password is never stored in JavaScript or in the repository. Set `ADMIN_PASSWORD_SHA256` to the lowercase SHA-256 digest of the real admin password in Render's Environment settings. With `FIREBASE_SERVICE_ACCOUNT_JSON`, it reads hosted Firebase data through the optional `firebase-admin` dependency. Without that secret, local mode still works and the admin dashboard reports the local JSON source.

Admin protection includes an HttpOnly, SameSite=Strict session cookie, Secure cookies on HTTPS, eight-hour session expiry, server-side credential verification, constant-time comparisons, five-attempt throttling with a fifteen-minute lockout, no admin data before authentication, and no service-account credentials in frontend files. Do not paste the password or its hash into `app.js`, `admin.html`, or any online code tool.

The server handles static files, safe path checking, game discovery, profile persistence, friend requests, chat persistence, feedback, health checks, optional asset manifests, missing routes, admin authentication, and JSON API errors.

## Firebase rules

Paste `site/firebase-database.rules.json` into Firebase Console → Realtime Database → Rules. The rules cover private/public profiles, username reservations, friend requests, friendships, conversations, user conversation indexes, favorites, inventory, settings, and feedback. Authenticated access is required throughout.

