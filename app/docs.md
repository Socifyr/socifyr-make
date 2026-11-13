# Socifyr

Publish and schedule posts on **15 social platforms** — Instagram, LinkedIn, X, TikTok, Facebook,
YouTube, Threads, Pinterest, Reddit, Bluesky, Telegram, Discord, Mastodon, Nostr, Slack — from Make.

## Connection

- **Socifyr API key (`sk_...`)** — create one in Socifyr → Dashboard → API Keys. Use a dedicated
  key for Make and give it **agent guardrails** (daily post limit, X spend cap, require-approval)
  so an runaway scenario can't spam your accounts. The key belongs to one workspace, so posts go
  to the workspace you created it in; no workspace ID is needed.

## Modules

| Module | Purpose |
|---|---|
| Create a Text Post | Immediate text post to `connections` (comma-separated slugs) |
| Schedule a Text Post | Future-dated post (ISO 8601, optional IANA timezone) |
| Create a Media Post | Photos / Video / Document from media-library IDs or public URLs |
| Publish a Draft | Dispatch a draft created elsewhere |
| Get a Post | Current status of one post |
| Search Posts | Filtered, paginated post history |
| Delete a Post | Remove a post or draft |

Connection slugs look like `instagram-mybrand` — you'll find them under Socifyr → Connected
Accounts. Media must be referenced by **media library ID or public URL**; upload files first via
the HTTP module or Socifyr's media endpoints.

Docs: https://socifyr.com/docs · API reference: https://socifyr.com/docs/api
