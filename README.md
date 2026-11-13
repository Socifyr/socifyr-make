# Socifyr — Make Custom App

The full [Make](https://www.make.com) SDK-app definition for Socifyr: one API-key connection,
seven modules (create/schedule text, media posts, publish draft, get, search, delete), and a
`make-cli` publish script.

## Prerequisites

```bash
npm install -g @makehq/cli
make-cli login        # token scopes: sdk-apps:read, sdk-apps:write
```

## Validate offline

```bash
pnpm --filter @socifyr/make-app validate
```

Parses every section file under `app/` — catches JSON errors before touching Make.

## Publish (create or update)

```bash
pnpm --filter @socifyr/make-app publish
```

Idempotent: duplicate `create` calls are skipped, sections are always re-set. Set
`MAKE_APP_VERSION=2` to publish a new app version.

## Layout

```
app/
├── base.json                     # baseUrl + Bearer header (inherited by all modules)
├── connection/parameters.json    # apiKey, baseUrl
├── docs.md                       # in-Make app documentation
└── modules/<name>/{parameters,api,interface}.json
```

## Testing before publication

Make requires you to test each module against a live connection in the app editor (or via
scenario) before requesting publication to the Make community library:

1. Connect with a real Socifyr API key (it selects its own workspace; a test key with `requireApproval`
   guardrail on is ideal while iterating).
2. Run **Create a Text Post** to `telegram-...`/`discord-...` (zero-review platforms) for the
   cheapest test loop.
3. Verify **Search Posts** / **Get a Post** return the module's output fields.
4. Submit for Make review via the editor (Publish).

## Notes

- Optional text parameters are sent as `null` when empty (via IML `if(immediate(...))`) — the
  Socifyr API accepts nulls for all optional fields.
- Comma-separated `connections`/`medias` inputs are turned into JSON arrays with IML `split()`.
  Extra spaces around slugs are trimmed server-side.
- Media posts reference **media library IDs or public URLs** — Make can't stream binaries into
  this module; upload first if needed.
- Publish events (webhooks) are available via Make's generic *Webhooks → Custom webhook* module
  with HMAC verification — see https://socifyr.com/docs/webhooks.
