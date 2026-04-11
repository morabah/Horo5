<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Horo5 context

- Storefront UI lives under `../web/src` and is mounted from this app (`experimental.externalDir`). Shared code must stay **SSR-safe**: no `localStorage` / `sessionStorage` / `navigator` in the initial render path unless defaults match the server.
- Repo-wide guidance and how `doc/*` maps to this project: **[`../AGENTS.md`](../AGENTS.md)**.
- Deep React/Next practice reference: **[`../doc/Agent.md`](../doc/Agent.md)**.
