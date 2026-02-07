# alanmarcero.com

Personal website for a music producer showcasing synthesizer patch banks and YouTube music content. Meridian theme — editorial design with indigo accents on deep navy-black backgrounds.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│   S3 (Frontend)  │     │  YouTube API    │
│   (CDN + HTTPS) │     │   Static React   │     │                 │
└─────────────────┘     └──────────────────┘     └────────▲────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│    Route 53     │     │     Lambda       │──────────────┘
│   (DNS)         │     │  (Playlist API)  │
└─────────────────┘     └──────────────────┘
```

**Cost-optimized AWS setup:**
- S3 + CloudFront for static frontend hosting
- Single Lambda with Function URL (no API Gateway costs)
- No database — patch bank data is hardcoded, YouTube data is fetched on-demand

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7 |
| Styling | CSS custom properties, Google Fonts (Inter, DM Serif Display) |
| Lambda | TypeScript, Node.js |
| Testing | Jest 30, React Testing Library |
| Hosting | S3, CloudFront, Lambda Function URL |
| CI/CD | GitHub Actions |
| DNS/TLS | Route 53, CloudFront (ACM) |

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── BackToTop.jsx          # Scroll-to-top button (uses useScrollPosition)
│   │   ├── BackToTop.test.jsx     # BackToTop tests (4 tests)
│   │   ├── Footer.jsx             # Footer with social links + dynamic year
│   │   ├── Footer.test.jsx        # Footer tests (4 tests)
│   │   ├── Hero.jsx               # Hero section: image, name, bio, CTA, search + clear
│   │   ├── Hero.test.jsx          # Hero tests (11 tests)
│   │   ├── MusicItem.jsx          # YouTube playlist item display
│   │   ├── MusicItem.test.jsx     # MusicItem tests (5 tests)
│   │   ├── NoResults.jsx          # Empty state for search with no matches
│   │   ├── NoResults.test.jsx     # NoResults tests (3 tests)
│   │   ├── PatchBankItem.jsx      # Patch bank card with download button
│   │   ├── PatchBankItem.test.jsx # PatchBankItem tests (7 tests)
│   │   ├── SkeletonCard.jsx       # Loading placeholder with shimmer animation
│   │   ├── SkeletonCard.test.jsx  # SkeletonCard tests (5 tests)
│   │   ├── YouTubeEmbed.jsx       # Shared YouTube iframe component
│   │   └── YouTubeEmbed.test.jsx  # YouTubeEmbed tests (7 tests)
│   ├── hooks/
│   │   ├── useScrollPosition.js      # Custom hook: scroll threshold detection
│   │   └── useScrollPosition.test.js # useScrollPosition tests (7 tests)
│   ├── data/
│   │   ├── patchBanks.js         # Hardcoded patch bank catalog
│   │   └── patchBanks.test.ts    # Data validation tests (6 tests)
│   ├── config.js                 # Centralized config (Lambda URL, external URLs)
│   ├── config.test.ts            # Config tests (6 tests)
│   ├── App.jsx                   # Main app: data fetching, search filtering, layout
│   ├── App.test.jsx              # App integration tests (25 tests)
│   ├── App.css                   # Full stylesheet: Meridian theme, animations, responsive
│   └── main.jsx                  # React entry point
├── public/
│   ├── banks/                    # Downloadable patch zip files
│   └── about-me.webp             # Hero profile image (circular, indigo border)
├── index.html                    # Entry HTML with Google Fonts
├── index.ts                      # AWS Lambda handler
├── index.local.ts                # Local Lambda dev runner
├── index.test.ts                 # Lambda tests (8 tests)
├── .npmrc                        # Forces npm.org registry (overrides corporate)
└── .github/workflows/deploy.yml  # GitHub Actions CI/CD
```

**Total: 98 tests across 13 suites**

## Key Files

- `src/App.jsx` — Main component: fetches music from Lambda, client-side search filtering, renders Hero + sections
- `src/App.css` — Complete stylesheet: CSS custom properties, Meridian indigo palette, sharp cards, animations, responsive
- `src/components/Hero.jsx` — Centered stacked hero: circular profile image, serif name, uppercase tagline, ghost CTA, search input with clear button
- `src/config.js` — Centralized external URLs (Lambda, YouTube, GitHub, PayPal)
- `src/hooks/useScrollPosition.js` — Custom hook returning boolean when scroll exceeds a threshold
- `src/data/patchBanks.js` — Static patch bank catalog (add new releases here)
- `index.ts` — Fetches YouTube playlist, transforms response, returns JSON with Content-Type headers

## Design System

**Theme:** Meridian — editorial, sophisticated design with indigo accents on deep navy-black backgrounds. Dark mode only. Inspired by premium music magazines.

**Fonts:** Inter 400/500/600 (body, buttons, tagline), DM Serif Display 400 (headings) via Google Fonts.

**CSS Custom Properties (App.css `:root`):**

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#6366f1` | Indigo violet |
| `--accent-primary-light` | `#818cf8` | Hover states, tagline |
| `--accent-primary-dark` | `#4f46e5` | PayPal button |
| `--bg-body` | `#0a0c14` | Deep navy-black |
| `--bg-surface` | `#12141f` | Card backgrounds (solid) |
| `--bg-surface-hover` | `#181a28` | Card hover |
| `--bg-surface-alt` | `#0e1019` | Alternating sections |
| `--bg-footer` | `#060710` | Footer |
| `--text-primary` | `#f8fafc` | Crisp cool white |
| `--text-secondary` | `#cbd5e1` | Slate gray |
| `--text-muted` | `#64748b` | Muted |

**Shared CSS classes:**
- `.btn-primary` — Solid indigo button with 6px radius (used by download, PayPal buttons)
- `.hero-cta` — Ghost/outlined CTA button (transparent bg, indigo border, fills on hover)
- `.store-item` — Sharp card (4px radius, solid bg, 2px indigo top border, lift on hover)
- `.section-title` — Centered serif heading with thin centered 1px underline (60px wide)
- `.section--alt` — Alternating section background tone
- `.content-grid` — Responsive grid layout for patch bank and music sections
- `.skeleton-card` — Loading placeholder card with indigo shimmer animation
- `.back-to-top` / `.back-to-top--visible` — Fixed indigo square button (6px radius)
- `.no-results` — Centered empty state message for search
- `.search-clear` — Clear button inside search input

**Key visual characteristics:**
- No grain texture, no scanlines, no frosted glass — clean solid backgrounds
- No backdrop-filter usage anywhere
- Cards: 4px border-radius, solid backgrounds, 2px indigo top border
- Buttons: 6px border-radius (not pill-shaped)
- Hero image: circular (border-radius: 50%), indigo border
- Hero tagline: uppercase, letter-spacing 2px, Inter 600

**Animations:**
- Staggered card entry via `--card-index` CSS custom property (80ms delay per card)
- `@keyframes shimmer` — Indigo gradient sweep for skeleton loading cards
- `@media (prefers-reduced-motion: reduce)` — Disables all animations and transitions
- Smooth scroll behavior (`html { scroll-behavior: smooth }`)

**Responsive breakpoints:**
- Desktop: 3-column grid (default)
- Tablet (max-width: 1024px): 2-column grid, smaller hero text
- Mobile (max-width: 767px): 1-column grid, compact hero

## Component Architecture

```
App
├── Hero (searchQuery, onSearchChange)
│   ├── Profile image (circular, indigo border)
│   ├── Name (serif, 4.5rem)
│   ├── Tagline (uppercase, tracked, indigo)
│   ├── Bio paragraph
│   ├── YouTube CTA (ghost button)
│   └── Search input (6px radius) + clear button
├── SkeletonCard[] (×3, shown during loading)
├── NoResults (query) — shown when search yields no matches
├── Patch Banks section
│   └── PatchBankItem[] (bank, style={--card-index})
│       ├── Name, description
│       ├── YouTubeEmbed[] (videoId)
│       └── Download button (.btn-primary)
├── Music section
│   └── MusicItem[] (item, style={--card-index})
│       ├── Title
│       ├── YouTubeEmbed (videoId)
│       └── Description
├── Donate section
│   └── PayPal button (.btn-primary)
├── Footer
│   ├── Social links (YouTube, GitHub)
│   └── Dynamic copyright year
└── BackToTop (uses useScrollPosition hook)
```

## Development

```bash
npm install                    # Install dependencies
npm run dev                    # Vite dev server (requires Node.js 20.19+)
npm test                       # Jest (98 tests)
npm run build                  # Vite production build
npm run build:ts               # Compile Lambda TypeScript
npx ts-node index.local.ts     # Run Lambda locally
```

**Node.js requirement:** Vite 7 requires Node.js 20.19+ or 22.12+. Use `nvm use 20.19.6` if your default version is older.

**Note:** `.npmrc` overrides corporate CodeArtifact registry to use public npm.org. Shell hooks may interfere with npm commands; use `--prefix /Users/alan.marcero/Documents/alanmarcero-com` if running from a different directory.

## Environment Variables

| Variable | Description | Where |
|----------|-------------|-------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Lambda environment |

## Lambda Details

- **Endpoint:** `https://hh2nvebg2jac4yabkprsserxcq0lvhid.lambda-url.us-east-1.on.aws/`
- **Playlist ID:** `PLjHbhxiY56y28ezRPYzMi3lzV3nMQt-1c`
- **Max Results:** 50 items per request

## Deployment

**Automatic via GitHub Actions** — pushes to `main` trigger deployment.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `S3_BUCKET_NAME` | S3 bucket for frontend |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `LAMBDA_FUNCTION_NAME` | Lambda function name |

### Manual Deployment

```bash
# Frontend
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete

# Lambda
npm run build:ts
cd dist && zip -r ../lambda.zip index.js
aws lambda update-function-code --function-name YOUR-FUNCTION --zip-file fileb://lambda.zip
```

## Adding New Patch Banks

1. Add zip file to `public/banks/`
2. Add entry to `src/data/patchBanks.js`:
```javascript
{
  name: 'Patch Bank Name',
  description: 'Description of the patches',
  audioDemo: ['YOUTUBE_VIDEO_ID'],
  downloadLink: '/banks/filename.zip'
}
```
3. Push to `main` (auto-deploys) or manually build and sync

## Data Model

**No database** — intentional for cost optimization:
- Patch banks: Hardcoded in `src/data/patchBanks.js` (11 entries)
- Music items: Fetched live from YouTube API via Lambda
- Search: Client-side filtering in React (case-insensitive, matches name + description)

## Image Generation

Images are generated via the **Stability AI** MCP tool and converted to webp using `cwebp` (installed via `brew install webp`).

**Current images:**

| File | Aspect Ratio | Usage | Style |
|------|-------------|-------|-------|
| `public/about-me.webp` | 1:1 (1536x1536) | Hero circular avatar (180x180 CSS, indigo border) | Currently outrun style — needs regeneration for Meridian theme |

**Note:** No background image used. No grain texture. Clean solid backgrounds only.

**Generation guidelines:**
- Use the `stability-ai-generate-image` MCP tool
- Match the site's Meridian palette: indigo (`#6366f1`), deep navy-black (`#0a0c14`)
- Hero image: use `1:1` aspect ratio, `photographic` style preset, focus on synthesizers/music production gear with cool-toned lighting
- Negative prompts should exclude: text, watermarks, logos, people, blurry/low quality, warm tones, amber, orange
- Convert PNG output to webp: `cwebp -q 85 input.png -o output.webp`
- Delete intermediate PNG files after conversion

**Regenerating images:**
```bash
# After generating with Stability AI MCP tool:
cwebp -q 85 public/about-me-meridian.png -o public/about-me.webp
rm public/*-meridian.png
```

## Future Feature Ideas

**Planned:**
- Photo portfolio section (public gallery for studio/gear/live shots)
- Admin photo upload (hidden, password-protected, uploads to S3)
- Payment processing for patch banks (Stripe Checkout + Lambda)

**Other ideas:**

| Feature | Effort |
|---------|--------|
| Mailing list signup (Buttondown/Mailchimp free tier) | Low |
| Soundcloud/Spotify embeds alongside YouTube | Low |
| Gear list page with photos | Low |
| Patch request form | Low |
| Blog/news section (static markdown) | Medium |
| Download counter via Lambda | Medium |
| Audio previews (MP3 clips per patch bank) | Medium |
| Preset browser (filter by synth/genre/type) | High |
