# Agent instructions

## Unlisted pages

`/neworleans`, `/flights`, and `/stocks` are intentionally unlisted.

- They must stay deployed and reachable at those URLs. Do not delete their page files, routes, or build entries.
- They must never be linked from the nav, footer, home page, sitemap, or any other page.
- They must keep `<meta name="robots" content="noindex, nofollow">`.
- `robots.txt` must disallow `/neworleans`, `/flights`, and `/stocks`.
- In `src/site/pages.js` they are marked `unlisted: true`. Nav, the home directory, and any index built from that list must keep filtering them out. Do not drop the flag or add them back.
