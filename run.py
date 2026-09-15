#!/usr/bin/env python3
"""Roblox-style local web app server.

Run with:
  python run.py

The server is dependency-free and works on local networks, Render, and other
platforms that provide a PORT environment variable. Put playable HTML games
inside site/games/; the app discovers them automatically.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import shutil
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
SITE_DIR = ROOT / "site"
GAMES_DIR = SITE_DIR / "games"
ASSETS_DIR = SITE_DIR / "assets"
DATA_DIR = SITE_DIR / "data"
PROFILE_FILE = DATA_DIR / "profile.json"
USERS_FILE = DATA_DIR / "users.json"
FEEDBACK_FILE = DATA_DIR / "feedback.jsonl"
GAME_INFO_FILE = GAMES_DIR / "info.json"
SESSION_COOKIE = "playground_session"
SESSIONS: dict[str, str] = {}
# Admin credentials are server-only environment variables. The username defaults
# to bittuhere. Set ADMIN_PASSWORD_SHA256 to the lowercase SHA-256 digest of
# the real password; never put the password or digest in JavaScript.
ADMIN_SESSION_TTL = 8 * 60 * 60
ADMIN_SESSIONS: dict[str, float] = {}
ADMIN_FAILURES: dict[str, tuple[int, float]] = {}
SESSION_LOCK = threading.RLock()
ADMIN_LOCK = threading.RLock()
USER_LOCK = threading.RLock()

DEFAULT_PROFILE = {
    "displayName": "",
    "username": "",
    "avatar": "blue",
    "joined": "",
    "status": "",
    "about": "",
}

# These are intentionally only placeholders. The actual HTML files can be
# dropped into site/games/ after downloading this project.
PLACEHOLDER_GAMES = [
    {
        "id": "tic-tac-toe",
        "title": "Tic Tac Toe",
        "file": "ttt.html",
        "category": "Casual",
        "accent": "violet",
        "description": "A quick classic for two players. Take the center and make your move.",
        "players": "2 players",
        "status": "placeholder",
    },
    {
        "id": "rock-paper-scissors",
        "title": "Rock Paper Scissors",
        "file": "rps.html",
        "category": "Casual",
        "accent": "orange",
        "description": "Challenge the computer and see who can build the longest win streak.",
        "players": "1 player",
        "status": "placeholder",
    },
    {
        "id": "traffic-rider",
        "title": "Traffic Rider",
        "file": "car.html",
        "category": "Racing",
        "accent": "green",
        "description": "Ride through the traffic, chase a high score, and keep your eyes on the road.",
        "players": "1 player",
        "status": "placeholder",
    },
]


def ensure_directories() -> None:
    for directory in (SITE_DIR, GAMES_DIR, ASSETS_DIR, DATA_DIR):
        directory.mkdir(parents=True, exist_ok=True)
    if not PROFILE_FILE.exists():
        PROFILE_FILE.write_text(json.dumps(DEFAULT_PROFILE, indent=2), encoding="utf-8")
    if not USERS_FILE.exists():
        USERS_FILE.write_text("{}", encoding="utf-8")
    readme = GAMES_DIR / "README.md"
    if not readme.exists():
        readme.write_text(
            "# Games\n\nDrop `ttt.html`, `rps.html`, and `car.html` here. The app discovers HTML games automatically.\n",
            encoding="utf-8",
        )


def download_optional_assets() -> None:
    """Download optional assets only when ASSET_MANIFEST_URL is configured.

    The app is fully usable without network assets. This hook is deliberately
    best-effort so a blocked network never prevents the server from starting.
    The manifest format is a JSON object: {"filename.svg": "https://..."}.
    """
    manifest_url = os.environ.get("ASSET_MANIFEST_URL", "").strip()
    if not manifest_url:
        return
    try:
        with urllib.request.urlopen(manifest_url, timeout=8) as response:
            manifest = json.loads(response.read().decode("utf-8"))
        if not isinstance(manifest, dict):
            raise ValueError("asset manifest must be a JSON object")
        for filename, url in manifest.items():
            safe_name = Path(str(filename)).name
            if not safe_name or safe_name != str(filename) or not re.match(r"^[A-Za-z0-9_.-]+$", safe_name):
                continue
            destination = ASSETS_DIR / safe_name
            if destination.exists():
                continue
            try:
                with urllib.request.urlopen(str(url), timeout=8) as source, destination.open("wb") as target:
                    shutil.copyfileobj(source, target)
            except (OSError, urllib.error.URLError) as error:
                print(f"[assets] skipped {safe_name}: {error}", file=sys.stderr)
    except Exception as error:  # optional functionality must never break boot
        print(f"[assets] optional manifest unavailable: {error}", file=sys.stderr)


def read_json_file(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        return fallback


def save_json_file(path: Path, value: Any) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def load_users() -> dict[str, dict[str, Any]]:
    users = read_json_file(USERS_FILE, {})
    return users if isinstance(users, dict) else {}


def normalise_username(value: Any) -> str:
    return str(value or "").strip().lower()


def conversation_id(first: str, second: str) -> str:
    return "__".join(sorted((str(first), str(second))))


def password_hash(password: str, salt: bytes | None = None) -> tuple[str, str]:
    salt_bytes = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, 210_000)
    return salt_bytes.hex(), digest.hex()


def password_matches(password: str, salt_hex: str, expected_hex: str) -> bool:
    try:
        salt = bytes.fromhex(salt_hex)
    except ValueError:
        return False
    _, actual = password_hash(password, salt)
    return hmac.compare_digest(actual, expected_hex)


def safe_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "username": str(user.get("username", "")),
        "displayName": str(user.get("displayName", user.get("username", "Player"))),
        "avatar": str(user.get("avatar", "blue")),
        "joined": str(user.get("joined", "")),
        "status": str(user.get("status", "Ready to play")),
        "about": str(user.get("about", "")),
    }


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {"username": user.get("username", ""), "displayName": user.get("displayName", ""), "avatar": user.get("avatar", "blue"), "status": user.get("status", "Ready to play")}


def slug_for(filename: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", Path(filename).stem.lower()).strip("-") or "game"


def normalise_status(value: Any, file_exists: bool) -> str:
    requested = str(value or "placeholder").strip().lower().replace("_", "-").replace(" ", "-")
    if file_exists:
        return "ready"
    if requested in {"coming-soon", "soon", "coming"}:
        return "coming-soon"
    return "placeholder"


def game_image(filename: Any) -> str | None:
    """Return a safe browser URL for an optional SVG/PNG/JPG game logo."""
    if not isinstance(filename, str) or not filename.strip():
        return None
    relative = filename.strip().replace("\\", "/")
    if relative.startswith("/") or ".." in Path(relative).parts:
        return None
    suffix = Path(relative).suffix.lower()
    if suffix not in {".svg", ".png", ".jpg", ".jpeg", ".webp"}:
        return None
    candidate = (GAMES_DIR / relative).resolve()
    try:
        candidate.relative_to(GAMES_DIR.resolve())
    except ValueError:
        return None
    if not candidate.is_file():
        return None
    return "/games/" + urllib.parse.quote(relative, safe="/")


def game_record(raw: dict[str, Any], file_exists: bool = False) -> dict[str, Any] | None:
    filename = str(raw.get("file", "")).strip()
    if not filename or Path(filename).name != filename or Path(filename).suffix.lower() != ".html":
        return None
    title = str(raw.get("title", "")).strip() or re.sub(r"[-_]+", " ", Path(filename).stem).strip().title() or "Untitled Experience"
    game_id = re.sub(r"[^a-z0-9-]+", "-", str(raw.get("id", "")).strip().lower()).strip("-") or slug_for(filename)
    record = {
        "id": game_id,
        "title": title[:100],
        "file": filename,
        "category": str(raw.get("category", "Experience")).strip()[:40] or "Experience",
        "accent": str(raw.get("accent", "blue")).strip()[:24] or "blue",
        "description": str(raw.get("description", "A custom experience installed in your games folder.")).strip()[:300],
        "players": str(raw.get("players", "See details")).strip()[:40],
        "orientation": str(raw.get("orientation", "any")).strip().lower() if str(raw.get("orientation", "any")).strip().lower() in {"any", "landscape", "portrait"} else "any",
        "status": normalise_status("coming-soon" if raw.get("comingSoon") is True else raw.get("status"), file_exists),
        "comingSoonText": str(raw.get("comingSoonText", "This experience is being prepared.")).strip()[:180],
    }
    image = game_image(raw.get("image") or raw.get("logo"))
    if image:
        record["image"] = image
    return record


def discovered_games() -> list[dict[str, Any]]:
    """Merge info.json metadata with real HTML files in site/games/.

    info.json is optional and safe to edit. Missing HTML files stay visible as
    placeholders or coming-soon entries, while a matching HTML file always
    changes the entry to ready.
    """
    metadata: list[dict[str, Any]] = []
    info = read_json_file(GAME_INFO_FILE, {})
    if isinstance(info, dict) and isinstance(info.get("games"), list):
        metadata = [item for item in info["games"] if isinstance(item, dict)]
    elif isinstance(info, list):
        metadata = [item for item in info if isinstance(item, dict)]

    try:
        files = sorted((path for path in GAMES_DIR.iterdir() if path.is_file() and path.suffix.lower() == ".html"), key=lambda p: p.name.lower())
    except OSError:
        files = []
    html_names = {game_file.name for game_file in files}
    by_file: dict[str, dict[str, Any]] = {}
    for item in metadata:
        record = game_record(item, str(item.get("file", "")).strip() in html_names)
        if record:
            by_file[record["file"]] = record

    # Keep the original three experiences available even if info.json is edited.
    for placeholder in PLACEHOLDER_GAMES:
        if placeholder["file"] not in by_file:
            fallback = dict(placeholder)
            fallback["status"] = normalise_status(fallback.get("status"), fallback["file"] in html_names)
            image = game_image(fallback.get("image"))
            if image:
                fallback["image"] = image
            by_file[fallback["file"]] = fallback

    for game_file in files:
        if game_file.name in by_file:
            continue
        record = game_record({"file": game_file.name}, True)
        if record:
            by_file[game_file.name] = record
    return list(by_file.values())


def safe_site_path(url_path: str) -> Path | None:
    decoded = urllib.parse.unquote(url_path.split("?", 1)[0])
    if "\x00" in decoded:
        return None
    relative = decoded.lstrip("/") or "index.html"
    try:
        candidate = (SITE_DIR / relative).resolve()
        candidate.relative_to(SITE_DIR.resolve())
    except (OSError, ValueError):
        return None
    return candidate


def json_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False).encode("utf-8")


def admin_snapshot_local() -> dict[str, Any]:
    with USER_LOCK:
        users = load_users()
    rows = []
    request_rows = []
    chat_rows = {}
    friend_requests = 0
    conversation_count = 0
    for username, user in users.items():
        requests = user.get("friendRequests", []) if isinstance(user.get("friendRequests", []), list) else []
        friend_requests += len(requests)
        for from_username in requests:
            sender = users.get(from_username, {})
            request_rows.append({"fromUsername": from_username, "fromDisplayName": sender.get("displayName", from_username), "targetUsername": username, "targetDisplayName": user.get("displayName", username)})
        conversations = user.get("conversations", {}) if isinstance(user.get("conversations", {}), dict) else {}
        conversation_count += len(conversations)
        for cid, conversation in conversations.items():
            if not isinstance(conversation, dict): continue
            existing = chat_rows.setdefault(cid, {"id": cid, "participants": cid.replace("__", " · "), "lastMessage": conversation.get("lastMessage", ""), "lastAt": conversation.get("lastAt", 0), "messages": len(conversation.get("messages", []) if isinstance(conversation.get("messages", []), list) else [])})
            if int(conversation.get("lastAt", 0) or 0) > int(existing.get("lastAt", 0) or 0): existing.update({"lastMessage": conversation.get("lastMessage", ""), "lastAt": conversation.get("lastAt", 0)})
        rows.append({
            "username": username,
            "displayName": user.get("displayName", username),
            "email": user.get("email", ""),
            "avatar": user.get("avatar", "blue"),
            "status": user.get("status", ""),
            "joined": user.get("joined", ""),
            "createdAt": user.get("createdAt", 0),
            "friends": len(user.get("friends", []) if isinstance(user.get("friends", []), list) else []),
            "pendingRequests": len(requests),
            "conversations": len(conversations),
        })
    feedback = []
    try:
        for line in FEEDBACK_FILE.read_text(encoding="utf-8").splitlines()[-50:]:
            entry = json.loads(line)
            if isinstance(entry, dict): feedback.append({"message": str(entry.get("message", ""))[:1000], "at": entry.get("at", 0)})
    except (OSError, ValueError, TypeError):
        pass
    rows.sort(key=lambda row: int(row.get("createdAt", 0) or 0), reverse=True)
    return {"source": "local", "stats": {"users": len(rows), "pendingFriendRequests": friend_requests, "conversations": len(chat_rows), "feedback": len(feedback)}, "users": rows, "requests": request_rows, "chats": sorted(chat_rows.values(), key=lambda row: int(row.get("lastAt", 0) or 0), reverse=True), "feedback": list(reversed(feedback))}


def firebase_admin_root() -> Any | None:
    service_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if not service_json:
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials, db
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(credentials.Certificate(json.loads(service_json)), {"databaseURL": os.environ.get("FIREBASE_DATABASE_URL", "https://playground-bittuhere-default-rtdb.asia-southeast1.firebasedatabase.app")})
        return db.reference("/").get() or {}
    except Exception as error:
        print(f"[admin] Firebase Admin unavailable: {error}", file=sys.stderr)
        return None


def admin_snapshot_firebase() -> dict[str, Any] | None:
    root = firebase_admin_root()
    if root is None or not isinstance(root, dict): return None
    users = root.get("users", {}) if isinstance(root.get("users", {}), dict) else {}
    friends = root.get("friends", {}) if isinstance(root.get("friends", {}), dict) else {}
    pending = root.get("friendRequests", {}) if isinstance(root.get("friendRequests", {}), dict) else {}
    conversations = root.get("userConversations", {}) if isinstance(root.get("userConversations", {}), dict) else {}
    rows = []
    request_rows = []
    chat_rows = []
    for target_uid, entries in pending.items():
        if isinstance(entries, dict):
            for from_uid, request in entries.items():
                if isinstance(request, dict): request_rows.append({"fromUsername": request.get("fromUsername", from_uid), "fromDisplayName": request.get("fromDisplayName", from_uid), "targetUsername": request.get("targetUid", target_uid), "targetDisplayName": ""})
    conversation_root = root.get("conversations", {}) if isinstance(root.get("conversations", {}), dict) else {}
    for cid, conversation in conversation_root.items():
        if not isinstance(conversation, dict): continue
        members = conversation.get("members", {}) if isinstance(conversation.get("members", {}), dict) else {}
        messages = conversation.get("messages", {}) if isinstance(conversation.get("messages", {}), dict) else {}
        latest = max(messages.values(), key=lambda entry: int(entry.get("createdAt", 0) or 0)) if messages else {}
        chat_rows.append({"id": cid, "participants": " · ".join(members.keys()), "lastMessage": latest.get("text", ""), "lastAt": latest.get("createdAt", 0), "messages": len(messages)})
    for uid, user in users.items():
        if not isinstance(user, dict): continue
        friend_count = len(friends.get(uid, {}) if isinstance(friends.get(uid, {}), dict) else {})
        request_count = len(pending.get(uid, {}) if isinstance(pending.get(uid, {}), dict) else {})
        chat_count = len(conversations.get(uid, {}) if isinstance(conversations.get(uid, {}), dict) else {})
        rows.append({"uid": uid, "username": user.get("username", ""), "displayName": user.get("displayName", ""), "email": user.get("email", ""), "avatar": user.get("avatar", "blue"), "status": user.get("status", ""), "joined": user.get("joined", ""), "updatedAt": user.get("updatedAt", 0), "friends": friend_count, "pendingRequests": request_count, "conversations": chat_count})
    feedback_root = root.get("feedback", {}) if isinstance(root.get("feedback", {}), dict) else {}
    feedback = []
    for uid, entries in feedback_root.items():
        if isinstance(entries, dict):
            for entry_id, entry in entries.items():
                if isinstance(entry, dict): feedback.append({"uid": uid, "id": entry_id, "message": str(entry.get("message", ""))[:1000], "at": entry.get("at", 0)})
    rows.sort(key=lambda row: int(row.get("updatedAt", 0) or 0), reverse=True)
    return {"source": "firebase", "stats": {"users": len(rows), "pendingFriendRequests": len(request_rows), "conversations": len(chat_rows), "feedback": len(feedback)}, "users": rows, "requests": request_rows, "chats": sorted(chat_rows, key=lambda row: int(row.get("lastAt", 0) or 0), reverse=True), "feedback": sorted(feedback, key=lambda entry: int(entry.get("at", 0) or 0), reverse=True)[:100]}


class AppHandler(BaseHTTPRequestHandler):
    server_version = "PlaygroundServer/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        # Keep Render and LAN logs useful without dumping request bodies.
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))

    def _admin_cookie(self, token: str, max_age: int = ADMIN_SESSION_TTL) -> str:
        secure = os.environ.get("COOKIE_SECURE", "").lower() in {"1", "true", "yes"} or self.headers.get("X-Forwarded-Proto", "").lower() == "https"
        value = f"playground_admin={token}; Max-Age={max_age}; Path=/; HttpOnly; SameSite=Strict"
        return value + ("; Secure" if secure else "")

    def _admin_client_id(self) -> str:
        # Render places the app behind a proxy. The first forwarded address is
        # used for throttling only; credentials are never logged or echoed.
        forwarded = self.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        return forwarded or self.client_address[0]

    def _admin_current(self) -> bool:
        try:
            cookies = SimpleCookie(self.headers.get("Cookie", ""))
            token = cookies.get("playground_admin").value if cookies.get("playground_admin") else ""
        except (ValueError, AttributeError):
            token = ""
        now = time.time()
        with ADMIN_LOCK:
            expired = [key for key, expires in ADMIN_SESSIONS.items() if expires <= now]
            for key in expired: ADMIN_SESSIONS.pop(key, None)
            return bool(token and token in ADMIN_SESSIONS)

    def _require_admin(self) -> bool:
        if not self._admin_current():
            self._send_json({"authenticated": False, "error": "Admin authentication required"}, 401)
            return False
        return True

    def _send_bytes(self, body: bytes, status: int = 200, content_type: str = "text/plain; charset=utf-8", cache: bool = False) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY" if self.path.split("?", 1)[0] in {"/admin", "/admin/"} or self.path.startswith("/api/admin/") else "SAMEORIGIN")
        if self.path.split("?", 1)[0] in {"/admin", "/admin/"}:
            self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("Cache-Control", "public, max-age=300" if cache else "no-store")
        response_cookie = getattr(self, "response_cookie", None)
        if response_cookie:
            self.send_header("Set-Cookie", response_cookie)
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _send_json(self, value: Any, status: int = 200) -> None:
        self._send_bytes(json_bytes(value), status, "application/json; charset=utf-8")

    def _read_body(self) -> dict[str, Any] | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 1_000_000:
                return None
            raw = self.rfile.read(length) if length else b"{}"
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else None
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
            return None

    def _current_user(self) -> tuple[str, dict[str, Any]] | None:
        try:
            cookies = SimpleCookie(self.headers.get("Cookie", ""))
            token = cookies.get(SESSION_COOKIE).value if cookies.get(SESSION_COOKIE) else ""
        except (ValueError, AttributeError):
            token = ""
        if not token:
            return None
        with SESSION_LOCK:
            username = SESSIONS.get(token)
        if not username:
            return None
        with USER_LOCK:
            user = load_users().get(username)
        return (username, user) if isinstance(user, dict) else None

    def _require_user(self) -> tuple[str, dict[str, Any]] | None:
        user = self._current_user()
        if not user:
            self._send_json({"authenticated": False, "error": "Authentication required"}, 401)
        return user

    def _auth_cookie(self, token: str, max_age: int = 2_592_000) -> str:
        secure = os.environ.get("COOKIE_SECURE", "").lower() in {"1", "true", "yes"} or self.headers.get("X-Forwarded-Proto", "").lower() == "https"
        flags = f"{SESSION_COOKIE}={token}; Max-Age={max_age}; Path=/; HttpOnly; SameSite=Lax"
        return flags + ("; Secure" if secure else "")

    def _auth_payload(self, user: dict[str, Any]) -> dict[str, Any]:
        return {"authenticated": True, "user": public_user(user), "profile": safe_user(user)}

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path in {"/admin", "/admin/"}:
            configured_hash = os.environ.get("ADMIN_PASSWORD_SHA256", "").strip().lower()
            if not re.fullmatch(r"[0-9a-f]{64}", configured_hash):
                self._send_bytes(b"Not found", 404)
                return
            admin_file = SITE_DIR / "admin.html"
            if admin_file.is_file(): self._send_bytes(admin_file.read_bytes(), 200, "text/html; charset=utf-8")
            else: self._send_bytes(b"Admin panel is not installed", 503)
            return
        if path == "/api/admin/me":
            self._send_json({"authenticated": self._admin_current()})
            return
        if path == "/api/admin/overview":
            if not self._require_admin(): return
            if os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON"):
                snapshot = admin_snapshot_firebase()
                if snapshot is None:
                    self._send_json({"error": "Firebase Admin is not available. Check firebase-admin installation and FIREBASE_SERVICE_ACCOUNT_JSON."}, 503)
                    return
                self._send_json(snapshot)
            else:
                self._send_json(admin_snapshot_local())
            return
        if path == "/api/health":
            self._send_json({"ok": True, "service": "roblox-style-playground", "time": int(time.time())})
            return
        if path == "/api/config":
            self._send_json({"appName": "Playground", "theme": "dark", "gamesDirectory": "site/games", "authentication": True})
            return
        if path == "/api/auth/me":
            current = self._current_user()
            if not current:
                self._send_json({"authenticated": False}, 401)
            else:
                self._send_json(self._auth_payload(current[1]))
            return
        if path == "/api/games":
            self._send_json({"games": discovered_games()})
            return
        if path == "/api/profile":
            current = self._require_user()
            if current:
                self._send_json(safe_user(current[1]))
            return
        if path == "/api/people":
            current = self._require_user()
            if current:
                username = current[0]
                with USER_LOCK:
                    people = [{"uid": key, **public_user(user)} for key, user in load_users().items() if key != username]
                self._send_json({"people": people})
            return
        if path == "/api/friends":
            current = self._require_user()
            if current:
                friends = current[1].get("friends", []) if isinstance(current[1].get("friends", []), list) else []
                pending = current[1].get("pendingRequests", []) if isinstance(current[1].get("pendingRequests", []), list) else []
                incoming_names = current[1].get("friendRequests", []) if isinstance(current[1].get("friendRequests", []), list) else []
                with USER_LOCK:
                    users = load_users()
                    friend_profiles = [{"uid": name, **public_user(users[name])} for name in friends if name in users]
                    pending_profiles = [{"uid": name, **public_user(users[name])} for name in pending if name in users]
                    incoming_profiles = [{"uid": name, "fromUid": name, "fromUsername": name, "fromDisplayName": users[name].get("displayName", name), "fromAvatar": users[name].get("avatar", "blue"), "username": name, "displayName": users[name].get("displayName", name), "avatar": users[name].get("avatar", "blue")} for name in incoming_names if name in users]
                self._send_json({"friends": friend_profiles, "pending": pending_profiles, "incoming": incoming_profiles})
            return
        if path == "/api/messages":
            current = self._require_user()
            if current:
                conversations = current[1].get("conversations", {}) if isinstance(current[1].get("conversations", {}), dict) else {}
                values = []
                for cid, conversation in conversations.items():
                    if isinstance(conversation, dict): values.append({"id": cid, **conversation})
                values.sort(key=lambda item: int(item.get("lastAt", 0) or 0), reverse=True)
                self._send_json({"conversations": values})
            return
        if path == "/api/activity":
            current = self._require_user()
            if current:
                self._send_json({"items": []})
            return
        if path.startswith("/api/"):
            self._send_json({"error": "Not found"}, 404)
            return
        self._serve_static(path)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/admin/login":
            data = self._read_body() or {}
            configured_user = os.environ.get("ADMIN_USERNAME", "bittuhere").strip()
            configured_hash = os.environ.get("ADMIN_PASSWORD_SHA256", "").strip().lower()
            # Only the digest is accepted. Never place the password or digest
            # in frontend code or committed files.
            username = str(data.get("username", "")).strip()
            password = str(data.get("password", ""))
            client_id = self._admin_client_id()
            now = time.time()
            with ADMIN_LOCK:
                failures, locked_until = ADMIN_FAILURES.get(client_id, (0, 0.0))
                if locked_until > now:
                    self._send_json({"error": "Too many failed attempts. Try again later."}, 429)
                    return
                if locked_until:
                    ADMIN_FAILURES.pop(client_id, None)
            valid_hash_format = bool(re.fullmatch(r"[0-9a-f]{64}", configured_hash))
            password_hash_matches = valid_hash_format and hmac.compare_digest(hashlib.sha256(password.encode("utf-8")).hexdigest(), configured_hash)
            valid = bool(configured_user and configured_hash and len(username) <= 120 and len(password) <= 256 and hmac.compare_digest(username.casefold(), configured_user.casefold()) and password_hash_matches)
            if not valid:
                with ADMIN_LOCK:
                    failures += 1
                    if failures >= 5:
                        ADMIN_FAILURES[client_id] = (failures, now + 15 * 60)
                    else:
                        ADMIN_FAILURES[client_id] = (failures, 0.0)
                self._send_json({"error": "Incorrect admin credentials."}, 401)
                return
            with ADMIN_LOCK:
                ADMIN_FAILURES.pop(client_id, None)
            token = secrets.token_urlsafe(48)
            with ADMIN_LOCK: ADMIN_SESSIONS[token] = now + ADMIN_SESSION_TTL
            self.response_cookie = self._admin_cookie(token)
            self._send_json({"authenticated": True, "expiresIn": ADMIN_SESSION_TTL})
            return
        if parsed.path == "/api/admin/logout":
            try:
                cookies = SimpleCookie(self.headers.get("Cookie", ""))
                token = cookies.get("playground_admin").value if cookies.get("playground_admin") else ""
            except (ValueError, AttributeError): token = ""
            with ADMIN_LOCK: ADMIN_SESSIONS.pop(token, None)
            self.response_cookie = self._admin_cookie("", 0)
            self._send_json({"authenticated": False})
            return
        if parsed.path == "/api/auth/register":
            data = self._read_body()
            username = normalise_username(data.get("username") if data else "")
            display_name = str(data.get("displayName", "")).strip() if data else ""
            email = str(data.get("email", "")).strip().lower() if data else ""
            password = str(data.get("password", "")) if data else ""
            if not re.fullmatch(r"[a-z0-9_]{3,20}", username):
                self._send_json({"error": "Username must be 3–20 characters using letters, numbers, or underscores."}, 400)
                return
            if len(display_name) < 2 or len(display_name) > 40:
                self._send_json({"error": "Display name must be 2–40 characters."}, 400)
                return
            if email and (len(email) > 120 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email)):
                self._send_json({"error": "Enter a valid email address or leave it blank."}, 400)
                return
            if len(password) < 8 or len(password) > 128:
                self._send_json({"error": "Password must be 8–128 characters."}, 400)
                return
            with USER_LOCK:
                users = load_users()
                if username in users or any(email and user.get("email", "").lower() == email for user in users.values()):
                    self._send_json({"error": "That username or email is already registered."}, 409)
                    return
                salt, digest = password_hash(password)
                user = {
                    "username": username,
                    "displayName": display_name,
                    "email": email,
                    "passwordSalt": salt,
                    "passwordHash": digest,
                    "avatar": "blue",
                    "joined": time.strftime("%B %Y"),
                    "status": "Ready to play",
                    "about": "Exploring the world one experience at a time.",
                    "friends": [],
                    "friendRequests": [],
                    "pendingRequests": [],
                    "createdAt": int(time.time()),
                }
                users[username] = user
                try:
                    save_json_file(USERS_FILE, users)
                except OSError:
                    self._send_json({"error": "Account storage is not writable on this host."}, 503)
                    return
            token = secrets.token_urlsafe(32)
            with SESSION_LOCK:
                SESSIONS[token] = username
            self.response_cookie = self._auth_cookie(token)
            self._send_json(self._auth_payload(user), 201)
            return
        if parsed.path == "/api/auth/login":
            data = self._read_body()
            identifier = str(data.get("identifier", "")).strip().lower() if data else ""
            password = str(data.get("password", "")) if data else ""
            with USER_LOCK:
                users = load_users()
                username = identifier if identifier in users else next((key for key, user in users.items() if user.get("email", "").lower() == identifier), "")
                user = users.get(username)
            if not user or not password_matches(password, str(user.get("passwordSalt", "")), str(user.get("passwordHash", ""))):
                self._send_json({"error": "Incorrect username, email, or password."}, 401)
                return
            token = secrets.token_urlsafe(32)
            with SESSION_LOCK:
                SESSIONS[token] = username
            self.response_cookie = self._auth_cookie(token)
            self._send_json(self._auth_payload(user))
            return
        if parsed.path == "/api/auth/logout":
            try:
                cookies = SimpleCookie(self.headers.get("Cookie", ""))
                token = cookies.get(SESSION_COOKIE).value if cookies.get(SESSION_COOKIE) else ""
            except (ValueError, AttributeError):
                token = ""
            with SESSION_LOCK:
                SESSIONS.pop(token, None)
            self.response_cookie = self._auth_cookie("", 0)
            self._send_json({"authenticated": False})
            return
        if parsed.path == "/api/friends/request":
            current = self._require_user()
            data = self._read_body()
            target = normalise_username(data.get("username") if data else "")
            if not current:
                return
            if not target or target == current[0]:
                self._send_json({"error": "Choose another player."}, 400)
                return
            with USER_LOCK:
                users = load_users()
                if target not in users:
                    self._send_json({"error": "Player not found."}, 404)
                    return
                target_requests = users[target].setdefault("friendRequests", [])
                pending = users[current[0]].setdefault("pendingRequests", [])
                if current[0] not in target_requests:
                    target_requests.append(current[0])
                if target not in pending:
                    pending.append(target)
                try:
                    save_json_file(USERS_FILE, users)
                except OSError:
                    self._send_json({"error": "Friend storage is not writable on this host."}, 503)
                    return
            self._send_json({"ok": True, "target": target})
            return
        if parsed.path in {"/api/friends/accept", "/api/friends/decline"}:
            current = self._require_user()
            data = self._read_body()
            target = normalise_username(data.get("username") if data else "")
            if not current: return
            if not target or target == current[0]:
                self._send_json({"error": "Choose a valid request."}, 400)
                return
            with USER_LOCK:
                users = load_users()
                owner = users.get(current[0], {})
                incoming = owner.get("friendRequests", []) if isinstance(owner.get("friendRequests", []), list) else []
                if target not in incoming or target not in users:
                    self._send_json({"error": "That friend request is no longer available."}, 404)
                    return
                owner["friendRequests"] = [name for name in incoming if name != target]
                users[target]["pendingRequests"] = [name for name in users[target].get("pendingRequests", []) if name != current[0]]
                if parsed.path.endswith("/accept"):
                    owner["friends"] = list(dict.fromkeys(owner.get("friends", []) + [target]))
                    users[target]["friends"] = list(dict.fromkeys(users[target].get("friends", []) + [current[0]]))
                try: save_json_file(USERS_FILE, users)
                except OSError:
                    self._send_json({"error": "Friend storage is not writable on this host."}, 503)
                    return
            self._send_json({"ok": True})
            return
        if parsed.path == "/api/messages/send":
            current = self._require_user()
            data = self._read_body()
            target = normalise_username(data.get("username") if data else "")
            text = str(data.get("message", "")).strip()[:1000] if data else ""
            if not current: return
            if not target or target == current[0] or not text:
                self._send_json({"error": "Choose a recipient and write a message."}, 400)
                return
            with USER_LOCK:
                users = load_users()
                if target not in users:
                    self._send_json({"error": "Player not found."}, 404)
                    return
                cid = conversation_id(current[0], target)
                now = int(time.time() * 1000)
                message = {"id": secrets.token_urlsafe(9), "senderUid": current[0], "senderUsername": current[0], "senderDisplayName": current[1].get("displayName", current[0]), "text": text, "createdAt": now}
                sender = users[current[0]]
                recipient = users[target]
                sender_conversations = sender.setdefault("conversations", {})
                recipient_conversations = recipient.setdefault("conversations", {})
                sender_conv = sender_conversations.setdefault(cid, {"otherUid": target, "otherUsername": target, "otherDisplayName": recipient.get("displayName", target), "otherAvatar": recipient.get("avatar", "blue"), "messages": []})
                recipient_conv = recipient_conversations.setdefault(cid, {"otherUid": current[0], "otherUsername": current[0], "otherDisplayName": sender.get("displayName", current[0]), "otherAvatar": sender.get("avatar", "blue"), "messages": []})
                sender_conv.setdefault("messages", []).append(message)
                recipient_conv.setdefault("messages", []).append(message)
                for conv in (sender_conv, recipient_conv):
                    conv["lastMessage"] = text
                    conv["lastAt"] = now
                try: save_json_file(USERS_FILE, users)
                except OSError:
                    self._send_json({"error": "Message storage is not writable on this host."}, 503)
                    return
            self._send_json({"ok": True, "conversationId": cid, "message": message})
            return
        if parsed.path == "/api/profile":
            current_user = self._require_user()
            if not current_user:
                return
            current_username, current_record = current_user
            data = self._read_body()
            if data is None:
                self._send_json({"error": "Send a JSON object"}, 400)
                return
            updated = dict(current_record)
            for key in ("displayName", "avatar", "status", "about"):
                if key in data:
                    value = str(data[key]).strip()
                    if len(value) > (40 if key == "displayName" else 240):
                        self._send_json({"error": f"{key} is too long"}, 400)
                        return
                    updated[key] = value
            if updated.get("avatar") not in {"blue", "pink", "green", "orange", "purple", "ice", "ember", "aurora", "cobalt", "berry", "lime", "midnight", "coral", "royal", "gold", "nebula", "cyber", "lava", "mono", "pixel"}:
                updated["avatar"] = "blue"
            with USER_LOCK:
                users = load_users()
                users[current_username] = updated
                try:
                    save_json_file(USERS_FILE, users)
                except OSError:
                    self._send_json({"error": "Profile storage is not writable on this host"}, 503)
                    return
            self._send_json(safe_user(updated))
            return
        if parsed.path == "/api/feedback":
            if not self._require_user():
                return
            data = self._read_body()
            if data is None or not str(data.get("message", "")).strip():
                self._send_json({"error": "A message is required"}, 400)
                return
            entry = {"message": str(data["message"])[:1000], "at": int(time.time())}
            try:
                with FEEDBACK_FILE.open("a", encoding="utf-8") as output:
                    output.write(json.dumps(entry) + "\n")
            except OSError:
                self._send_json({"error": "Feedback storage is not writable on this host"}, 503)
                return
            self._send_json({"ok": True})
            return
        self._send_json({"error": "Not found"}, 404)

    def _serve_static(self, path: str) -> None:
        candidate = safe_site_path(path)
        if candidate is None:
            self._send_bytes(b"Not found", 404)
            return
        # Browsers request /games/file.html directly. Only serve real files.
        if candidate.is_file():
            try:
                data = candidate.read_bytes()
            except OSError:
                self._send_bytes(b"Unable to read file", 500)
                return
            content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
            if content_type.startswith("text/") or candidate.suffix in {".js", ".css", ".html", ".svg", ".json"}:
                content_type += "; charset=utf-8"
            self._send_bytes(data, 200, content_type, cache=candidate.parent == ASSETS_DIR)
            return
        # Client-side routing: unknown non-file routes render the app shell.
        if not Path(path).suffix and (SITE_DIR / "index.html").is_file():
            self._send_bytes((SITE_DIR / "index.html").read_bytes(), 200, "text/html; charset=utf-8")
            return
        self._send_bytes(b"Not found", 404)


def main() -> None:
    ensure_directories()
    download_optional_assets()
    host = os.environ.get("HOST", "0.0.0.0")
    try:
        port = int(os.environ.get("PORT", "8000"))
    except ValueError:
        port = 8000
    port = max(1, min(port, 65535))
    httpd = ThreadingHTTPServer((host, port), AppHandler)
    httpd.daemon_threads = True
    print(f"Playground is running on http://{host}:{port}")
    print(f"Games folder: {GAMES_DIR}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
